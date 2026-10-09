<?php
require_once dirname(__DIR__, 2) . '/include/set-header.php';

try {
    $q = $conn->prepare("
        SELECT
            message,
            scheduled_start,
            scheduled_duration_minutes
        FROM maintenance_config
        ORDER BY created_at ASC
        LIMIT 1
    ");
    $q->execute();
    $config = $q->fetch(PDO::FETCH_ASSOC);

    if (!$config) {
        http_response_code(404);
        echo json_encode([
            "error" => true,
            "data" => "Maintenance schedule not found",
            "code" => null
        ]);
        exit;
    }

    $now = date("Y-m-d H:i:s");

    $q = $conn->prepare("
        SELECT
            id,
            message,
            severity,
            active,
            audience,
            starts_at,
            ends_at
        FROM maintenance_notices
        WHERE active = 1
          AND audience IN ('public', 'all')
          AND (starts_at IS NULL OR starts_at <= :starts_now)
          AND (ends_at IS NULL OR ends_at > :ends_now)
        ORDER BY
            CASE severity
                WHEN 'critical' THEN 1
                WHEN 'warning' THEN 2
                ELSE 3
            END,
            created_at DESC
        LIMIT 1
    ");

    $q->execute([
        "starts_now" => $now,
        "ends_now" => $now
    ]);

    $notice = $q->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "error" => false,
        "data" => "Maintenance schedule loaded successfully",
        "code" => [
            "message" => $notice["message"] ?? $config["message"],
            "severity" => $notice["severity"] ?? "info",
            "scheduled_start" => $config["scheduled_start"],
            "duration_minutes" => (int) $config["scheduled_duration_minutes"]
        ]
    ]);
} catch (Throwable $e) {
    error_log($e->getMessage());
    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Unable to load the maintenance schedule",
        "code" => null
    ]);
}