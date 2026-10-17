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
    echo json_encode(["error" => true, "data" => "You do not have permission to approve manifests.", "code" => null]);
    exit;
}

$id = trim((string) ($_POST["id"] ?? ""));
$reason = trim((string) ($_POST["correction_reason"] ?? ""));

$fields = [
    "manifest_ref" => trim((string) ($_POST["manifest_ref"] ?? "")),
    "bill_of_lading" => trim((string) ($_POST["bill_of_lading"] ?? "")),
    "vessel" => trim((string) ($_POST["vessel"] ?? "")),
    "shipping_line" => trim((string) ($_POST["shipping_line"] ?? "")),
    "origin_port" => trim((string) ($_POST["origin_port"] ?? "")),
    "eta" => trim((string) ($_POST["eta"] ?? "")),
    "containers" => trim((string) ($_POST["containers"] ?? "")),
    "packages" => trim((string) ($_POST["packages"] ?? "")),
    "gross_weight" => trim((string) ($_POST["gross_weight"] ?? "")),
    "consignee" => trim((string) ($_POST["consignee"] ?? "")),
    "agent" => trim((string) ($_POST["agent"] ?? "")),
    "consignee_email" => trim((string) ($_POST["consignee_email"] ?? "")),
    "consignee_phone" => trim((string) ($_POST["consignee_phone"] ?? "")),
    "consignee_address" => trim((string) ($_POST["consignee_address"] ?? "")),
    "notes" => trim((string) ($_POST["notes"] ?? ""))
];

if ($id === "") {
    http_response_code(422);
    echo json_encode(["error" => true, "data" => "Manifest ID is required.", "code" => null]);
    exit;
}

if (mb_strlen($reason) < 5 || mb_strlen($reason) > 2000) {
    http_response_code(422);
    echo json_encode(["error" => true, "data" => "Enter a correction reason between 5 and 2000 characters.", "code" => null]);
    exit;
}

if ($fields["manifest_ref"] === "" || $fields["bill_of_lading"] === "" || $fields["consignee"] === "") {
    http_response_code(422);
    echo json_encode(["error" => true, "data" => "Manifest reference, bill of lading and consignee are required.", "code" => null]);
    exit;
}

if (!ctype_digit($fields["containers"]) || !ctype_digit($fields["packages"])) {
    http_response_code(422);
    echo json_encode(["error" => true, "data" => "Containers and packages must be whole numbers.", "code" => null]);
    exit;
}

if ((int) $fields["containers"] < 0 || (int) $fields["packages"] < 0) {
    http_response_code(422);
    echo json_encode(["error" => true, "data" => "Containers and packages cannot be negative.", "code" => null]);
    exit;
}

if ($fields["consignee_email"] !== "" && !filter_var($fields["consignee_email"], FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(["error" => true, "data" => "Enter a valid consignee email address.", "code" => null]);
    exit;
}

try {
    $conn->beginTransaction();

    $get = $conn->prepare("
        SELECT *
        FROM operation_manifests
        WHERE id = :id
        FOR UPDATE
    ");
    $get->execute([":id" => $id]);
    $old = $get->fetch(PDO::FETCH_ASSOC);

    if (!$old) {
        $conn->rollBack();
        http_response_code(404);
        echo json_encode(["error" => true, "data" => "Manifest not found.", "code" => null]);
        exit;
    }

    if (
        $old["review_responsible_party"] !== "Operations" ||
        empty($old["flagged_at"]) ||
        !in_array($old["review_status"], ["Pending", "In Review"], true)
    ) {
        $conn->rollBack();
        http_response_code(409);
        echo json_encode(["error" => true, "data" => "This manifest is no longer awaiting Operations review.", "code" => null]);
        exit;
    }

    $update = $conn->prepare("
        UPDATE operation_manifests
        SET
            manifest_ref = :manifest_ref,
            bill_of_lading = :bill_of_lading,
            vessel = :vessel,
            shipping_line = :shipping_line,
            origin_port = :origin_port,
            eta = :eta,
            containers = :containers,
            packages = :packages,
            gross_weight = :gross_weight,
            consignee = :consignee,
            agent = :agent,
            consignee_email = :consignee_email,
            consignee_phone = :consignee_phone,
            consignee_address = :consignee_address,
            notes = :notes,
            correction_reason = :correction_reason,
            review_status = 'Approved',
            reviewed_by = :reviewed_by,
            reviewed_at = CURRENT_TIMESTAMP,
            review_reason = NULL,
            review_responsible_party = NULL,
            flagged_by = NULL,
            flagged_at = NULL
        WHERE id = :id
    ");

    $update->execute([
        ":manifest_ref" => $fields["manifest_ref"],
        ":bill_of_lading" => $fields["bill_of_lading"],
        ":vessel" => $fields["vessel"] !== "" ? $fields["vessel"] : null,
        ":shipping_line" => $fields["shipping_line"] !== "" ? $fields["shipping_line"] : null,
        ":origin_port" => $fields["origin_port"] !== "" ? $fields["origin_port"] : null,
        ":eta" => $fields["eta"] !== "" ? $fields["eta"] : null,
        ":containers" => (int) $fields["containers"],
        ":packages" => (int) $fields["packages"],
        ":gross_weight" => $fields["gross_weight"] !== "" ? $fields["gross_weight"] : null,
        ":consignee" => $fields["consignee"],
        ":agent" => $fields["agent"] !== "" ? $fields["agent"] : null,
        ":consignee_email" => $fields["consignee_email"] !== "" ? $fields["consignee_email"] : null,
        ":consignee_phone" => $fields["consignee_phone"] !== "" ? $fields["consignee_phone"] : null,
        ":consignee_address" => $fields["consignee_address"] !== "" ? $fields["consignee_address"] : null,
        ":notes" => $fields["notes"] !== "" ? $fields["notes"] : null,
        ":correction_reason" => $reason,
        ":reviewed_by" => $userId,
        ":id" => $id
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Manifest corrections saved and approved.",
        "code" => null
    ]);
} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode(["error" => true, "data" => "Could not save and approve the manifest.", "code" => null]);
}