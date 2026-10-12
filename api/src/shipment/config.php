<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

try {
    $q = $conn->prepare("
        SELECT id, label
        FROM terminal_shipment_types
        WHERE is_active = 1
        ORDER BY label ASC
    ");
    $q->execute();
    $shipment_types = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT id, label
        FROM terminal_cargo_categories
        WHERE is_active = 1
        ORDER BY label ASC
    ");
    $q->execute();
    $cargo_categories = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT id, label
        FROM terminal_packaging_types
        WHERE is_active = 1
        ORDER BY label ASC
    ");
    $q->execute();
    $packaging_types = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT id, label
        FROM terminal_container_sizes
        WHERE is_active = 1
        ORDER BY sort_order ASC, label ASC
    ");
    $q->execute();
    $container_sizes = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT
            dt.document_key AS document_key,
            dt.label AS label,
            dult.is_required AS required,
            dult.allow_multiple AS allow_multiple,
            dt.sort_order AS sort_order
        FROM document_upload_locations dul
        INNER JOIN document_upload_location_types dult
            ON dult.location_id = dul.id
        INNER JOIN document_types dt
            ON dt.document_key = dult.document_key
        INNER JOIN document_config_versions dcv
            ON dcv.id = dt.config_version_id
        WHERE dul.location_key = 'shipment_documents'
            AND dul.is_active = 1
            AND dcv.is_current = 1
        ORDER BY dt.sort_order ASC, dt.label ASC
    ");
    $q->execute();
    $supporting_documents = $q->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "error" => false,
        "data" => true,
        "code" => [
            "shipment_types" => $shipment_types,
            "cargo_categories" => $cargo_categories,
            "packaging_types" => $packaging_types,
            "container_sizes" => $container_sizes,
            "supporting_documents" => $supporting_documents
        ]
    ]);
} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Unable to load shipment configuration.",
        "code" => null
    ]);
}