
<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

try {
    $shipment_id = trim($_GET["id"] ?? "");

    if ($shipment_id === "") {
        echo json_encode([
            "error" => true,
            "data" => "Shipment ID is required.",
            "code" => null
        ]);
        exit;
    }

    $shipment_stmt = $conn->prepare("
        SELECT id
        FROM portal_shipments
        WHERE BINARY id = BINARY :id
        LIMIT 1
    ");

    $shipment_stmt->execute([
        ":id" => $shipment_id
    ]);

    $shipment = $shipment_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$shipment) {
        echo json_encode([
            "error" => true,
            "data" => "Shipment not found.",
            "code" => null
        ]);
        exit;
    }

    $types_stmt = $conn->prepare("
        SELECT
            dt.document_key,
            dt.label,
            dt.sort_order,
            lut.is_required,
            lut.allow_multiple
        FROM document_upload_locations l
        INNER JOIN document_upload_location_types lut
            ON BINARY lut.location_id = BINARY l.id
        INNER JOIN document_config_versions cv
            ON cv.is_current = 1
        INNER JOIN document_types dt
            ON BINARY dt.config_version_id = BINARY cv.id
            AND dt.document_key = lut.document_key
        WHERE l.location_key = 'shipment_documents'
        AND l.is_active = 1
        ORDER BY dt.sort_order ASC, dt.label ASC
    ");

    $types_stmt->execute();
    $types = $types_stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($types as &$type) {
        $type["is_required"] = (bool) $type["is_required"];
        $type["allow_multiple"] = (bool) $type["allow_multiple"];
        $type["sort_order"] = (int) $type["sort_order"];
    }
    unset($type);

    $documents_stmt = $conn->prepare("
        SELECT
            id,
            document_type,
            original_name,
            file_path,
            mime_type,
            file_size,
            uploaded_at,
            status
        FROM portal_shipment_documents
        WHERE BINARY shipment_id = BINARY :shipment_id
        ORDER BY uploaded_at DESC
    ");

    $documents_stmt->execute([
        ":shipment_id" => $shipment_id
    ]);

    $documents = $documents_stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($documents as &$document) {
        $document["file_size"] = (int) $document["file_size"];
    }
    unset($document);

    $code = [
        "types" => $types,
        "documents" => $documents
    ];

    echo json_encode([
        "error" => false,
        "data" => "Shipment documents loaded successfully.",
        "code" => $code
    ]);

} catch (Throwable $e) {
    error_log("Operations Documents Details API Error: " . $e->getMessage());

    echo json_encode([
        "error" => true,
        "data" => "Could not load shipment documents.",
        "code" => null
    ]);
}
