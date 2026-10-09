<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $defaults = [
            "channels_enabled" => ["email" => true, "sms" => true],
            "quiet_hours_enabled" => true,
            "quiet_hours_start" => "22:00",
            "quiet_hours_end" => "07:00",
            "rate_limit_per_hour" => 10,
            "digest_frequency" => "immediate",
            "fallback_channel_enabled" => true,
            "retry_count" => 3,
            "track_delivery_status" => true,
            "transactional_marketing_split" => true,
            "internal_alerts" => [
                "sla" => true,
                "exceptions" => true,
                "integrations" => true,
                "security" => true
            ]
        ];

        $defaultEvents = [
            ["key" => "cargo_received", "label" => "Cargo Received", "channels" => ["email", "sms"], "template" => "cargo_received", "mandatory" => false],
            ["key" => "cargo_positioned", "label" => "Cargo Positioned", "channels" => ["email", "sms"], "template" => "cargo_positioned", "mandatory" => false],
            ["key" => "document_issued", "label" => "Document Issued", "channels" => ["email", "sms"], "template" => "document_issued", "mandatory" => false],
            ["key" => "examination_scheduled", "label" => "Examination Scheduled", "channels" => ["email", "sms"], "template" => "examination_scheduled", "mandatory" => false],
            ["key" => "hold_placed", "label" => "Hold Placed", "channels" => ["email", "sms"], "template" => "hold_placed", "mandatory" => true],
            ["key" => "invoice_issued", "label" => "Invoice Issued", "channels" => ["email", "sms"], "template" => "invoice_issued", "mandatory" => false],
            ["key" => "payment_received", "label" => "Payment Received", "channels" => ["email", "sms"], "template" => "payment_received", "mandatory" => false],
            ["key" => "release_authorised", "label" => "Release Authorised", "channels" => ["email", "sms"], "template" => "release_authorised", "mandatory" => true],
            ["key" => "slot_confirmed", "label" => "Slot Confirmed", "channels" => ["email", "sms"], "template" => "slot_confirmed", "mandatory" => false],
            ["key" => "storage_deadline", "label" => "Storage Deadline", "channels" => ["email", "sms"], "template" => "storage_deadline", "mandatory" => false],
            ["key" => "overstay_escalation", "label" => "Overstay Escalation", "channels" => ["email", "sms"], "template" => "overstay_escalation", "mandatory" => false],
            ["key" => "collection_ready", "label" => "Collection Ready", "channels" => ["email", "sms"], "template" => "collection_ready", "mandatory" => false]
        ];

        $conn->beginTransaction();

        $q = $conn->prepare("SELECT id, version_no, config_json, created_at FROM notification_config_versions WHERE is_current = 1 ORDER BY version_no DESC LIMIT 1 FOR UPDATE");
        $q->execute();
        $current = $q->fetch(PDO::FETCH_ASSOC);

        if (!$current) {
            $q = $conn->query("SELECT COALESCE(MAX(version_no), 0) + 1 FROM notification_config_versions");
            $version = (int)$q->fetchColumn();
            $configurationId = generateId();
            $actorId = (string)$my_details->id;

            $config = $defaults;

            $q = $conn->prepare("INSERT INTO notification_config_versions (id, version_no, is_current, config_json, change_reason, created_by) VALUES (:id, :version_no, 1, :config_json, :change_reason, :created_by)");
            $q->bindValue(":id", $configurationId, PDO::PARAM_STR);
            $q->bindValue(":version_no", $version, PDO::PARAM_INT);
            $q->bindValue(":config_json", json_encode($config, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), PDO::PARAM_STR);
            $q->bindValue(":change_reason", "Initial notification configuration", PDO::PARAM_STR);
            $q->bindValue(":created_by", $actorId, PDO::PARAM_STR);
            $q->execute();

            foreach ($defaultEvents as $event) {
                $eventId = generateId();
                $q = $conn->prepare("INSERT INTO notification_config_events (id, event_key, label, channels_json, template, mandatory, created_by, updated_by) VALUES (:id, :event_key, :label, :channels_json, :template, :mandatory, :created_by, :updated_by)");
                $q->bindValue(":id", $eventId, PDO::PARAM_STR);
                $q->bindValue(":event_key", $event["key"], PDO::PARAM_STR);
                $q->bindValue(":label", $event["label"], PDO::PARAM_STR);
                $q->bindValue(":channels_json", json_encode($event["channels"], JSON_THROW_ON_ERROR), PDO::PARAM_STR);
                $q->bindValue(":template", $event["template"], PDO::PARAM_STR);
                $q->bindValue(":mandatory", $event["mandatory"] ? 1 : 0, PDO::PARAM_INT);
                $q->bindValue(":created_by", $actorId, PDO::PARAM_STR);
                $q->bindValue(":updated_by", $actorId, PDO::PARAM_STR);
                $q->execute();
            }

            $createdAt = date("Y-m-d H:i:s");
        } else {
            $configurationId = $current["id"];
            $version = (int)$current["version_no"];
            $config = json_decode($current["config_json"], true, 512, JSON_THROW_ON_ERROR);
            $createdAt = $current["created_at"];
        }

        $q = $conn->query("SELECT id, event_key AS `key`, label, channels_json, template, mandatory FROM notification_config_events ORDER BY created_at ASC, event_key ASC");
        $events = [];

        foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $event) {
            $events[] = [
                "id" => $event["id"],
                "key" => $event["key"],
                "label" => $event["label"],
                "channels" => json_decode($event["channels_json"], true) ?: [],
                "template" => $event["template"],
                "mandatory" => (bool)$event["mandatory"]
            ];
        }

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Notification configuration loaded successfully",
            "code" => [
                "configuration_id" => $configurationId,
                "version" => $version,
                "updated_at" => $createdAt,
                "channels_enabled" => $config["channels_enabled"] ?? $defaults["channels_enabled"],
                "quiet_hours_enabled" => (bool)($config["quiet_hours_enabled"] ?? true),
                "quiet_hours_start" => $config["quiet_hours_start"] ?? "22:00",
                "quiet_hours_end" => $config["quiet_hours_end"] ?? "07:00",
                "rate_limit_per_hour" => (int)($config["rate_limit_per_hour"] ?? 10),
                "digest_frequency" => $config["digest_frequency"] ?? "immediate",
                "fallback_channel_enabled" => (bool)($config["fallback_channel_enabled"] ?? true),
                "retry_count" => (int)($config["retry_count"] ?? 3),
                "track_delivery_status" => (bool)($config["track_delivery_status"] ?? true),
                "transactional_marketing_split" => (bool)($config["transactional_marketing_split"] ?? true),
                "internal_alerts" => $config["internal_alerts"] ?? $defaults["internal_alerts"],
                "events" => $events
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } catch (Throwable $e) {
        if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log("Notification configuration read error: " . $e->getMessage());
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Unable to load notification configuration",
            "code" => null
        ]);
    }