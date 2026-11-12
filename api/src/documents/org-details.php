
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
        SELECT
            s.id,
            s.shipment_reference,
            s.bill_of_lading,
            s.consignee,
            s.cargo_description,
            s.status,
            s.document_status,
            s.organisation_id,
            o.organisation_name AS organisation_name,
            (
                SELECT COUNT(*)
                FROM portal_shipment_containers c
                WHERE c.shipment_id = s.id
            ) AS container_count
        FROM portal_shipments s
        LEFT JOIN organisations o ON o.id = s.organisation_id
        WHERE BINARY s.id = BINARY :id
        LIMIT 1
    ");

    $shipment_stmt->execute([
        ":id" => $shipment_id
    ]);

    $shipment = $shipment_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$shipment) {
        http_response_code(404);

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

    $documents_stmt = $conn->prepare("
        SELECT
            id,
            shipment_id,
            document_type,
            reference_code,
            original_name,
            stored_name,
            file_path,
            mime_type,
            file_size,
            status,
            review_reason,
            uploaded_at
        FROM portal_shipment_documents
        WHERE BINARY shipment_id = BINARY :shipment_id
        ORDER BY uploaded_at DESC
    ");

    $documents_stmt->execute([
        ":shipment_id" => $shipment_id
    ]);

    $documents = $documents_stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($types as &$type) {
        $type["is_required"] = (bool) $type["is_required"];
        $type["allow_multiple"] = (bool) $type["allow_multiple"];
        $type["sort_order"] = (int) $type["sort_order"];
    }
    unset($type);

    foreach ($documents as &$document) {
        $document["file_size"] = (int) $document["file_size"];
        $document["status"] = $document["status"] ?? "PENDING_REVIEW";
        $document["review_reason"] = $document["review_reason"] ?? null;
    }
    unset($document);

    $shipment["container_count"] = (int) $shipment["container_count"];

    $verifiedCount = count(array_filter(
        $documents,
        fn($document) => $document["status"] === "VERIFIED"
    ));

    $pendingCount = count(array_filter(
        $documents,
        fn($document) => $document["status"] === "PENDING_REVIEW"
    ));

    $rejectedCount = count(array_filter(
        $documents,
        fn($document) => $document["status"] === "REJECTED"
    ));

    $correctionCount = count(array_filter(
        $documents,
        fn($document) => $document["status"] === "CHANGES_REQUESTED"
    ));

    $missingCount = count(array_filter(
        $documents,
        fn($document) => $document["status"] === "MISSING"
    ));

    echo json_encode([
        "error" => false,
        "data" => "Shipment documents loaded successfully.",
        "code" => [
            "shipment" => $shipment,
            "types" => $types,
            "documents" => $documents,
            "summary" => [
                "total" => count($documents),
                "verified" => $verifiedCount,
                "pending" => $pendingCount,
                "rejected" => $rejectedCount,
                "correction_requested" => $correctionCount,
                "missing" => $missingCount
            ]
        ]
    ]);

} catch (Throwable $e) {
    error_log("Operations Documents Details API Error: " . $e->getMessage());

    echo json_encode([
        "error" => true,
        "data" => "Could not load shipment documents.",
        "code" => $e->getMessage()
    ]);
}
