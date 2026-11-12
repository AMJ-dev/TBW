
<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

try {
    $id = trim($_GET["id"] ?? "");

    if ($id === "" || !preg_match('/^[a-f0-9-]{36}$/i', $id)) {
        echo json_encode([
            "error" => true,
            "data" => "Invalid shipment ID.",
            "code" => null
        ]);
        exit;
    }

    $shipmentQuery = $conn->prepare("
        SELECT
            s.id,
            s.shipment_reference,
            s.bill_of_lading,
            s.consignee,
            s.cargo_description,
            s.status,
            s.organisation_id,
            o.organisation_name AS organisation_name,
            (
                SELECT COUNT(*)
                FROM portal_shipment_containers c
                WHERE c.shipment_id = s.id
            ) AS container_count
        FROM portal_shipments s
        LEFT JOIN organisations o ON o.id = s.organisation_id
        WHERE s.id = :id
        LIMIT 1
    ");

    $shipmentQuery->execute([
        ":id" => $id
    ]);

    $shipment = $shipmentQuery->fetch(PDO::FETCH_ASSOC);

    if (!$shipment) {
        http_response_code(404);

        echo json_encode([
            "error" => true,
            "data" => "Shipment not found.",
            "code" => null
        ]);
        exit;
    }

    $documentsQuery = $conn->prepare("
        SELECT
            id,
            shipment_id,
            reference_code,
            document_type,
            original_name,
            stored_name,
            file_path,
            mime_type,
            file_size,
            status,
            uploaded_at
        FROM portal_shipment_documents
        WHERE shipment_id = :shipment_id
        ORDER BY uploaded_at DESC
    ");

    $documentsQuery->execute([
        ":shipment_id" => $id
    ]);

    $documents = $documentsQuery->fetchAll(PDO::FETCH_ASSOC);

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

    foreach ($documents as &$document) {
        $document["file_size"] = (int) $document["file_size"];
        $document["status"] = $document["status"] ?? "PENDING_REVIEW";
    }
    unset($document);

    foreach ($types as &$type) {
        $type["is_required"] = (bool) $type["is_required"];
        $type["allow_multiple"] = (bool) $type["allow_multiple"];
        $type["sort_order"] = (int) $type["sort_order"];
    }
    unset($type);

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

    echo json_encode([
        "error" => false,
        "data" => "Shipment documents loaded successfully.",
        "code" => [
            "shipment" => $shipment,
            "documents" => $documents,
            "types" => $types,
            "summary" => [
                "total" => count($documents),
                "verified" => $verifiedCount,
                "pending" => $pendingCount,
                "rejected" => $rejectedCount,
                "correction_requested" => $correctionCount
            ]
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "error" => true,
        "data" => "Could not load shipment documents.",
        "code" => $e->getMessage()
    ]);
} catch (Throwable $e) {
    echo json_encode([
        "error" => true,
        "data" => "An unexpected error occurred.",
        "code" => $e->getMessage()
    ]);
}
