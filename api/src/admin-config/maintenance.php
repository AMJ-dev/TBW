 
<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $q = $conn->query("
            SELECT
                id,
                maintenance_mode,
                emergency_maintenance,
                allow_staff_access,
                message,
                scheduled_start,
                scheduled_duration_minutes,
                notify_users_ahead_hours,
                notice_banner_enabled
            FROM maintenance_config
            ORDER BY created_at ASC
            LIMIT 1
        ");

        $config = $q->fetch(PDO::FETCH_ASSOC);

        if (!$config) {
            $config = [
                "maintenance_mode" => 0,
                "emergency_maintenance" => 0,
                "allow_staff_access" => 1,
                "message" => "TRÏNŪ's platform is temporarily unavailable for maintenance. We apologise for the inconvenience and will restore service as soon as possible.",
                "scheduled_start" => null,
                "scheduled_duration_minutes" => 60,
                "notify_users_ahead_hours" => 24,
                "notice_banner_enabled" => 0
            ];
        }

        $q = $conn->query("
            SELECT
                id,
                message,
                severity,
                active,
                audience,
                starts_at,
                ends_at
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

        echo json_encode([
            "error" => false,
            "data" => "Maintenance configuration loaded",
            "code" => $config
        ]);
    } catch (Throwable $e) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not load maintenance configuration",
            "code" => "MAINTENANCE_LOAD_FAILED"
        ]);
    }
