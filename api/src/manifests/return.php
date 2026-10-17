<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=UTF-8");

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
    exit;
}

$userId = (string) ($my_details->id ?? "");
$accountType = (string) ($my_details->account_type ?? "");
$roleId = (string) ($my_details->system_role_id ?? "");

if ($userId === "") {
    http_response_code(401);
    echo json_encode(["error" => true, "data" => "Authentication required.", "code" => null]);
    exit;
}

if ($accountType !== "system" || $roleId === "") {
    http_response_code(403);
    echo json_encode(["error" => true, "data" => "Access denied.", "code" => null]);
    exit;
}

$permission = $conn->prepare("
    SELECT 1
    FROM role_permissions rp
    INNER JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = :role_id
      AND p.permission_key = 'operations.manage'
    LIMIT 1
");
$permission->execute([":role_id" => $roleId]);

if (!$permission->fetchColumn()) {
    http_response_code(403);
    echo json_encode(["error" => true, "data" => "You do not have permission to return manifests.", "code" => null]);
    exit;
}

$id = trim((string) ($_POST["id"] ?? ""));
$reason = trim((string) ($_POST["correction_reason"] ?? ""));

if ($id === "" || mb_strlen($reason) < 5 || mb_strlen($reason) > 2000) {
    http_response_code(422);
    echo json_encode(["error" => true, "data" => "Manifest ID and a return reason of 5 to 2000 characters are required.", "code" => null]);
    exit;
}

try {
    $conn->beginTransaction();

    $get = $conn->prepare("
        SELECT id, review_responsible_party, flagged_at, review_status
        FROM operation_manifests
        WHERE id = :id
        FOR UPDATE
    ");
    $get->execute([":id" => $id]);
    $manifest = $get->fetch(PDO::FETCH_ASSOC);

    if (!$manifest) {
        $conn->rollBack();
        http_response_code(404);
        echo json_encode(["error" => true, "data" => "Manifest not found.", "code" => null]);
        exit;
    }

    if (
        $manifest["review_responsible_party"] !== "Operations" ||
        empty($manifest["flagged_at"]) ||
        !in_array($manifest["review_status"], ["Pending", "In Review"], true)
    ) {
        $conn->rollBack();
        http_response_code(409);
        echo json_encode(["error" => true, "data" => "This manifest is no longer awaiting Operations review.", "code" => null]);
        exit;
    }

    $update = $conn->prepare("
        UPDATE operation_manifests
        SET
            review_status = 'Returned',
            correction_reason = :reason,
            reviewed_by = :reviewed_by,
            reviewed_at = CURRENT_TIMESTAMP
        WHERE id = :id
    ");

    $update->execute([
        ":reason" => $reason,
        ":reviewed_by" => $userId,
        ":id" => $id
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Manifest returned to Operations with instructions.",
        "code" => null
    ]);
} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode(["error" => true, "data" => "Could not return the manifest to Operations.", "code" => null]);
}