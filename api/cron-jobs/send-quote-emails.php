
<?php
    require_once dirname(__DIR__, 1) . "/include/conn.php";
    // every 5 minutes

    // if (PHP_SAPI !== "cli") {
    //     http_response_code(403);
    //     exit("Forbidden");
    // }

    $batchSize = 20;
    $processed = 0;
    $deleted = 0;
    $failed = 0;

    try {
        $conn->beginTransaction();

        $resetExpired = $conn->prepare("
            UPDATE portal_quote_email_queue
            SET
                status = 'FAILED',
                locked_at = NULL,
                next_attempt_at = NOW(),
                last_error = 'Previous processing lock expired.',
                updated_at = NOW()
            WHERE status = 'PROCESSING'
            AND locked_at IS NOT NULL
            AND locked_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)
            AND attempts < max_attempts
        ");
        $resetExpired->execute();

        $expireExhausted = $conn->prepare("
            UPDATE portal_quote_email_queue
            SET
                status = 'FAILED',
                locked_at = NULL,
                next_attempt_at = NULL,
                last_error = 'Maximum email attempts reached.',
                updated_at = NOW()
            WHERE status = 'PROCESSING'
            AND locked_at IS NOT NULL
            AND locked_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)
            AND attempts >= max_attempts
        ");
        $expireExhausted->execute();

        $selectQueue = $conn->prepare("
            SELECT id
            FROM portal_quote_email_queue
            WHERE status IN ('PENDING', 'FAILED')
            AND attempts < max_attempts
            AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
            ORDER BY created_at ASC
            LIMIT ?
            FOR UPDATE
        ");

        $selectQueue->bindValue(1, $batchSize, PDO::PARAM_INT);
        $selectQueue->execute();

        $queueIds = $selectQueue->fetchAll(PDO::FETCH_COLUMN);

        $claimQueue = $conn->prepare("
            UPDATE portal_quote_email_queue
            SET
                status = 'PROCESSING',
                locked_at = NOW(),
                updated_at = NOW()
            WHERE id = ?
            AND status IN ('PENDING', 'FAILED')
        ");

        $claimedIds = [];

        foreach ($queueIds as $queueId) {
            $claimQueue->execute([$queueId]);

            if ($claimQueue->rowCount() > 0) {
                $claimedIds[] = $queueId;
            }
        }

        $conn->commit();

        $deleteQueue = $conn->prepare("
            DELETE FROM portal_quote_email_queue
            WHERE id = ?
            AND status = 'PROCESSING'
        ");

        $updateFailed = $conn->prepare("
            UPDATE portal_quote_email_queue
            SET
                status = 'FAILED',
                attempts = ?,
                next_attempt_at = DATE_ADD(NOW(), INTERVAL ? MINUTE),
                locked_at = NULL,
                last_error = ?,
                updated_at = NOW()
            WHERE id = ?
            AND status = 'PROCESSING'
        ");

        $getAttempts = $conn->prepare("
            SELECT attempts, max_attempts
            FROM portal_quote_email_queue
            WHERE id = ?
            AND status = 'PROCESSING'
            LIMIT 1
        ");

        foreach ($claimedIds as $queueId) {
            try {
                $getQueue = $conn->prepare("
                    SELECT
                        q.id,
                        q.quote_request_id,
                        q.recipient_email,
                        q.recipient_name,
                        q.subject,
                        q.attempts,
                        q.max_attempts,
                        r.quote_reference,
                        r.company_name,
                        r.contact_person,
                        r.phone,
                        r.bill_of_lading,
                        r.vessel_name,
                        r.voyage_number,
                        r.origin,
                        r.destination,
                        r.expected_arrival,
                        r.cargo_category,
                        r.requirements,
                        r.containers_count
                    FROM portal_quote_email_queue q
                    INNER JOIN portal_quote_requests r
                        ON r.id = q.quote_request_id
                    WHERE q.id = ?
                    AND q.status = 'PROCESSING'
                    LIMIT 1
                ");

                $getQueue->execute([$queueId]);
                $queue = $getQueue->fetch(PDO::FETCH_ASSOC);

                if (!$queue) {
                    continue;
                }

                $getContainers = $conn->prepare("
                    SELECT
                        id,
                        container_no,
                        container_size,
                        seal_no,
                        package_count,
                        gross_weight
                    FROM portal_quote_containers
                    WHERE quote_request_id = ?
                    ORDER BY position ASC, created_at ASC
                ");

                $getContainers->execute([$queue["quote_request_id"]]);
                $containers = $getContainers->fetchAll(PDO::FETCH_ASSOC);

                $getItems = $conn->prepare("
                    SELECT
                        i.container_id,
                        i.hs_code,
                        i.item_description,
                        i.quantity,
                        i.unit_of_measure,
                        i.currency
                    FROM portal_quote_items i
                    INNER JOIN portal_quote_containers c
                        ON c.id = i.container_id
                    WHERE c.quote_request_id = ?
                    ORDER BY c.position ASC, i.position ASC
                ");

                $getItems->execute([$queue["quote_request_id"]]);
                $items = $getItems->fetchAll(PDO::FETCH_ASSOC);

                $getServices = $conn->prepare("
                    SELECT service_name
                    FROM portal_quote_services
                    WHERE quote_request_id = ?
                    ORDER BY created_at ASC
                ");

                $getServices->execute([$queue["quote_request_id"]]);
                $services = $getServices->fetchAll(PDO::FETCH_COLUMN);

                $escape = function ($value) {
                    return htmlspecialchars(
                        (string)$value,
                        ENT_QUOTES | ENT_SUBSTITUTE,
                        "UTF-8"
                    );
                };

                $itemsByContainer = [];

                foreach ($items as $item) {
                    $itemsByContainer[$item["container_id"]][] = $item;
                }

                $containerHtml = "";

                foreach ($containers as $index => $container) {
                    $containerHtml .= "
                        <tr>
                            <td colspan='2' style='padding:14px 12px;background:#f4f6fa;border-bottom:1px solid #e5e7eb;'>
                                <strong>Container " . ($index + 1) . ": " . $escape($container["container_no"]) . "</strong>
                                <div style='font-size:13px;color:#667085;margin-top:5px;'>
                                    Size: " . $escape($container["container_size"] ?: "Not specified") . "
                                    &nbsp; | &nbsp;
                                    Seal: " . $escape($container["seal_no"] ?: "Not specified") . "
                                    &nbsp; | &nbsp;
                                    Packages: " . $escape($container["package_count"]) . "
                                    &nbsp; | &nbsp;
                                    Gross weight: " . $escape($container["gross_weight"]) . "
                                </div>
                            </td>
                        </tr>
                    ";

                    foreach ($itemsByContainer[$container["id"]] ?? [] as $item) {
                        $containerHtml .= "
                            <tr>
                                <td style='padding:11px 12px;border-bottom:1px solid #edf0f4;'>
                                    <strong>" . $escape($item["item_description"]) . "</strong>
                                    <div style='font-size:12px;color:#667085;margin-top:4px;'>
                                        HS Code: " . $escape($item["hs_code"]) . "
                                    </div>
                                </td>
                                <td style='padding:11px 12px;border-bottom:1px solid #edf0f4;text-align:right;'>
                                    " . $escape($item["quantity"]) . " " . $escape($item["unit_of_measure"]) . "
                                </td>
                            </tr>
                        ";
                    }
                }

                $serviceHtml = "";

                if (count($services) > 0) {
                    foreach ($services as $service) {
                        $serviceHtml .= "
                            <li style='margin-bottom:6px;'>
                                " . $escape($service) . "
                            </li>
                        ";
                    }
                } else {
                    $serviceHtml = "<li>No additional services selected.</li>";
                }

                $arrival = $queue["expected_arrival"]
                    ? date("d M Y", strtotime($queue["expected_arrival"]))
                    : "Not specified";

                $message = "
                <!doctype html>
                <html>
                <head>
                    <meta charset='UTF-8'>
                    <meta name='viewport' content='width=device-width,initial-scale=1'>
                    <title>" . $escape($queue["subject"]) . "</title>
                </head>

                <body style='margin:0;padding:0;background:#f3f5f8;font-family:Arial,Helvetica,sans-serif;color:#202938;'>
                    <div style='max-width:680px;margin:30px auto;padding:0 15px;'>
                        <div style='background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;'>

                            <div style='padding:28px 30px;background:#0a2a9b;color:#ffffff;'>
                                <div style='font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.85;'>
                                    TRINU
                                </div>
                                <h1 style='margin:12px 0 0;font-size:24px;'>
                                    Quote request received
                                </h1>
                            </div>

                            <div style='padding:30px;'>
                                <p style='margin-top:0;'>
                                    Hello " . $escape($queue["recipient_name"]) . ",
                                </p>

                                <p style='line-height:1.7;color:#475467;'>
                                    Thank you for contacting Trinu. We have received your shipment details and your quote request has been recorded.
                                </p>

                                <div style='margin:22px 0;padding:18px;background:#f4f6fa;border-radius:8px;'>
                                    <div style='font-size:12px;color:#667085;text-transform:uppercase;letter-spacing:1px;'>
                                        Your quote reference
                                    </div>
                                    <div style='font-size:22px;font-weight:bold;color:#0a2a9b;margin-top:7px;'>
                                        " . $escape($queue["quote_reference"]) . "
                                    </div>
                                </div>

                                <h3 style='margin:26px 0 12px;font-size:16px;'>
                                    Company and shipment details
                                </h3>

                                <table style='width:100%;border-collapse:collapse;font-size:14px;'>
                                    <tr>
                                        <td style='padding:8px 0;color:#667085;width:40%;'>Company</td>
                                        <td style='padding:8px 0;font-weight:600;'>" . $escape($queue["company_name"]) . "</td>
                                    </tr>
                                    <tr>
                                        <td style='padding:8px 0;color:#667085;'>Bill of lading</td>
                                        <td style='padding:8px 0;font-weight:600;'>" . $escape($queue["bill_of_lading"]) . "</td>
                                    </tr>
                                    <tr>
                                        <td style='padding:8px 0;color:#667085;'>Vessel</td>
                                        <td style='padding:8px 0;'>" . $escape($queue["vessel_name"] ?: "Not specified") . "</td>
                                    </tr>
                                    <tr>
                                        <td style='padding:8px 0;color:#667085;'>Voyage</td>
                                        <td style='padding:8px 0;'>" . $escape($queue["voyage_number"] ?: "Not specified") . "</td>
                                    </tr>
                                    <tr>
                                        <td style='padding:8px 0;color:#667085;'>Origin</td>
                                        <td style='padding:8px 0;'>" . $escape($queue["origin"] ?: "Not specified") . "</td>
                                    </tr>
                                    <tr>
                                        <td style='padding:8px 0;color:#667085;'>Destination</td>
                                        <td style='padding:8px 0;'>" . $escape($queue["destination"] ?: "Not specified") . "</td>
                                    </tr>
                                    <tr>
                                        <td style='padding:8px 0;color:#667085;'>Expected arrival</td>
                                        <td style='padding:8px 0;'>" . $escape($arrival) . "</td>
                                    </tr>
                                    <tr>
                                        <td style='padding:8px 0;color:#667085;'>Cargo category</td>
                                        <td style='padding:8px 0;'>" . $escape($queue["cargo_category"] ?: "Not specified") . "</td>
                                    </tr>
                                </table>

                                <h3 style='margin:28px 0 12px;font-size:16px;'>
                                    Containers and cargo items
                                </h3>

                                <table style='width:100%;border-collapse:collapse;font-size:14px;'>
                                    " . $containerHtml . "
                                </table>

                                <h3 style='margin:28px 0 12px;font-size:16px;'>
                                    Requested services
                                </h3>

                                <ul style='padding-left:20px;color:#475467;font-size:14px;line-height:1.6;'>
                                    " . $serviceHtml . "
                                </ul>

                                <h3 style='margin:28px 0 12px;font-size:16px;'>
                                    Special requirements
                                </h3>

                                <p style='line-height:1.7;color:#475467;white-space:pre-line;'>
                                    " . $escape($queue["requirements"] ?: "None specified.") . "
                                </p>

                                <div style='margin-top:28px;padding:16px;background:#fff8e8;border:1px solid #f4dfad;border-radius:8px;color:#785b20;font-size:13px;line-height:1.6;'>
                                    This email confirms receipt of your request only. It is not a final quotation or confirmation of shipment acceptance. Our team will review the submitted details and contact you regarding the quotation.
                                </div>

                                <p style='margin-top:28px;line-height:1.7;color:#475467;'>
                                    Thank you for choosing Trinu.
                                </p>
                            </div>

                            <div style='padding:18px 30px;background:#f8fafc;border-top:1px solid #e5e7eb;color:#98a2b3;font-size:12px;'>
                                This is an automated acknowledgement of your quote request.
                            </div>

                        </div>
                    </div>
                </body>
                </html>
                ";

                $sent = send_email(
                    $queue["recipient_email"],
                    $queue["recipient_name"],
                    $queue["subject"],
                    $message
                );

                if ($sent) {
                    $deleteQueue->execute([$queueId]);

                    if ($deleteQueue->rowCount() > 0) {
                        $deleted++;
                    }

                    $processed++;
                } else {
                    $getAttempts->execute([$queueId]);
                    $attemptData = $getAttempts->fetch(PDO::FETCH_ASSOC);

                    if ($attemptData) {
                        $attempt = (int)$attemptData["attempts"] + 1;
                        $maxAttempts = (int)$attemptData["max_attempts"];
                        $delayMinutes = min(1440, 5 * (2 ** max(0, $attempt - 1)));

                        $errorMessage = $attempt >= $maxAttempts
                            ? "Email sending failed. Maximum attempts reached."
                            : "send_email() returned false.";

                        $updateFailed->execute([
                            $attempt,
                            $delayMinutes,
                            $errorMessage,
                            $queueId
                        ]);
                    }

                    $failed++;
                }

            } catch (Throwable $e) {
                error_log(
                    "Quote email queue error for " . $queueId . ": " . $e->getMessage()
                );

                $getAttempts->execute([$queueId]);
                $attemptData = $getAttempts->fetch(PDO::FETCH_ASSOC);

                if ($attemptData) {
                    $attempt = (int)$attemptData["attempts"] + 1;
                    $maxAttempts = (int)$attemptData["max_attempts"];
                    $delayMinutes = min(1440, 5 * (2 ** max(0, $attempt - 1)));

                    $errorMessage = mb_substr($e->getMessage(), 0, 4000);

                    $updateFailed->execute([
                        $attempt,
                        $delayMinutes,
                        $errorMessage,
                        $queueId
                    ]);
                }

                $failed++;
            }
        }

        echo json_encode([
            "success" => true,
            "claimed" => count($claimedIds),
            "sent" => $processed,
            "deleted" => $deleted,
            "failed" => $failed
        ]) . PHP_EOL;

    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log("Quote email cron error: " . $e->getMessage());

        echo json_encode([
            "success" => false,
            "error" => "Quote email cron failed."
        ]) . PHP_EOL;

        exit(1);
    }
