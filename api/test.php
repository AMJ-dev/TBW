<?php
require_once __DIR__ . '/include/conn.php';

try {
    $conn->beginTransaction();

    $q = $conn->prepare("SELECT id FROM notification_config_versions WHERE version_no = :version_no LIMIT 1");
    $q->bindValue(":version_no", 1, PDO::PARAM_INT);
    $q->execute();
    $configurationId = $q->fetchColumn();

    if (!$configurationId) {
        $configurationId = generateId();

        $config = [
            "channels_enabled" => [
                "email" => true,
                "sms" => true
            ],
            "quiet_hours_enabled" => false,
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
            ],
            "events" => [
                ["id" => generateId(), "key" => "cargo_received", "label" => "Cargo Received", "channels" => ["email", "sms"], "template" => "cargo_received", "mandatory" => false],
                ["id" => generateId(), "key" => "cargo_positioned", "label" => "Cargo Positioned", "channels" => ["email", "sms"], "template" => "cargo_positioned", "mandatory" => false],
                ["id" => generateId(), "key" => "document_issued", "label" => "Document Issued", "channels" => ["email", "sms"], "template" => "document_issued", "mandatory" => false],
                ["id" => generateId(), "key" => "examination_scheduled", "label" => "Examination Scheduled", "channels" => ["email", "sms"], "template" => "examination_scheduled", "mandatory" => false],
                ["id" => generateId(), "key" => "hold_placed", "label" => "Hold Placed", "channels" => ["email", "sms"], "template" => "hold_placed", "mandatory" => true],
                ["id" => generateId(), "key" => "invoice_issued", "label" => "Invoice Issued", "channels" => ["email", "sms"], "template" => "invoice_issued", "mandatory" => false],
                ["id" => generateId(), "key" => "payment_received", "label" => "Payment Received", "channels" => ["email", "sms"], "template" => "payment_received", "mandatory" => false],
                ["id" => generateId(), "key" => "release_authorised", "label" => "Release Authorised", "channels" => ["email", "sms"], "template" => "release_authorised", "mandatory" => true],
                ["id" => generateId(), "key" => "slot_confirmed", "label" => "Slot Confirmed", "channels" => ["email", "sms"], "template" => "slot_confirmed", "mandatory" => false],
                ["id" => generateId(), "key" => "storage_deadline", "label" => "Storage Deadline", "channels" => ["email", "sms"], "template" => "storage_deadline", "mandatory" => false],
                ["id" => generateId(), "key" => "overstay_escalation", "label" => "Overstay Escalation", "channels" => ["email", "sms"], "template" => "overstay_escalation", "mandatory" => false],
                ["id" => generateId(), "key" => "collection_ready", "label" => "Collection Ready", "channels" => ["email", "sms"], "template" => "collection_ready", "mandatory" => false]
            ]
        ];

        $q = $conn->prepare("INSERT INTO notification_config_versions (id, version_no, is_current, config_json, change_reason, created_by) VALUES (:id, :version_no, :is_current, :config_json, :change_reason, :created_by)");
        $q->bindValue(":id", $configurationId, PDO::PARAM_STR);
        $q->bindValue(":version_no", 1, PDO::PARAM_INT);
        $q->bindValue(":is_current", 1, PDO::PARAM_INT);
        $q->bindValue(":config_json", json_encode($config, JSON_THROW_ON_ERROR), PDO::PARAM_STR);
        $q->bindValue(":change_reason", "Initial notification configuration", PDO::PARAM_STR);
        $q->bindValue(":created_by", "00000000-0000-4000-8000-000000000000", PDO::PARAM_STR);
        $q->execute();
    } else {
        $q = $conn->prepare("SELECT config_json FROM notification_config_versions WHERE id = :id LIMIT 1");
        $q->bindValue(":id", $configurationId, PDO::PARAM_STR);
        $q->execute();
        $config = json_decode($q->fetchColumn(), true, 512, JSON_THROW_ON_ERROR);
    }

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Notification configuration initialized successfully",
        "code" => [
            "configuration_id" => $configurationId,
            "version" => 1,
            "channels_enabled" => $config["channels_enabled"],
            "quiet_hours_enabled" => $config["quiet_hours_enabled"],
            "quiet_hours_start" => $config["quiet_hours_start"],
            "quiet_hours_end" => $config["quiet_hours_end"],
            "rate_limit_per_hour" => $config["rate_limit_per_hour"],
            "digest_frequency" => $config["digest_frequency"],
            "fallback_channel_enabled" => $config["fallback_channel_enabled"],
            "retry_count" => $config["retry_count"],
            "track_delivery_status" => $config["track_delivery_status"],
            "transactional_marketing_split" => $config["transactional_marketing_split"],
            "internal_alerts" => $config["internal_alerts"],
            "events" => $config["events"]
        ]
    ]);
} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log("Notification configuration initialization error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Unable to initialize notification configuration",
        "code" => null
    ]);
}