
<?php

require_once __DIR__ . '/include/conn.php';

$createdBy = "c0654f0b-8452-4a03-a43d-0d0cda17da1b";

try {
    $conn->beginTransaction();

    $q = $conn->prepare("
        SELECT id
        FROM maintenance_config
        LIMIT 1
        FOR UPDATE
    ");
    $q->execute();

    $configurationId = $q->fetchColumn();
    $inserted = false;

    if (!$configurationId) {
        $configurationId = generateId();

        $q = $conn->prepare("
            INSERT INTO maintenance_config (
                id,
                maintenance_mode,
                emergency_maintenance,
                allow_staff_access,
                message,
                scheduled_start,
                scheduled_duration_minutes,
                notify_users_ahead_hours,
                notice_banner_enabled,
                created_by,
                updated_by
            ) VALUES (
                :id,
                :maintenance_mode,
                :emergency_maintenance,
                :allow_staff_access,
                :message,
                :scheduled_start,
                :scheduled_duration_minutes,
                :notify_users_ahead_hours,
                :notice_banner_enabled,
                :created_by,
                :updated_by
            )
        ");

        $q->execute([
            ":id" => $configurationId,
            ":maintenance_mode" => 0,
            ":emergency_maintenance" => 0,
            ":allow_staff_access" => 1,
            ":message" => "TRÏNŪ's platform is temporarily unavailable for maintenance. We apologise for the inconvenience and will restore service as soon as possible.",
            ":scheduled_start" => null,
            ":scheduled_duration_minutes" => 60,
            ":notify_users_ahead_hours" => 24,
            ":notice_banner_enabled" => 0,
            ":created_by" => $createdBy,
            ":updated_by" => $createdBy
        ]);

        $inserted = true;
    }

    $q = $conn->prepare("
        SELECT COUNT(*)
        FROM maintenance_notices
    ");
    $q->execute();
    $noticeCount = (int) $q->fetchColumn();

    if ($inserted) {
        $q = $conn->prepare("
            INSERT INTO maintenance_audit_logs (
                id,
                actor_id,
                action,
                change_reason,
                details
            ) VALUES (
                :id,
                :actor_id,
                :action,
                :change_reason,
                :details
            )
        ");

        $q->execute([
            ":id" => generateId(),
            ":actor_id" => $createdBy,
            ":action" => "maintenance_initialized",
            ":change_reason" => "Initial maintenance configuration",
            ":details" => json_encode([
                "configuration_id" => $configurationId,
                "maintenance_mode" => false,
                "emergency_maintenance" => false,
                "allow_staff_access" => true,
                "notice_banner_enabled" => false
            ], JSON_THROW_ON_ERROR)
        ]);
    }

    $q = $conn->prepare("
        SELECT
            id,
            maintenance_mode,
            emergency_maintenance,
            allow_staff_access,
            message,
            scheduled_start,
            scheduled_duration_minutes,
            notify_users_ahead_hours,
            notice_banner_enabled,
            created_at,
            updated_at
        FROM maintenance_config
        WHERE id = :id
        LIMIT 1
    ");
    $q->execute([":id" => $configurationId]);

    $config = $q->fetch(PDO::FETCH_ASSOC);

    $q = $conn->query("
        SELECT
            id,
            message,
            severity,
            active,
            audience,
            starts_at,
            ends_at,
            created_at,
            updated_at
        FROM maintenance_notices
        ORDER BY created_at ASC
    ");

    $notices = $q->fetchAll(PDO::FETCH_ASSOC);

    foreach ($notices as &$notice) {
        $notice["active"] = (bool) $notice["active"];
    }
    unset($notice);

    $config["maintenance_mode"] = (bool) $config["maintenance_mode"];
    $config["emergency_maintenance"] = (bool) $config["emergency_maintenance"];
    $config["allow_staff_access"] = (bool) $config["allow_staff_access"];
    $config["notice_banner_enabled"] = (bool) $config["notice_banner_enabled"];
    $config["scheduled_duration_minutes"] = (int) $config["scheduled_duration_minutes"];
    $config["notify_users_ahead_hours"] = (int) $config["notify_users_ahead_hours"];
    $config["notices"] = $notices;

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Maintenance initialized successfully",
        "code" => [
            "configuration_id" => $configurationId,
            "configuration_created" => $inserted,
            "notice_count" => $noticeCount,
            "config" => $config
        ]
    ]);

} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log("Maintenance initialization error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Unable to initialize maintenance configuration",
        "code" => null
    ]);
}
