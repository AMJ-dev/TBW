<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
   
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
        echo json_encode([
            "error" => true,
            "data" => "Authentication required.",
            "code" => null
        ]);
        exit;
    }

    $accountType = (string) ($my_details->account_type ?? "");
    $systemRoleId = (string) ($my_details->system_role_id ?? "");

    $allowedSystemRoles = [
        "18386d94-bc37-11f1-bb55-5081407ad051",
        "1838762d-bc37-11f1-bb55-5081407ad051",
        "18387679-bc37-11f1-bb55-5081407ad051",
        "183876de-bc37-11f1-bb55-5081407ad051",
        "1838771d-bc37-11f1-bb55-5081407ad051"
    ];

    if ($accountType !== "system" || !in_array($systemRoleId, $allowedSystemRoles, true)) {
        echo json_encode([
            "error" => true,
            "data" => "You do not have permission to view shipments.",
            "code" => null
        ]);
        exit;
    }

    $status = trim($_GET["status"] ?? "");
    $organisationId = trim($_GET["organisation_id"] ?? "");
    $search = trim($_GET["q"] ?? "");
    $page = max(1, (int) ($_GET["page"] ?? 1));
    $pageSize = (int) ($_GET["page_size"] ?? 25);

    if ($pageSize < 1) {
        $pageSize = 25;
    }

    if ($pageSize > 100) {
        $pageSize = 100;
    }

    $offset = ($page - 1) * $pageSize;

    $where = [];
    $params = [];

    if ($status !== "") {
        $where[] = "ps.status = :status";
        $params[":status"] = $status;
    }

    if ($organisationId !== "") {
        $where[] = "ps.organisation_id = :organisation_id";
        $params[":organisation_id"] = $organisationId;
    }

    if ($search !== "") {
        $where[] = "(
            ps.id LIKE :search
            OR ps.bill_of_lading LIKE :search
            OR ps.booking_number LIKE :search
            OR ps.cargo_description LIKE :search
            OR ps.cargo_category LIKE :search
            OR o.organisation_name LIKE :search
        )";
        $params[":search"] = "%" . $search . "%";
    }

    $whereSql = $where ? ("WHERE " . implode(" AND ", $where)) : "";

    $countSql = "
        SELECT COUNT(*)
        FROM portal_shipments ps
        LEFT JOIN organisations o ON o.id = ps.organisation_id
        $whereSql
    ";

    $countStmt = $conn->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $total = (int) $countStmt->fetchColumn();

    $listSql = "
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
        $whereSql
        ORDER BY ps.created_at DESC
        LIMIT :limit OFFSET :offset
    ";

    $listStmt = $conn->prepare($listSql);
    foreach ($params as $key => $value) {
        $listStmt->bindValue($key, $value);
    }
    $listStmt->bindValue(":limit", $pageSize, PDO::PARAM_INT);
    $listStmt->bindValue(":offset", $offset, PDO::PARAM_INT);
    $listStmt->execute();
    $shipments = $listStmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$shipments) {
        echo json_encode([
            "error" => false,
            "data" => "Shipments loaded.",
            "code" => [
                "shipments" => [],
                "pagination" => [
                    "page" => $page,
                    "page_size" => $pageSize,
                    "total" => $total,
                    "total_pages" => $total > 0 ? (int) ceil($total / $pageSize) : 1
                ]
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $shipmentIds = array_map(
        static fn(array $row): string => (string) $row["id"],
        $shipments
    );

    $placeholders = implode(",", array_fill(0, count($shipmentIds), "?"));

    $containerStmt = $conn->prepare("
        SELECT id, shipment_id, container_no, size, seal_no, package_count, gross_weight
        FROM portal_shipment_containers
        WHERE shipment_id IN ($placeholders)
        ORDER BY created_at ASC
    ");
    $containerStmt->execute($shipmentIds);
    $containerRows = $containerStmt->fetchAll(PDO::FETCH_ASSOC);

    $containersByShipment = [];
    foreach ($containerRows as $row) {
        $sid = (string) $row["shipment_id"];
        if (!isset($containersByShipment[$sid])) {
            $containersByShipment[$sid] = [];
        }
        $containersByShipment[$sid][] = [
            "id" => (string) $row["id"],
            "container_no" => (string) $row["container_no"],
            "size" => $row["size"],
            "seal_no" => $row["seal_no"],
            "package_count" => $row["package_count"] !== null ? (float) $row["package_count"] : null,
            "gross_weight" => $row["gross_weight"] !== null ? (float) $row["gross_weight"] : null
        ];
    }

    $documentStmt = $conn->prepare("
        SELECT id, shipment_id, document_type, original_name, file_path, mime_type, file_size, uploaded_at
        FROM portal_shipment_documents
        WHERE shipment_id IN ($placeholders)
        ORDER BY uploaded_at ASC
    ");
    $documentStmt->execute($shipmentIds);
    $documentRows = $documentStmt->fetchAll(PDO::FETCH_ASSOC);

    $documentsByShipment = [];
    foreach ($documentRows as $row) {
        $sid = (string) $row["shipment_id"];
        if (!isset($documentsByShipment[$sid])) {
            $documentsByShipment[$sid] = [];
        }
        $documentsByShipment[$sid][] = [
            "id" => (string) $row["id"],
            "document_type" => (string) $row["document_type"],
            "original_name" => (string) $row["original_name"],
            "file_path" => (string) $row["file_path"],
            "mime_type" => $row["mime_type"],
            "file_size" => (int) $row["file_size"],
            "uploaded_at" => (string) $row["uploaded_at"]
        ];
    }

    $result = [];
    foreach ($shipments as $row) {
        $sid = (string) $row["id"];
        $result[] = [
            "id" => $sid,
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
            "containers" => $containersByShipment[$sid] ?? [],
            "documents" => $documentsByShipment[$sid] ?? []
        ];
    }

    echo json_encode([
        "error" => false,
        "data" => "Shipments loaded.",
        "code" => [
            "shipments" => $result,
            "pagination" => [
                "page" => $page,
                "page_size" => $pageSize,
                "total" => $total,
                "total_pages" => $total > 0 ? (int) ceil($total / $pageSize) : 1
            ]
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    
    echo json_encode([
        "error" => true,
        "data" => "Could not load shipments.",
        "code" => null
    ]);
}