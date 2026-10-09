<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Cache-Control: no-store, private");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
    exit;
}

try {
    $q = $conn->prepare("SELECT mfa_mandatory_for_staff, mfa_encouraged_for_trade, mfa_grace_period_hours, session_timeout_minutes, concurrent_sessions_allowed, reauthentication_for_sensitive_actions, trusted_devices_enabled, breached_password_screening, minimum_password_length, progressive_lockout_enabled, lockout_threshold, lockout_duration_minutes, break_glass_requires_dual_approval, regulator_read_only_access, regulator_access_duration_hours, audit_all_auth_events, security_alerts_enabled, alert_on_privilege_changes, alert_on_repeated_login_failures, device_management_enabled, remote_sign_out_enabled FROM security_settings ORDER BY created_at ASC LIMIT 1");
    $q->execute();
    $row = $q->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        $row = [
            "mfa_mandatory_for_staff" => 1,
            "mfa_encouraged_for_trade" => 1,
            "mfa_grace_period_hours" => 24,
            "session_timeout_minutes" => 30,
            "concurrent_sessions_allowed" => 3,
            "reauthentication_for_sensitive_actions" => 1,
            "trusted_devices_enabled" => 0,
            "breached_password_screening" => 1,
            "minimum_password_length" => 12,
            "progressive_lockout_enabled" => 1,
            "lockout_threshold" => 5,
            "lockout_duration_minutes" => 30,
            "break_glass_requires_dual_approval" => 1,
            "regulator_read_only_access" => 0,
            "regulator_access_duration_hours" => 24,
            "audit_all_auth_events" => 1,
            "security_alerts_enabled" => 1,
            "alert_on_privilege_changes" => 1,
            "alert_on_repeated_login_failures" => 1,
            "device_management_enabled" => 1,
            "remote_sign_out_enabled" => 1
        ];
    }

    $booleanFields = [
        "mfa_mandatory_for_staff",
        "mfa_encouraged_for_trade",
        "reauthentication_for_sensitive_actions",
        "trusted_devices_enabled",
        "breached_password_screening",
        "progressive_lockout_enabled",
        "break_glass_requires_dual_approval",
        "regulator_read_only_access",
        "audit_all_auth_events",
        "security_alerts_enabled",
        "alert_on_privilege_changes",
        "alert_on_repeated_login_failures",
        "device_management_enabled",
        "remote_sign_out_enabled"
    ];

    $numericFields = [
        "mfa_grace_period_hours",
        "session_timeout_minutes",
        "concurrent_sessions_allowed",
        "minimum_password_length",
        "lockout_threshold",
        "lockout_duration_minutes",
        "regulator_access_duration_hours"
    ];

    foreach ($booleanFields as $field) {
        $row[$field] = (bool) $row[$field];
    }

    foreach ($numericFields as $field) {
        $row[$field] = (int) $row[$field];
    }

    echo json_encode([
        "error" => false,
        "data" => true,
        "code" => $row
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not load security configuration.",
        "code" => null
    ]);
}