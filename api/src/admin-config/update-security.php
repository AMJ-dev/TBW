<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Cache-Control: no-store, private");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
    exit;
}

if (!isset($my_details->id) || !is_string($my_details->id) || $my_details->id === "") {
    http_response_code(401);
    echo json_encode(["error" => true, "data" => "Unable to identify the current user.", "code" => null]);
    exit;
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

$numberRules = [
    "mfa_grace_period_hours" => [0, 720],
    "session_timeout_minutes" => [5, 480],
    "concurrent_sessions_allowed" => [1, 20],
    "minimum_password_length" => [12, 128],
    "lockout_threshold" => [1, 20],
    "lockout_duration_minutes" => [1, 1440],
    "regulator_access_duration_hours" => [1, 168]
];

$settings = [];

foreach ($booleanFields as $field) {
    if (!array_key_exists($field, $_POST)) {
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "Missing setting: " . $field, "code" => null]);
        exit;
    }

    $value = $_POST[$field];

    if (!in_array($value, ["0", "1", 0, 1, "true", "false", true, false], true)) {
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "Invalid setting: " . $field, "code" => null]);
        exit;
    }

    $settings[$field] = in_array($value, ["1", 1, "true", true], true) ? 1 : 0;
}

foreach ($numberRules as $field => $range) {
    if (!isset($_POST[$field]) || filter_var($_POST[$field], FILTER_VALIDATE_INT) === false) {
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "Invalid numeric setting: " . $field, "code" => null]);
        exit;
    }

    $value = (int) $_POST[$field];

    if ($value < $range[0] || $value > $range[1]) {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => $field . " must be between " . $range[0] . " and " . $range[1] . ".",
            "code" => null
        ]);
        exit;
    }

    $settings[$field] = $value;
}

$actorId = $my_details->id;

try {
    $conn->beginTransaction();

    $q = $conn->prepare("SELECT id FROM security_settings ORDER BY created_at ASC LIMIT 1 FOR UPDATE");
    $q->execute();
    $row = $q->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $settingsId = $row["id"];
    } else {
        $settingsId = generateId();
        $q = $conn->prepare("INSERT INTO security_settings (id, updated_by) VALUES (?, ?)");
        $q->execute([$settingsId, $actorId]);
    }

    $q = $conn->prepare("UPDATE security_settings SET mfa_mandatory_for_staff = ?, mfa_encouraged_for_trade = ?, mfa_grace_period_hours = ?, session_timeout_minutes = ?, concurrent_sessions_allowed = ?, reauthentication_for_sensitive_actions = ?, trusted_devices_enabled = ?, breached_password_screening = ?, minimum_password_length = ?, progressive_lockout_enabled = ?, lockout_threshold = ?, lockout_duration_minutes = ?, break_glass_requires_dual_approval = ?, regulator_read_only_access = ?, regulator_access_duration_hours = ?, audit_all_auth_events = ?, security_alerts_enabled = ?, alert_on_privilege_changes = ?, alert_on_repeated_login_failures = ?, device_management_enabled = ?, remote_sign_out_enabled = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");

    $q->execute([
        $settings["mfa_mandatory_for_staff"],
        $settings["mfa_encouraged_for_trade"],
        $settings["mfa_grace_period_hours"],
        $settings["session_timeout_minutes"],
        $settings["concurrent_sessions_allowed"],
        $settings["reauthentication_for_sensitive_actions"],
        $settings["trusted_devices_enabled"],
        $settings["breached_password_screening"],
        $settings["minimum_password_length"],
        $settings["progressive_lockout_enabled"],
        $settings["lockout_threshold"],
        $settings["lockout_duration_minutes"],
        $settings["break_glass_requires_dual_approval"],
        $settings["regulator_read_only_access"],
        $settings["regulator_access_duration_hours"],
        $settings["audit_all_auth_events"],
        $settings["security_alerts_enabled"],
        $settings["alert_on_privilege_changes"],
        $settings["alert_on_repeated_login_failures"],
        $settings["device_management_enabled"],
        $settings["remote_sign_out_enabled"],
        $actorId,
        $settingsId
    ]);

    $q = $conn->prepare("INSERT INTO security_config_audit_logs (id, actor_id, action, details, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)");

    $q->execute([
        generateId(),
        $actorId,
        "security_configuration_updated",
        json_encode($settings, JSON_THROW_ON_ERROR)
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => true,
        "code" => ["message" => "Security configuration saved successfully."]
    ]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not save security configuration.",
        "code" => null
    ]);
}