
<?php
    require_once dirname(__DIR__, 1) . "/include/conn.php";
    $processed = 0;
    $deleted = 0;
    $failed = 0;

    try {
        $conn->beginTransaction();

        $selectQueue = $conn->prepare("
            SELECT id
            FROM portal_quote_email_queue
            WHERE status IN ('PENDING', 'FAILED')
            ORDER BY created_at ASC
            FOR UPDATE
        ");

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
                attempts = attempts + 1,
                next_attempt_at = NULL,
                locked_at = NULL,
                last_error = ?,
                updated_at = NOW()
            WHERE id = ?
            AND status = 'PROCESSING'
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
                            <td colspan='2' style='padding:12px 10px;background:#FAF0E3;border-bottom:1px solid #E8D9C2;'>
                                <strong>Container " . ($index + 1) . ": " . $escape($container["container_no"]) . "</strong>
                                <div style='font-size:13px;color:#6B6357;margin-top:5px;'>
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
                                <td style='padding:10px 8px;border-bottom:1px solid #E8D9C2;'>
                                    <strong>" . $escape($item["item_description"]) . "</strong>
                                    <div style='font-size:12px;color:#6B6357;margin-top:4px;'>
                                        HS Code: " . $escape($item["hs_code"]) . "
                                    </div>
                                </td>
                                <td style='padding:10px 8px;border-bottom:1px solid #E8D9C2;text-align:right;'>
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
                    <p style='margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#2B2A28;'>
                        Hello " . $escape($queue["recipient_name"]) . ",
                    </p>

                    <p style='margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#6B6357;'>
                        Thank you for contacting Trinu. We have received your shipment details and your quote request has been recorded.
                    </p>

                    <table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0' style='width:100%;margin:0 0 24px;background:#FAF0E3;border:1px solid #E8D9C2;border-radius:8px;'>
                        <tr>
                            <td style='padding:16px 18px;'>
                                <div style='font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#6B6357;'>
                                    Your quote reference
                                </div>
                                <div style='margin-top:7px;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;font-weight:bold;color:#FF6600;word-break:break-word;'>
                                    " . $escape($queue["quote_reference"]) . "
                                </div>
                            </td>
                        </tr>
                    </table>

                    <h3 style='margin:24px 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.4;color:#2B2A28;'>
                        Company and shipment details
                    </h3>

                    <table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0' style='width:100%;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#2B2A28;'>
                        <tr>
                            <td width='40%' style='padding:8px 8px 8px 0;color:#6B6357;border-bottom:1px solid #E8D9C2;'>Company</td>
                            <td style='padding:8px 0;font-weight:bold;border-bottom:1px solid #E8D9C2;word-break:break-word;'>" . $escape($queue["company_name"]) . "</td>
                        </tr>
                        <tr>
                            <td style='padding:8px 8px 8px 0;color:#6B6357;border-bottom:1px solid #E8D9C2;'>Bill of lading</td>
                            <td style='padding:8px 0;font-weight:bold;border-bottom:1px solid #E8D9C2;word-break:break-word;'>" . $escape($queue["bill_of_lading"]) . "</td>
                        </tr>
                        <tr>
                            <td style='padding:8px 8px 8px 0;color:#6B6357;border-bottom:1px solid #E8D9C2;'>Vessel</td>
                            <td style='padding:8px 0;border-bottom:1px solid #E8D9C2;word-break:break-word;'>" . $escape($queue["vessel_name"] ?: "Not specified") . "</td>
                        </tr>
                        <tr>
                            <td style='padding:8px 8px 8px 0;color:#6B6357;border-bottom:1px solid #E8D9C2;'>Voyage</td>
                            <td style='padding:8px 0;border-bottom:1px solid #E8D9C2;word-break:break-word;'>" . $escape($queue["voyage_number"] ?: "Not specified") . "</td>
                        </tr>
                        <tr>
                            <td style='padding:8px 8px 8px 0;color:#6B6357;border-bottom:1px solid #E8D9C2;'>Origin</td>
                            <td style='padding:8px 0;border-bottom:1px solid #E8D9C2;word-break:break-word;'>" . $escape($queue["origin"] ?: "Not specified") . "</td>
                        </tr>
                        <tr>
                            <td style='padding:8px 8px 8px 0;color:#6B6357;border-bottom:1px solid #E8D9C2;'>Destination</td>
                            <td style='padding:8px 0;border-bottom:1px solid #E8D9C2;word-break:break-word;'>" . $escape($queue["destination"] ?: "Not specified") . "</td>
                        </tr>
                        <tr>
                            <td style='padding:8px 8px 8px 0;color:#6B6357;border-bottom:1px solid #E8D9C2;'>Expected arrival</td>
                            <td style='padding:8px 0;border-bottom:1px solid #E8D9C2;'>" . $escape($arrival) . "</td>
                        </tr>
                        <tr>
                            <td style='padding:8px 8px 8px 0;color:#6B6357;'>Cargo category</td>
                            <td style='padding:8px 0;'>" . $escape($queue["cargo_category"] ?: "Not specified") . "</td>
                        </tr>
                    </table>

                    <h3 style='margin:26px 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.4;color:#2B2A28;'>
                        Containers and cargo items
                    </h3>

                    <table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0' style='width:100%;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#2B2A28;'>
                        " . $containerHtml . "
                    </table>

                    <h3 style='margin:26px 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.4;color:#2B2A28;'>
                        Requested services
                    </h3>

                    <ul style='margin:0;padding:0 0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:#6B6357;'>
                        " . $serviceHtml . "
                    </ul>

                    <h3 style='margin:26px 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.4;color:#2B2A28;'>
                        Special requirements
                    </h3>

                    <p style='margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:#6B6357;white-space:pre-line;'>
                        " . $escape($queue["requirements"] ?: "None specified.") . "
                    </p>

                    <table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0' style='width:100%;margin:24px 0 0;background:#FAF0E3;border:1px solid #E8D9C2;border-radius:8px;'>
                        <tr>
                            <td style='padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:#6B6357;'>
                                This email confirms receipt of your request only. It is not a final quotation or confirmation of shipment acceptance. Our team will review the submitted details and contact you regarding the quotation.
                            </td>
                        </tr>
                    </table>

                    <p style='margin:22px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#6B6357;'>
                        Thank you for choosing Trinu.
                    </p>
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
                    $updateFailed->execute([
                        "send_email() returned false.",
                        $queueId
                    ]);

                    $failed++;
                }

            } catch (Throwable $e) {
                error_log(
                    "Quote email queue error for " . $queueId . ": " . $e->getMessage()
                );

                $updateFailed->execute([
                    mb_substr($e->getMessage(), 0, 4000),
                    $queueId
                ]);

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
