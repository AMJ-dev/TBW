<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=utf-8");

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "GET") {
    header("Allow: GET");
    http_response_code(405);
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed.",
        "code" => null
    ]);
    exit;
}

$path = parse_url($_SERVER["REQUEST_URI"] ?? "", PHP_URL_PATH);
$segments = array_values(array_filter(
    explode("/", trim((string) $path, "/")),
    static fn($segment) => $segment !== ""
));

$id = trim((string) ($_GET["id"] ?? ""));

if ($id === "" && count($segments) > 0) {
    $id = trim((string) end($segments));
}

if ($id === "" || strlen($id) > 36) {
    http_response_code(400);
    echo json_encode([
        "error" => true,
        "data" => "A valid shipment ID is required.",
        "code" => null
    ]);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT
            s.*,
            o.organisation_name,
            o.organisation_name AS organisation_display_name,
            agent_org.organisation_name AS agent_organisation_name,
            agent_org.rc_number AS agent_licence_number,
            agent_org.contact_email AS agent_contact_email,
            agent_org.contact_phone AS agent_contact_phone,
            agent_org.verification_status AS agent_verification_status
        FROM portal_shipments s
        LEFT JOIN organisations o
            ON o.id = s.organisation_id
        LEFT JOIN organisations agent_org
            ON agent_org.id = s.licensed_agent_id
        WHERE s.id = :id
        LIMIT 1
    ");

    $stmt->execute([":id" => $id]);
    $shipment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$shipment) {
        http_response_code(404);
        echo json_encode([
            "error" => true,
            "data" => "Shipment not found.",
            "code" => null
        ]);
        exit;
    }

    unset($shipment["hs_code"]);

    $consigneeType = $shipment["consignee_type"] ?? "organisation";

    $consigneeDetails = [
        "type" => $consigneeType,
        "organisation_id" => $shipment["consignee_organisation_id"] ?? null,
        "organisation_name" => null,
        "status" => $shipment["consignee_status"] ?? "unregistered",
        "contact_person" => $shipment["consignee_contact_person"] ?? null,
        "name" => $shipment["consignee"] ?? null,
        "email" => $shipment["consignee_email"] ?? null,
        "phone" => $shipment["consignee_phone"] ?? null,
        "address" => $shipment["consignee_address"] ?? null,
        "country" => $shipment["consignee_country"] ?? null
    ];

    if (!empty($consigneeDetails["organisation_id"])) {
        $consigneeStmt = $conn->prepare("
            SELECT organisation_name
            FROM organisations
            WHERE id = :id
            LIMIT 1
        ");

        $consigneeStmt->execute([
            ":id" => $consigneeDetails["organisation_id"]
        ]);

        $consigneeOrganisation = $consigneeStmt->fetch(PDO::FETCH_ASSOC);

        if ($consigneeOrganisation) {
            $consigneeDetails["organisation_name"] =
                $consigneeOrganisation["organisation_name"];
        }
    }

    $agent = null;

    if (!empty($shipment["licensed_agent_id"])) {
        $agent = [
            "id" => $shipment["licensed_agent_id"],
            "name" => $shipment["agent_organisation_name"] ?? $shipment["licensed_agent_name"] ?? null,
            "licence_number" => $shipment["agent_licence_number"] ?? null,
            "contact_email" => $shipment["agent_contact_email"] ?? null,
            "contact_phone" => $shipment["agent_contact_phone"] ?? null,
            "verification_status" => $shipment["agent_verification_status"] ?? null
        ];
    } elseif (!empty($shipment["licensed_agent_name"])) {
        $agent = [
            "id" => null,
            "name" => $shipment["licensed_agent_name"],
            "licence_number" => null,
            "contact_email" => null,
            "contact_phone" => null,
            "verification_status" => null
        ];
    }

    $containerStmt = $conn->prepare("
        SELECT
            c.id,
            c.shipment_id,
            c.container_no,
            c.size,
            c.seal_no,
            c.package_count,
            c.gross_weight,
            c.cargo_description,
            c.package_type,
            c.hs_code,
            c.customs_tariff_id,
            ct.hs_code AS tariff_hs_code,
            ct.description AS customs_tariff_description,
            c.item_quantity,
            c.unit_of_measure,
            c.unit_value,
            c.currency,
            c.total_value,
            c.status,
            c.gate_in_at,
            c.received_at,
            c.stored_at,
            c.gate_out_at,
            c.created_at,
            c.updated_at
        FROM portal_shipment_containers c
        LEFT JOIN customs_tariffs ct
            ON ct.id = c.customs_tariff_id
        WHERE c.shipment_id = :shipment_id
        ORDER BY c.container_no ASC, c.created_at ASC
    ");

    $containerStmt->execute([":shipment_id" => $id]);
    $containers = $containerStmt->fetchAll(PDO::FETCH_ASSOC);

    $documentStmt = $conn->prepare("
        SELECT
            id,
            shipment_id,
            document_type,
            original_name,
            file_path,
            mime_type,
            file_size,
            uploaded_at
        FROM portal_shipment_documents
        WHERE shipment_id = :shipment_id
        ORDER BY uploaded_at DESC
    ");

    $documentStmt->execute([":shipment_id" => $id]);
    $documents = $documentStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($documents as &$document) {
        $document["url"] = $document["file_path"];
        $document["file_url"] = $document["file_path"];
    }

    unset($document);

    $shipment["consignee_details"] = $consigneeDetails;
    $shipment["consignee"] = $shipment["consignee"] ?? null;
    $shipment["agent"] = $agent;
    $shipment["agent_id"] = $shipment["licensed_agent_id"] ?? null;
    $shipment["agent_name"] =
        $agent["name"] ?? $shipment["licensed_agent_name"] ?? null;
    $shipment["agent_licence_number"] =
        $agent["licence_number"] ?? null;
    $shipment["containers"] = $containers;
    $shipment["documents"] = $documents;
    $shipment["container_count"] = count($containers);
    $shipment["containers_count"] = count($containers);

    echo json_encode([
        "error" => false,
        "data" => "Shipment details loaded.",
        "code" => [
            "shipment" => $shipment
        ]
    ], JSON_INVALID_UTF8_SUBSTITUTE | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Could not load shipment details.",
        "code" => $e->getMessage()
    ], JSON_INVALID_UTF8_SUBSTITUTE | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}