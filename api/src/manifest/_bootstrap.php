<?php
require_once dirname(__DIR__, 3) . "/include/verify-user.php";
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

function manifest_response(int $status, bool $error, string $message, ?array $code = null): void {
    http_response_code($status);
    echo json_encode(["error" => $error, "data" => $message, "code" => $code], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function manifest_actor(): string {
    global $my_details;
    $id = trim((string)($my_details->id ?? ""));
    if ($id === "") manifest_response(401, true, "Authentication required.");
    return $id;
}

function manifest_require_permission(): string {
    global $conn, $my_details;
    $actor = manifest_actor();
    $accountType = (string)($my_details->account_type ?? "");
    $roleId = (string)($my_details->system_role_id ?? "");
    if ($accountType !== "system" || $roleId === "") manifest_response(403, true, "You do not have permission to manage manifests.");
    $stmt = $conn->prepare("SELECT 1 FROM role_permissions rp INNER JOIN permissions p ON p.id = rp.permission_id WHERE rp.role_id = :role_id AND p.permission_key IN ('operations.manage','operations.cargo') LIMIT 1");
    $stmt->execute([":role_id" => $roleId]);
    if (!$stmt->fetchColumn()) manifest_response(403, true, "You do not have permission to manage manifests.");
    return $actor;
}

function manifest_uuid(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff), (random_int(0, 0x0fff) | 0x4000), (random_int(0, 0x3fff) | 0x8000), random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff));
}

function manifest_event(PDO $conn, string $manifestId, string $actor, string $type, ?string $from, ?string $to, ?string $reason = null, ?array $metadata = null): void {
    $stmt = $conn->prepare("INSERT INTO manifest_intake_events (id, manifest_id, actor_id, event_type, from_status, to_status, reason, metadata, ip_address, user_agent) VALUES (:id, :manifest_id, :actor_id, :event_type, :from_status, :to_status, :reason, :metadata, :ip, :ua)");
    $stmt->execute([
        ":id" => manifest_uuid(), ":manifest_id" => $manifestId, ":actor_id" => $actor, ":event_type" => $type,
        ":from_status" => $from, ":to_status" => $to, ":reason" => $reason,
        ":metadata" => $metadata === null ? null : json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ":ip" => $_SERVER["REMOTE_ADDR"] ?? null, ":ua" => substr((string)($_SERVER["HTTP_USER_AGENT"] ?? ""), 0, 500)
    ]);
}

function manifest_text(string $key, int $max = 255, bool $required = false): ?string {
    $value = trim((string)($_POST[$key] ?? ""));
    if ($required && $value === "") manifest_response(422, true, ucfirst(str_replace("_", " ", $key)) . " is required.");
    if (mb_strlen($value) > $max) manifest_response(422, true, ucfirst(str_replace("_", " ", $key)) . " is too long.");
    return $value === "" ? null : $value;
}

function manifest_date(?string $value, string $field): ?string {
    if ($value === null || $value === "") return null;
    $date = DateTime::createFromFormat('!Y-m-d', $value);
    if (!$date || $date->format('Y-m-d') !== $value) manifest_response(422, true, "$field must be a valid date in YYYY-MM-DD format.");
    return $value;
}

function manifest_log_exception(Throwable $e): void {
    error_log("TRINU manifest API: " . $e->getMessage());
    manifest_response(500, true, "The manifest request could not be completed.");
}
