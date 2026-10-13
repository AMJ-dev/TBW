<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed",
        "code" => null
    ]);
    exit;
}

try {
    $userId = (string) ($my_details->id ?? "");

    if ($userId === "") {
        http_response_code(401);
        echo json_encode([
            "error" => true,
            "data" => "Authentication required.",
            "code" => null
        ]);
        exit;
    }

    $accountType = (string) ($my_details->account_type ?? "");
    $systemRoleId = (string) ($my_details->system_role_id ?? "");

    if ($accountType !== "system" || $systemRoleId === "") {
        http_response_code(403);
        echo json_encode([
            "error" => true,
            "data" => "You do not have permission to view shipments.",
            "code" => null
        ]);
        exit;
    }

    $permStmt = $conn->prepare("
        SELECT 1
        FROM role_permissions rp
        INNER JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.role_id = :role_id
          AND p.permission_key = :permission_key
        LIMIT 1
    ");
    $permStmt->bindValue(":role_id", $systemRoleId);
    $permStmt->bindValue(":permission_key", "operations.view");
    $permStmt->execute();

    if (!$permStmt->fetchColumn()) {
        http_response_code(403);
        echo json_encode([
            "error" => true,
            "data" => "You do not have permission to view shipments.",
            "code" => null
        ]);
        exit;
    }

    $shipmentId = trim($_GET["id"] ?? "");

    if ($shipmentId === "") {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Shipment id is required.",
            "code" => null
        ]);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT
            ps.id,
            ps.shipment_reference,
            ps.user_id,
            ps.organisation_id,
            o.organisation_name AS organisation_name,
            ps.shipment_type,
            ps.bill_of_lading,
            ps.booking_number,
            ps.vessel_name,
            ps.voyage_number,
            ps.shipping_line,
            ps.origin_country,
            ps.origin_port,
            ps.destination_port,
            ps.expected_arrival,
            ps.consignee,
            ps.consignee_email,
            ps.consignee_phone,
            ps.cargo_description,
            ps.cargo_category,
            ps.package_type,
            ps.package_count,
            ps.gross_weight,
            ps.volume,
            ps.hs_code,
            ps.dangerous_goods,
            ps.temperature_controlled,
            ps.temperature,
            ps.special_instructions,
            ps.customs_reference,
            ps.status,
            ps.created_at,
            ps.updated_at
        FROM portal_shipments ps
        LEFT JOIN organisations o ON o.id = ps.organisation_id
        WHERE ps.id = :id
        LIMIT 1
    ");
    $stmt->bindValue(":id", $shipmentId);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode([
            "error" => true,
            "data" => "Shipment not found.",
            "code" => null
        ]);
        exit;
    }

    $containerStmt = $conn->prepare("
        SELECT id, container_no, size, seal_no, package_count, gross_weight
        FROM portal_shipment_containers
        WHERE shipment_id = :shipment_id
        ORDER BY created_at ASC
    ");
    $containerStmt->bindValue(":shipment_id", $shipmentId);
    $containerStmt->execute();
    $containerRows = $containerStmt->fetchAll(PDO::FETCH_ASSOC);

    $containers = [];
    foreach ($containerRows as $c) {
        $containers[] = [
            "id" => (string) $c["id"],
            "container_no" => (string) $c["container_no"],
            "size" => $c["size"],
            "seal_no" => $c["seal_no"],
            "package_count" => $c["package_count"] !== null ? (float) $c["package_count"] : null,
            "gross_weight" => $c["gross_weight"] !== null ? (float) $c["gross_weight"] : null
        ];
    }

    $documentStmt = $conn->prepare("
        SELECT id, document_type, original_name, file_path, mime_type, file_size, uploaded_at
        FROM portal_shipment_documents
        WHERE shipment_id = :shipment_id
        ORDER BY uploaded_at ASC
    ");
    $documentStmt->bindValue(":shipment_id", $shipmentId);
    $documentStmt->execute();
    $documentRows = $documentStmt->fetchAll(PDO::FETCH_ASSOC);

    $documents = [];
    foreach ($documentRows as $d) {
        $documents[] = [
            "id" => (string) $d["id"],
            "document_type" => (string) $d["document_type"],
            "original_name" => (string) $d["original_name"],
            "file_path" => (string) $d["file_path"],
            "mime_type" => $d["mime_type"],
            "file_size" => (int) $d["file_size"],
            "uploaded_at" => (string) $d["uploaded_at"]
        ];
    }

    $shipment = [
        "id" => (string) $row["id"],
        "shipment_reference" => $row["shipment_reference"],
        "user_id" => (string) $row["user_id"],
        "organisation_id" => $row["organisation_id"],
        "organisation_name" => $row["organisation_name"],
        "shipment_type" => (string) $row["shipment_type"],
        "bill_of_lading" => $row["bill_of_lading"],
        "booking_number" => $row["booking_number"],
        "vessel_name" => $row["vessel_name"],
        "voyage_number" => $row["voyage_number"],
        "shipping_line" => $row["shipping_line"],
        "origin_country" => $row["origin_country"],
        "origin_port" => $row["origin_port"],
        "destination_port" => $row["destination_port"],
        "expected_arrival" => $row["expected_arrival"],
        "consignee" => $row["consignee"],
        "consignee_email" => $row["consignee_email"],
        "consignee_phone" => $row["consignee_phone"],
        "cargo_description" => $row["cargo_description"],
        "cargo_category" => (string) $row["cargo_category"],
        "package_type" => (string) $row["package_type"],
        "package_count" => $row["package_count"] !== null ? (float) $row["package_count"] : null,
        "gross_weight" => $row["gross_weight"] !== null ? (float) $row["gross_weight"] : null,
        "volume" => $row["volume"] !== null ? (float) $row["volume"] : null,
        "hs_code" => $row["hs_code"],
        "dangerous_goods" => (string) $row["dangerous_goods"],
        "temperature_controlled" => (string) $row["temperature_controlled"],
        "temperature" => $row["temperature"],
        "special_instructions" => $row["special_instructions"],
        "customs_reference" => $row["customs_reference"],
        "status" => (string) $row["status"],
        "created_at" => (string) $row["created_at"],
        "updated_at" => (string) $row["updated_at"],
        "containers" => $containers,
        "documents" => $documents
    ];

    echo json_encode([
        "error" => false,
        "data" => "Shipment loaded.",
        "code" => [
            "shipment" => $shipment
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not load shipment.",
        "code" => null
    ]);
}