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
    $organisationId = (string) ($my_details->organisation_id ?? "");

    if ($organisationId === "") {
        http_response_code(403);
        echo json_encode([
            "error" => true,
            "data" => "Organisation context is required to view shipments.",
            "code" => null
        ]);
        exit;
    }

    $q = $conn->prepare("
        SELECT
            s.*,
            (
                SELECT COUNT(*)
                FROM portal_shipment_containers c
                WHERE c.shipment_id = s.id
            ) AS container_count,
            (
                SELECT COUNT(*)
                FROM portal_shipment_documents d
                WHERE d.shipment_id = s.id
            ) AS document_count
        FROM portal_shipments s
        WHERE s.organisation_id = :organisation_id
        ORDER BY s.created_at DESC
    ");

    $q->bindValue(":organisation_id", $organisationId, PDO::PARAM_STR);
    $q->execute();
    $shipments = $q->fetchAll(PDO::FETCH_ASSOC);

    if ($shipments) {
        $shipmentIds = array_column($shipments, "id");
        $placeholders = implode(",", array_fill(0, count($shipmentIds), "?"));

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
            WHERE shipment_id IN ($placeholders)
            ORDER BY created_at ASC
        ");
        $q->execute($shipmentIds);
        $containerRows = $q->fetchAll(PDO::FETCH_ASSOC);

        $containersByShipment = [];

        foreach ($containerRows as $container) {
            $shipmentId = (string) $container["shipment_id"];
            if (!isset($containersByShipment[$shipmentId])) {
                $containersByShipment[$shipmentId] = [];
            }
            $containersByShipment[$shipmentId][] = $container;
        }

        $q = $conn->prepare("
            SELECT
                d.id,
                d.shipment_id,
                d.document_type,
                d.original_name,
                d.stored_name,
                d.file_path,
                d.mime_type,
                d.file_size,
                d.uploaded_at,
                dt.label AS document_label
            FROM portal_shipment_documents d
            LEFT JOIN document_types dt
                ON dt.document_key = d.document_type
            WHERE d.shipment_id IN ($placeholders)
            ORDER BY d.uploaded_at DESC
        ");
        $q->execute($shipmentIds);
        $documentRows = $q->fetchAll(PDO::FETCH_ASSOC);

        $documentsByShipment = [];

        foreach ($documentRows as $document) {
            $shipmentId = (string) $document["shipment_id"];
            if (!isset($documentsByShipment[$shipmentId])) {
                $documentsByShipment[$shipmentId] = [];
            }
            $documentsByShipment[$shipmentId][] = $document;
        }

        foreach ($shipments as &$shipment) {
            $shipmentId = (string) $shipment["id"];

            $shipment["containers"] = $containersByShipment[$shipmentId] ?? [];
            $shipment["documents"] = $documentsByShipment[$shipmentId] ?? [];
            $shipment["container_count"] = (int) $shipment["container_count"];
            $shipment["document_count"] = (int) $shipment["document_count"];
        }

        unset($shipment);
    }

    $q = $conn->prepare("
        SELECT id, label, is_active
        FROM terminal_shipment_types
        WHERE is_active = 1
        ORDER BY label
    ");
    $q->execute();
    $shipmentTypes = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT id, label, is_active
        FROM terminal_cargo_categories
        WHERE is_active = 1
        ORDER BY label
    ");
    $q->execute();
    $cargoCategories = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT id, label, is_active
        FROM terminal_packaging_types
        WHERE is_active = 1
        ORDER BY label
    ");
    $q->execute();
    $packagingTypes = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT
            dt.id,
            dt.document_key,
            dt.label,
            dt.sort_order,
            dult.is_required,
            dult.allow_multiple
        FROM document_types dt
        INNER JOIN document_upload_location_types dult
            ON dult.document_key = dt.document_key
        INNER JOIN document_upload_locations dul
            ON dul.id = dult.location_id
        WHERE dul.location_key = 'shipment_documents'
          AND dul.is_active = 1
        ORDER BY dt.sort_order ASC, dt.label ASC
    ");
    $q->execute();
    $supportingDocuments = $q->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "error" => false,
        "data" => true,
        "code" => [
            "shipments" => $shipments,
            "shipment_types" => $shipmentTypes,
            "cargo_categories" => $cargoCategories,
            "packaging_types" => $packagingTypes,
            "supporting_documents" => $supportingDocuments
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Unable to retrieve shipment information.",
        "code" => null
    ]);
}