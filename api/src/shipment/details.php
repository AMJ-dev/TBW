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

    $shipmentId = trim((string) ($_GET["id"] ?? ""));

    if ($shipmentId === "") {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Shipment id is required.",
            "code" => null
        ]);
        exit;
    }

    $organizationId = (string) ($my_details->organisation_id ?? "");

    $q = $conn->prepare("
        SELECT
            s.id,
            s.user_id,
            s.organisation_id,
            s.shipment_type,
            s.bill_of_lading,
            s.booking_number,
            s.vessel_name,
            s.voyage_number,
            s.shipping_line,
            s.origin_country,
            s.origin_port,
            s.destination_port,
            s.expected_arrival,
            s.consignee,
            s.consignee_email,
            s.consignee_phone,
            s.cargo_description,
            s.cargo_category,
            s.package_type,
            s.package_count,
            s.gross_weight,
            s.volume,
            s.hs_code,
            s.dangerous_goods,
            s.temperature_controlled,
            s.temperature,
            s.special_instructions,
            s.customs_reference,
            s.status,
            s.created_at,
            s.updated_at
        FROM portal_shipments s
        WHERE s.id = :id
          AND s.organisation_id = :organisation_id
        LIMIT 1
    ");
    $q->bindValue(":id", $shipmentId, PDO::PARAM_STR);
    $q->bindValue(":organisation_id", $organizationId, PDO::PARAM_STR);
    $q->execute();
    $shipment = $q->fetch(PDO::FETCH_ASSOC);

    if (!$shipment) {
        http_response_code(404);
        echo json_encode([
            "error" => true,
            "data" => "Shipment not found.",
            "code" => null
        ]);
        exit;
    }

    $q = $conn->prepare("
        SELECT
            id,
            shipment_id,
            container_no,
            size,
            seal_no,
            package_count,
            gross_weight,
            created_at
        FROM portal_shipment_containers
        WHERE shipment_id = :shipment_id
        ORDER BY created_at ASC, id ASC
    ");
    $q->bindValue(":shipment_id", $shipmentId, PDO::PARAM_STR);
    $q->execute();
    $containers = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT
            id,
            shipment_id,
            document_type,
            original_name,
            stored_name,
            file_path,
            mime_type,
            file_size,
            uploaded_at,
            NULL AS document_label
        FROM portal_shipment_documents
        WHERE shipment_id = :shipment_id
        ORDER BY uploaded_at ASC, id ASC
    ");
    $q->bindValue(":shipment_id", $shipmentId, PDO::PARAM_STR);
    $q->execute();
    $documents = $q->fetchAll(PDO::FETCH_ASSOC);

    $shipment["container_count"] = count($containers);
    $shipment["document_count"] = count($documents);
    $shipment["containers"] = $containers;
    $shipment["documents"] = $documents;

    echo json_encode([
        "error" => false,
        "data" => true,
        "code" => [
            "shipment" => $shipment
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not load this shipment.",
        "code" => $e->getMessage()
    ]);
}