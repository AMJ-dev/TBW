
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
    $q = $conn->query("
        SELECT id, label
        FROM terminal_shipment_types
        ORDER BY label
    ");
    $shipmentTypes = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->query("
        SELECT id, label
        FROM terminal_cargo_categories
        ORDER BY label
    ");
    $cargoCategories = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->query("
        SELECT id, label
        FROM terminal_packaging_types
        ORDER BY label
    ");
    $packagingTypes = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->query("
        SELECT id, size AS label
        FROM terminal_container_sizes
        ORDER BY size
    ");
    $containerSizes = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->query("
        SELECT DISTINCT
            dt.id,
            dt.document_key AS `key`,
            dt.label
        FROM document_types dt
        INNER JOIN document_upload_location_types dult
            ON dult.document_type_key = dt.document_key
        INNER JOIN document_upload_locations dul
            ON dul.id = dult.location_id
        WHERE dul.location_key = 'shipment_documents'
          AND dul.is_active = 1
        ORDER BY dt.sort_order, dt.label
    ");
    $supportingDocuments = $q->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "error" => false,
        "data" => true,
        "code" => [
            "shipment_types" => $shipmentTypes,
            "cargo_categories" => $cargoCategories,
            "packaging_types" => $packagingTypes,
            "container_sizes" => $containerSizes,
            "supporting_documents" => $supportingDocuments
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not load shipment configuration.",
        "code" => $e->getMessage()
    ]);
}
