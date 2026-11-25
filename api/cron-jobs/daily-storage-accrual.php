<?php
    require_once dirname(__DIR__, 1) . "/include/set-header.php";

    date_default_timezone_set("Africa/Lagos");

    $runDate = (new DateTimeImmutable("today"))->format("Y-m-d");

    $summary = [
        "run_date" => $runDate,
        "processed" => 0,
        "charged" => 0,
        "paused" => 0,
        "overstay_flagged" => 0,
        "overstay_escalated" => 0,
        "emails_sent" => 0,
        "emails_failed" => 0,
        "emails_skipped_no_contact" => 0,
        "skipped_missing_rate" => 0,
        "errors" => []
    ];

    function storageEscape($value): string{
        return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, "UTF-8");
    }

    function storageMoney($amount, $currency): string{
        return storageEscape($currency ?: "NGN") . " " . number_format((float)$amount, 2);
    }

    function storageContainerRows(array $containers, string $type, string $currency): string{
        $html = "";

        foreach ($containers as $container) {
            $status = !empty($container["is_overstay_escalated"])
                ? "Overstay escalated"
                : (!empty($container["is_overstay"]) ? "Overstay" : "Charging");

            $todayCharge = storageMoney($container["today_amount"] ?? $container["daily_amount"], $currency);
            $unpaid = storageMoney($container["container_unpaid"] ?? 0, $currency);

            if ($type === "DAILY_CHARGES") {
                $html .= "<tr style=\"border-bottom:1px solid #E8D9C2\">"
                    . "<td style=\"padding:10px 8px\">" . storageEscape($container["container_no"]) . "</td>"
                    . "<td style=\"padding:10px 8px\">" . storageEscape($container["container_size"]) . "</td>"
                    . "<td style=\"padding:10px 8px\">" . (int)$container["storage_day"] . "</td>"
                    . "<td style=\"padding:10px 8px\">" . storageMoney($container["base_rate"], $currency) . "</td>"
                    . "<td style=\"padding:10px 8px\">" . number_format((float)$container["rate_multiplier"], 2) . "x</td>"
                    . "<td style=\"padding:10px 8px\"><strong>" . $todayCharge . "</strong></td>"
                    . "<td style=\"padding:10px 8px\">" . storageEscape($status) . "</td>"
                    . "</tr>";
            } else {
                $html .= "<tr style=\"border-bottom:1px solid #E8D9C2\">"
                    . "<td style=\"padding:10px 8px\">" . storageEscape($container["container_no"]) . "</td>"
                    . "<td style=\"padding:10px 8px\">" . storageEscape($container["container_size"]) . "</td>"
                    . "<td style=\"padding:10px 8px\">" . (int)$container["storage_day"] . "</td>"
                    . "<td style=\"padding:10px 8px\">" . $todayCharge . "</td>"
                    . "<td style=\"padding:10px 8px\"><strong>" . $unpaid . "</strong></td>"
                    . "</tr>";
            }
        }

        return $html;
    }

    function storageBuildEmail(string $type, array $shipment, array $containers, array $totals, string $runDate): array{
        $currency = $totals["currency_code"] ?: "NGN";
        $reference = $shipment["shipment_reference"] ?: $shipment["bill_of_lading"] ?: $shipment["shipment_id"];
        $shipmentReference = storageEscape($reference);
        $organisation = storageEscape($shipment["organisation_name"]);
        $chargeDate = storageEscape((new DateTimeImmutable($runDate))->format("d M Y"));

        $todayTotal = storageMoney($totals["today_total"], $currency);
        $accumulatedTotal = storageMoney($totals["accumulated_total"], $currency);
        $totalPaid = storageMoney($totals["total_paid"], $currency);
        $outstandingTotal = storageMoney($totals["outstanding_total"], $currency);
        $containerRows = storageContainerRows($containers, $type, $currency);

        $content = match ($type) {
            "DAILY_CHARGES" => [
                "subject" => "Daily Storage Charges - " . $reference,
                "label" => "STORAGE CHARGE NOTIFICATION",
                "title" => "Daily Storage Charges",
                "intro" => "This is to inform you that storage charges have been calculated for your containers currently stored within the terminal.",
                "highlight_title" => "Today's storage charges",
                "highlight_amount" => $todayTotal,
                "notice_title" => "Storage information",
                "notice" => "Storage charges continue to accrue while your containers remain within the terminal, subject to the applicable free days and storage configuration."
            ],
            "OVERSTAY" => [
                "subject" => "Storage Overstay Notice - " . $reference,
                "label" => "STORAGE OVERSTAY NOTIFICATION",
                "title" => "Storage Overstay Notice",
                "intro" => "One or more containers under this shipment have reached the configured storage overstay threshold.",
                "highlight_title" => "Current outstanding charges",
                "highlight_amount" => $outstandingTotal,
                "notice_title" => "Action required",
                "notice" => "Please arrange payment and the necessary clearance procedures to avoid further storage charges and operational delays."
            ],
            "ESCALATION" => [
                "subject" => "Storage Escalation Notice - " . $reference,
                "label" => "STORAGE ESCALATION NOTIFICATION",
                "title" => "Storage Escalation Notice",
                "intro" => "One or more containers under this shipment have reached the configured storage escalation threshold. Applicable storage charges may continue to increase.",
                "highlight_title" => "Current outstanding charges",
                "highlight_amount" => $outstandingTotal,
                "notice_title" => "Immediate attention required",
                "notice" => "Please contact the terminal operations or finance team to resolve the outstanding charges and arrange prompt cargo clearance."
            ],
            default => throw new InvalidArgumentException("Invalid storage notification type.")
        };

        $tableHeaders = $type === "DAILY_CHARGES"
            ? "
                <th style='padding:11px 8px;text-align:left;'>Container</th>
                <th style='padding:11px 8px;text-align:left;'>Size</th>
                <th style='padding:11px 8px;text-align:left;'>Day</th>
                <th style='padding:11px 8px;text-align:left;'>Base rate</th>
                <th style='padding:11px 8px;text-align:left;'>Multiplier</th>
                <th style='padding:11px 8px;text-align:left;'>Today's charge</th>
                <th style='padding:11px 8px;text-align:left;'>Status</th>
            "
            : "
                <th style='padding:11px 8px;text-align:left;'>Container</th>
                <th style='padding:11px 8px;text-align:left;'>Size</th>
                <th style='padding:11px 8px;text-align:left;'>Day</th>
                <th style='padding:11px 8px;text-align:left;'>Daily charge</th>
                <th style='padding:11px 8px;text-align:left;'>Outstanding</th>
            ";

        $message = "
            <div style='margin-bottom:22px;'>
                <div style='font-size:10px;font-weight:700;letter-spacing:1.5px;color:#FF6600;text-transform:uppercase;'>" . storageEscape($content["label"]) . "</div>
                <h2 style='margin:8px 0 12px;font-size:22px;line-height:1.3;color:#2B2A28;'>" . storageEscape($content["title"]) . "</h2>
                <p style='margin:0;color:#6B6357;'>Dear <strong>{$organisation}</strong>,</p>
                <p style='margin:12px 0 0;color:#6B6357;'>" . storageEscape($content["intro"]) . "</p>
            </div>

            <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:20px;background-color:#FAF0E3;border:1px solid #E8D9C2;border-radius:8px;'>
                <tr>
                    <td style='padding:14px;'>
                        <div style='font-size:10px;color:#9A8F80;text-transform:uppercase;letter-spacing:1px;'>Shipment reference</div>
                        <div style='margin-top:5px;font-size:14px;font-weight:700;color:#2B2A28;'>{$shipmentReference}</div>
                    </td>
                    <td align='right' style='padding:14px;'>
                        <div style='font-size:10px;color:#9A8F80;text-transform:uppercase;letter-spacing:1px;'>Charge date</div>
                        <div style='margin-top:5px;font-size:13px;font-weight:600;color:#2B2A28;'>{$chargeDate}</div>
                    </td>
                </tr>
            </table>

            <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:24px;background-color:#FF6600;border-radius:8px;'>
                <tr><td style='padding:17px 18px;'>
                    <div style='font-size:11px;color:#FFF0E5;'>" . storageEscape($content["highlight_title"]) . "</div>
                    <div style='margin-top:7px;font-size:24px;font-weight:700;color:#FFFFFF;'>" . storageEscape($content["highlight_amount"]) . "</div>
                </td></tr>
            </table>

            <h3 style='margin:0 0 12px;font-size:15px;color:#2B2A28;'>Container charge details</h3>
            <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:24px;border-collapse:collapse;font-size:10px;color:#2B2A28;'>
                <thead><tr style='background-color:#FAF0E3;color:#6B6357;text-align:left;'>{$tableHeaders}</tr></thead>
                <tbody>{$containerRows}</tbody>
            </table>

            <h3 style='margin:0 0 12px;font-size:15px;color:#2B2A28;'>Charge summary</h3>
            <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:22px;border:1px solid #E8D9C2;border-collapse:collapse;'>
                <tr>
                    <td style='padding:12px;border-bottom:1px solid #E8D9C2;color:#6B6357;font-size:12px;'>Today's charges</td>
                    <td align='right' style='padding:12px;border-bottom:1px solid #E8D9C2;font-size:12px;font-weight:600;color:#2B2A28;'>{$todayTotal}</td>
                </tr>
                <tr>
                    <td style='padding:12px;border-bottom:1px solid #E8D9C2;color:#6B6357;font-size:12px;'>Accumulated charges</td>
                    <td align='right' style='padding:12px;border-bottom:1px solid #E8D9C2;font-size:12px;font-weight:600;color:#2B2A28;'>{$accumulatedTotal}</td>
                </tr>
                <tr>
                    <td style='padding:12px;border-bottom:1px solid #E8D9C2;color:#6B6357;font-size:12px;'>Total paid</td>
                    <td align='right' style='padding:12px;border-bottom:1px solid #E8D9C2;font-size:12px;font-weight:600;color:#126836;'>{$totalPaid}</td>
                </tr>
                <tr>
                    <td style='padding:13px;color:#2B2A28;font-size:12px;font-weight:700;'>Outstanding balance</td>
                    <td align='right' style='padding:13px;color:#FF6600;font-size:14px;font-weight:700;'>{$outstandingTotal}</td>
                </tr>
            </table>

            <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color:#FAF0E3;border-left:4px solid #FF6600;border-radius:5px;'>
                <tr><td style='padding:14px 16px;'>
                    <div style='margin-bottom:6px;font-size:12px;font-weight:700;color:#2B2A28;'>" . storageEscape($content["notice_title"]) . "</div>
                    <div style='font-size:12px;line-height:1.7;color:#6B6357;'>" . storageEscape($content["notice"]) . "</div>
                </td></tr>
            </table>

            <p style='margin:22px 0 0;font-size:12px;line-height:1.7;color:#6B6357;'>If you have questions about these charges, please contact the terminal operations or finance team.</p>
            <p style='margin:12px 0 0;font-size:12px;font-weight:700;color:#2B2A28;'>Trinū Terminal Operations</p>
        ";

        return [
            "subject" => $content["subject"],
            "message" => $message
        ];
    }

    try {
        $containersQuery = $conn->prepare("
            SELECT
                c.id,
                c.shipment_id,
                c.container_no,
                c.size,
                c.status,
                c.stored_at
            FROM portal_shipment_containers c
            WHERE c.stored_at IS NOT NULL
            AND DATE(c.stored_at) <= :run_date
            AND c.gate_out_at IS NULL
            AND c.status NOT IN (
                'GATE_OUT',
                'TRANSFERRED_OUT',
                'RETURNED_RE_EXPORTED',
                'CANCELLED'
            )
            ORDER BY c.stored_at ASC
        ");
        $containersQuery->execute([":run_date" => $runDate]);
        $containers = $containersQuery->fetchAll(PDO::FETCH_ASSOC);

        $configQuery = $conn->prepare("
            SELECT *
            FROM storage_config_versions
            WHERE effective_from <= :charge_date
            ORDER BY effective_from DESC, id DESC
            LIMIT 1
        ");

        $rateQuery = $conn->prepare("
            SELECT base_rate
            FROM storage_container_rates
            WHERE config_id = :config_id
            AND LOWER(TRIM(container_size)) = LOWER(TRIM(:container_size))
            LIMIT 1
        ");

        $tierQuery = $conn->prepare("
            SELECT rate_multiplier
            FROM storage_escalation_tiers
            WHERE config_id = :config_id
            AND from_day <= :storage_day
            ORDER BY from_day DESC
            LIMIT 1
        ");

        $examinationQuery = $conn->prepare("
            SELECT COUNT(*)
            FROM terminal_examinations
            WHERE container_id = :container_id
            AND status IN ('SCHEDULED', 'IN_PROGRESS', 'PENDING_REVIEW', 'FURTHER_EXAMINATION')
        ");

        $existingQuery = $conn->prepare("
            SELECT id
            FROM storage_container_daily_charges
            WHERE container_id = :container_id
            AND charge_date = :charge_date
            LIMIT 1
        ");

        $insertCharge = $conn->prepare("
            INSERT INTO storage_container_daily_charges (
                id, container_id, shipment_id, config_id, container_no, container_size,
                charge_date, stored_at, storage_day, free_days, charging_unit, base_rate,
                rate_multiplier, daily_amount, currency_code, is_overstay,
                is_overstay_escalated, created_at
            ) VALUES (
                :id, :container_id, :shipment_id, :config_id, :container_no, :container_size,
                :charge_date, :stored_at, :storage_day, :free_days, :charging_unit, :base_rate,
                :rate_multiplier, :daily_amount, :currency_code, :is_overstay,
                :is_overstay_escalated, CURRENT_TIMESTAMP
            )
        ");

        foreach ($containers as $container) {
            $summary["processed"]++;

            try {
                $storedAt = new DateTimeImmutable($container["stored_at"]);
                $chargeDate = new DateTimeImmutable($runDate);
                $storageDay = (int)$storedAt->setTime(0, 0)->diff($chargeDate)->days + 1;

                $configQuery->execute([":charge_date" => $runDate]);
                $config = $configQuery->fetch(PDO::FETCH_ASSOC);

                if (!$config) {
                    $summary["errors"][] = [
                        "container_id" => $container["id"],
                        "message" => "No storage configuration is effective for the run date."
                    ];
                    continue;
                }

                $freeDays = (int)$config["free_days"];

                if ($storageDay <= $freeDays) {
                    continue;
                }

                $existingQuery->execute([
                    ":container_id" => $container["id"],
                    ":charge_date" => $runDate
                ]);

                if ($existingQuery->fetchColumn()) {
                    continue;
                }

                if ((bool)$config["pause_on_examination"]) {
                    $examinationQuery->execute([":container_id" => $container["id"]]);

                    if ((int)$examinationQuery->fetchColumn() > 0 || in_array($container["status"], ["UNDER_EXAMINATION", "EXAMINATION_SCHEDULED"], true)) {
                        $summary["paused"]++;
                        continue;
                    }
                }

                $rateQuery->execute([
                    ":config_id" => (int)$config["id"],
                    ":container_size" => (string)$container["size"]
                ]);
                $baseRate = $rateQuery->fetchColumn();

                if ($baseRate === false || !is_numeric($baseRate)) {
                    $summary["skipped_missing_rate"]++;
                    $summary["errors"][] = [
                        "container_id" => $container["id"],
                        "container_no" => $container["container_no"],
                        "container_size" => $container["size"],
                        "message" => "No base storage rate is configured for this container size."
                    ];
                    continue;
                }

                $tierQuery->execute([
                    ":config_id" => (int)$config["id"],
                    ":storage_day" => $storageDay
                ]);
                $multiplier = $tierQuery->fetchColumn();
                $multiplier = $multiplier === false ? 1.0 : (float)$multiplier;

                $baseRate = (float)$baseRate;
                $chargingUnit = (string)$config["charging_unit"];
                $dailyDivisor = match ($chargingUnit) {
                    "week" => 7,
                    "month" => 30,
                    default => 1
                };

                $dailyAmount = round(($baseRate * $multiplier) / $dailyDivisor, 2);
                $isOverstay = $storageDay >= (int)$config["overstay_threshold_days"] ? 1 : 0;
                $isOverstayEscalated = $storageDay >= (int)$config["overstay_escalation_days"] ? 1 : 0;

                $conn->beginTransaction();
                $insertCharge->execute([
                    ":id" => generateId(),
                    ":container_id" => $container["id"],
                    ":shipment_id" => $container["shipment_id"],
                    ":config_id" => (int)$config["id"],
                    ":container_no" => $container["container_no"],
                    ":container_size" => $container["size"],
                    ":charge_date" => $runDate,
                    ":stored_at" => $container["stored_at"],
                    ":storage_day" => $storageDay,
                    ":free_days" => $freeDays,
                    ":charging_unit" => $chargingUnit,
                    ":base_rate" => $baseRate,
                    ":rate_multiplier" => $multiplier,
                    ":daily_amount" => $dailyAmount,
                    ":currency_code" => $config["currency_code"] ?: "NGN",
                    ":is_overstay" => $isOverstay,
                    ":is_overstay_escalated" => $isOverstayEscalated
                ]);
                $conn->commit();

                $summary["charged"]++;
                if ($isOverstay) {
                    $summary["overstay_flagged"]++;
                }
                if ($isOverstayEscalated) {
                    $summary["overstay_escalated"]++;
                }
            } catch (Throwable $containerError) {
                if ($conn->inTransaction()) {
                    $conn->rollBack();
                }

                $summary["errors"][] = [
                    "container_id" => $container["id"],
                    "message" => $containerError->getMessage()
                ];
                error_log("Storage cron container " . $container["id"] . ": " . $containerError->getMessage());
            }
        }

        $shipmentQuery = $conn->prepare("
            SELECT
                s.id AS shipment_id,
                s.shipment_reference,
                s.bill_of_lading,
                o.organisation_name,
                o.contact_email
            FROM portal_shipments s
            INNER JOIN organisations o ON o.id = s.organisation_id
            WHERE o.contact_email IS NOT NULL
            AND TRIM(o.contact_email) <> ''
            AND EXISTS (
                SELECT 1
                FROM storage_container_daily_charges d
                WHERE d.shipment_id = s.id
                    AND d.charge_date = :run_date
            )
            ORDER BY s.shipment_reference
        ");
        $shipmentQuery->execute([":run_date" => $runDate]);
        $shipments = $shipmentQuery->fetchAll(PDO::FETCH_ASSOC);

        $chargeRowsQuery = $conn->prepare("
            SELECT
                d.id,
                d.container_id,
                d.container_no,
                d.container_size,
                d.storage_day,
                d.base_rate,
                d.rate_multiplier,
                d.daily_amount,
                d.currency_code,
                d.is_overstay,
                d.is_overstay_escalated,
                COALESCE(a.total_allocated, 0) AS container_paid,
                GREATEST(d.daily_amount - COALESCE(a.total_allocated, 0), 0) AS container_unpaid
            FROM storage_container_daily_charges d
            LEFT JOIN (
                SELECT daily_charge_id, SUM(amount) AS total_allocated
                FROM storage_charge_allocations
                GROUP BY daily_charge_id
            ) a ON a.daily_charge_id = d.id
            WHERE d.shipment_id = :shipment_id
            AND d.charge_date = :run_date
            ORDER BY d.container_no
        ");

        $totalsQuery = $conn->prepare("
            SELECT
                COALESCE(SUM(d.daily_amount), 0) AS accumulated_total,
                COALESCE(SUM(COALESCE(a.total_allocated, 0)), 0) AS total_paid,
                GREATEST(
                    COALESCE(SUM(d.daily_amount), 0) - COALESCE(SUM(COALESCE(a.total_allocated, 0)), 0),
                    0
                ) AS outstanding_total,
                COALESCE(SUM(CASE WHEN d.charge_date = :run_date THEN d.daily_amount ELSE 0 END), 0) AS today_total,
                COALESCE(MAX(d.currency_code), 'NGN') AS currency_code
            FROM storage_container_daily_charges d
            LEFT JOIN (
                SELECT daily_charge_id, SUM(amount) AS total_allocated
                FROM storage_charge_allocations
                GROUP BY daily_charge_id
            ) a ON a.daily_charge_id = d.id
            WHERE d.shipment_id = :shipment_id
        ");

        $eventRowsQuery = $conn->prepare("
            SELECT
                d.id,
                d.container_id,
                d.container_no,
                d.container_size,
                d.storage_day,
                d.daily_amount,
                d.currency_code,
                d.is_overstay,
                d.is_overstay_escalated,
                GREATEST(
                    COALESCE((
                        SELECT SUM(all_charges.daily_amount)
                        FROM storage_container_daily_charges all_charges
                        WHERE all_charges.container_id = d.container_id
                    ), 0) - COALESCE((
                        SELECT SUM(allocation.amount)
                        FROM storage_charge_allocations allocation
                        INNER JOIN storage_container_daily_charges allocated_charge
                            ON allocated_charge.id = allocation.daily_charge_id
                        WHERE allocated_charge.container_id = d.container_id
                    ), 0),
                    0
                ) AS container_unpaid
            FROM storage_container_daily_charges d
            INNER JOIN storage_config_versions v ON v.id = d.config_id
            WHERE d.shipment_id = :shipment_id
            AND d.charge_date = :run_date
            AND (
                (:event_type_overstay = 'OVERSTAY' AND d.storage_day = v.overstay_threshold_days)
                OR
                (:event_type_escalation = 'ESCALATION' AND d.storage_day = v.overstay_escalation_days)
            )
            ORDER BY d.container_no
        ");

        $insertLog = $conn->prepare("
            INSERT IGNORE INTO storage_notification_logs (
                id, shipment_id, notification_type, notification_date, recipient_email,
                subject, status, created_at
            ) VALUES (
                :id, :shipment_id, :notification_type, :notification_date, :recipient_email,
                :subject, 'PENDING', CURRENT_TIMESTAMP
            )
        ");

        $claimLog = $conn->prepare("
            UPDATE storage_notification_logs
            SET status = 'SENDING',
                attempts = attempts + 1,
                error_message = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE shipment_id = :shipment_id
            AND notification_type = :notification_type
            AND notification_date = :notification_date
            AND (
                status IN ('PENDING', 'FAILED')
                OR (status = 'SENDING' AND updated_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 20 MINUTE))
            )
        ");

        $markLogSent = $conn->prepare("
            UPDATE storage_notification_logs
            SET status = 'SENT',
                sent_at = CURRENT_TIMESTAMP,
                error_message = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE shipment_id = :shipment_id
            AND notification_type = :notification_type
            AND notification_date = :notification_date
        ");

        $markLogFailed = $conn->prepare("
            UPDATE storage_notification_logs
            SET status = 'FAILED',
                error_message = :error_message,
                updated_at = CURRENT_TIMESTAMP
            WHERE shipment_id = :shipment_id
            AND notification_type = :notification_type
            AND notification_date = :notification_date
        ");

        foreach ($shipments as $shipment) {
            try {
                $shipmentId = $shipment["shipment_id"];
                $recipient = trim((string)$shipment["contact_email"]);

                $chargeRowsQuery->execute([
                    ":shipment_id" => $shipmentId,
                    ":run_date" => $runDate
                ]);
                $todayRows = $chargeRowsQuery->fetchAll(PDO::FETCH_ASSOC);

                if (!$todayRows) {
                    continue;
                }

                $totalsQuery->execute([
                    ":shipment_id" => $shipmentId,
                    ":run_date" => $runDate
                ]);
                $totals = $totalsQuery->fetch(PDO::FETCH_ASSOC);

                $notifications = [
                    "DAILY_CHARGES" => $todayRows
                ];

                foreach (["OVERSTAY", "ESCALATION"] as $eventType) {
                    $eventRowsQuery->execute([
                        ":shipment_id" => $shipmentId,
                        ":run_date" => $runDate,
                        ":event_type_overstay" => $eventType,
                        ":event_type_escalation" => $eventType
                    ]);
                    $eventRows = $eventRowsQuery->fetchAll(PDO::FETCH_ASSOC);

                    if ($eventRows) {
                        $notifications[$eventType] = $eventRows;
                    }
                }

                foreach ($notifications as $type => $notificationRows) {
                    $email = storageBuildEmail($type, $shipment, $notificationRows, $totals, $runDate);

                    $insertLog->execute([
                        ":id" => generateId(),
                        ":shipment_id" => $shipmentId,
                        ":notification_type" => $type,
                        ":notification_date" => $runDate,
                        ":recipient_email" => $recipient,
                        ":subject" => $email["subject"]
                    ]);

                    $claimLog->execute([
                        ":shipment_id" => $shipmentId,
                        ":notification_type" => $type,
                        ":notification_date" => $runDate
                    ]);

                    if ($claimLog->rowCount() !== 1) {
                        continue;
                    }

                    try {
                        $sent = send_email(
                            $recipient,
                            $shipment["organisation_name"],
                            $email["subject"],
                            $email["message"]
                        );

                        if ($sent === true) {
                            $markLogSent->execute([
                                ":shipment_id" => $shipmentId,
                                ":notification_type" => $type,
                                ":notification_date" => $runDate
                            ]);
                            $summary["emails_sent"]++;
                        } else {
                            $markLogFailed->execute([
                                ":shipment_id" => $shipmentId,
                                ":notification_type" => $type,
                                ":notification_date" => $runDate,
                                ":error_message" => "send_email() did not return true."
                            ]);
                            $summary["emails_failed"]++;
                        }
                    } catch (Throwable $mailError) {
                        $markLogFailed->execute([
                            ":shipment_id" => $shipmentId,
                            ":notification_type" => $type,
                            ":notification_date" => $runDate,
                            ":error_message" => mb_substr($mailError->getMessage(), 0, 60000)
                        ]);
                        $summary["emails_failed"]++;
                        error_log("Storage notification " . $shipmentId . " " . $type . ": " . $mailError->getMessage());
                    }
                }
            } catch (Throwable $notificationError) {
                $summary["errors"][] = [
                    "shipment_id" => $shipment["shipment_id"],
                    "message" => $notificationError->getMessage()
                ];
                error_log("Storage notification shipment " . $shipment["shipment_id"] . ": " . $notificationError->getMessage());
            }
        }

        $missingContactQuery = $conn->prepare("
            SELECT COUNT(DISTINCT d.shipment_id)
            FROM storage_container_daily_charges d
            INNER JOIN portal_shipments s ON s.id = d.shipment_id
            LEFT JOIN organisations o ON o.id = s.organisation_id
            WHERE d.charge_date = :run_date
            AND (o.contact_email IS NULL OR TRIM(o.contact_email) = '')
        ");
        $missingContactQuery->execute([":run_date" => $runDate]);
        $summary["emails_skipped_no_contact"] = (int)$missingContactQuery->fetchColumn();

        echo json_encode([
            "error" => false,
            "data" => "Daily container storage accrual and shipment notifications completed.",
            "code" => $summary
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log("Daily storage accrual cron failed: " . $e->getMessage());

        echo json_encode([
            "error" => true,
            "data" => "Could not complete daily container storage accrual.",
            "code" => [
                "run_date" => $runDate,
                "message" => $e->getMessage()
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
