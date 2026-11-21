<?php
    require_once dirname(__DIR__, 1) . "/includeset-headern.php";

    date_default_timezone_set("Africa/Lagos");

    $runDate = (new DateTimeImmutable("today"))->format("Y-m-d");
    $templateDirectory = __DIR__ . "/storage-notification-templates";

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

    function storageLoadTemplate(string $file, array $values): string{
        $path = __DIR__ . "/storage-notification-templates/" . $file;
        $template = file_get_contents($path);

        if ($template === false) {
            throw new RuntimeException("Could not load email template: " . $file);
        }

        foreach ($values as $key => $value) {
            $template = str_replace("{{" . $key . "}}", (string)$value, $template);
        }

        return $template;
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
                $html .= "<tr style=\"border-bottom:1px solid #e5e9f0\">"
                    . "<td>" . storageEscape($container["container_no"]) . "</td>"
                    . "<td>" . storageEscape($container["container_size"]) . "</td>"
                    . "<td>" . (int)$container["storage_day"] . "</td>"
                    . "<td>" . storageMoney($container["base_rate"], $currency) . "</td>"
                    . "<td>" . number_format((float)$container["rate_multiplier"], 2) . "x</td>"
                    . "<td><strong>" . $todayCharge . "</strong></td>"
                    . "<td>" . storageEscape($status) . "</td>"
                    . "</tr>";
            } else {
                $html .= "<tr style=\"border-bottom:1px solid #e5e9f0\">"
                    . "<td>" . storageEscape($container["container_no"]) . "</td>"
                    . "<td>" . storageEscape($container["container_size"]) . "</td>"
                    . "<td>" . (int)$container["storage_day"] . "</td>"
                    . "<td>" . $todayCharge . "</td>"
                    . "<td><strong>" . $unpaid . "</strong></td>"
                    . "</tr>";
            }
        }

        return $html;
    }

    function storageBuildEmail(string $type, array $shipment, array $containers, array $totals, string $runDate): array{
        $currency = $totals["currency_code"] ?: "NGN";
        $values = [
            "ORGANISATION_NAME" => storageEscape($shipment["organisation_name"]),
            "SHIPMENT_REFERENCE" => storageEscape($shipment["shipment_reference"] ?: $shipment["bill_of_lading"] ?: $shipment["shipment_id"]),
            "CHARGE_DATE" => storageEscape((new DateTimeImmutable($runDate))->format("d M Y")),
            "TODAY_TOTAL" => storageMoney($totals["today_total"], $currency),
            "ACCUMULATED_TOTAL" => storageMoney($totals["accumulated_total"], $currency),
            "TOTAL_PAID" => storageMoney($totals["total_paid"], $currency),
            "OUTSTANDING_TOTAL" => storageMoney($totals["outstanding_total"], $currency),
            "CONTAINER_ROWS" => storageContainerRows($containers, $type, $currency)
        ];

        $templates = [
            "DAILY_CHARGES" => [
                "file" => "daily-charges.html",
                "subject" => "Daily Storage Charges - " . ($shipment["shipment_reference"] ?: $shipment["bill_of_lading"])
            ],
            "OVERSTAY" => [
                "file" => "overstay.html",
                "subject" => "Storage Overstay Notice - " . ($shipment["shipment_reference"] ?: $shipment["bill_of_lading"])
            ],
            "ESCALATION" => [
                "file" => "escalation.html",
                "subject" => "Storage Escalation Notice - " . ($shipment["shipment_reference"] ?: $shipment["bill_of_lading"])
            ]
        ];

        $template = $templates[$type];
        return [
            "subject" => $template["subject"],
            "message" => storageLoadTemplate($template["file"], $values)
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
