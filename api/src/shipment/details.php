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

    if ($organizationId === "") {
        http_response_code(403);
        echo json_encode([
            "error" => true,
            "data" => "Organisation access is required.",
            "code" => null
        ]);
        exit;
    }

    $q = $conn->prepare("
        SELECT
            s.id,
            s.user_id,
            s.shipment_reference,
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
            om.id,
            om.manifest_ref,
            om.bill_of_lading,
            om.status,
            om.review_reason,
            om.review_responsible_party,
            om.flagged_at,
            om.notes,
            om.received_at,
            om.updated_at
        FROM operation_manifests om
        WHERE om.matched_shipment_id = :matched_shipment_id
           OR EXISTS (
                SELECT 1
                FROM operation_manifest_shipment_matches omsm
                WHERE omsm.manifest_id = om.id
                  AND omsm.shipment_id = :linked_shipment_id
           )
        ORDER BY
            CASE
                WHEN om.status = 'Discrepancy' THEN 0
                WHEN om.review_reason IS NOT NULL AND om.review_reason <> '' THEN 1
                ELSE 2
            END,
            COALESCE(om.flagged_at, om.updated_at, om.received_at) DESC
        LIMIT 1
    ");
    $q->bindValue(":matched_shipment_id", $shipmentId, PDO::PARAM_STR);
    $q->bindValue(":linked_shipment_id", $shipmentId, PDO::PARAM_STR);
    $q->execute();
    $manifest = $q->fetch(PDO::FETCH_ASSOC);

    if ($manifest) {
        $shipment["manifest"] = [
            "id" => (string) $manifest["id"],
            "manifest_ref" => $manifest["manifest_ref"],
            "bill_of_lading" => $manifest["bill_of_lading"],
            "status" => $manifest["status"],
            "review_reason" => $manifest["review_reason"],
            "review_responsible_party" => $manifest["review_responsible_party"],
            "flagged_at" => $manifest["flagged_at"],
            "notes" => $manifest["notes"],
            "received_at" => $manifest["received_at"],
            "updated_at" => $manifest["updated_at"]
        ];
    } else {
        $shipment["manifest"] = null;
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

    $q = $conn->prepare("
        SELECT
            sdr.id,
            sdr.shipment_id,
            sdr.reviewer_id,
            reviewer.full_name AS reviewer_name,
            reviewer.email AS reviewer_email,
            reviewer.phone AS reviewer_phone,
            reviewer.pics AS reviewer_pics,
            sdr.decision,
            sdr.from_status,
            sdr.to_status,
            sdr.reason,
            sdr.created_at
        FROM shipment_declaration_reviews sdr
        LEFT JOIN users reviewer ON reviewer.id = sdr.reviewer_id
        WHERE sdr.shipment_id = :shipment_id
        ORDER BY sdr.created_at DESC, sdr.id DESC
    ");
    $q->bindValue(":shipment_id", $shipmentId, PDO::PARAM_STR);
    $q->execute();
    $reviewRows = $q->fetchAll(PDO::FETCH_ASSOC);

    $reviews = [];

    foreach ($reviewRows as $review) {
        $reviews[] = [
            "id" => (string) $review["id"],
            "shipment_id" => (string) $review["shipment_id"],
            "reviewer_id" => $review["reviewer_id"] !== null
                ? (string) $review["reviewer_id"]
                : null,
            "reviewer" => $review["reviewer_id"] !== null ? [
                "id" => (string) $review["reviewer_id"],
                "full_name" => $review["reviewer_name"],
                "email" => $review["reviewer_email"],
                "phone" => $review["reviewer_phone"],
                "pics" => $review["reviewer_pics"]
            ] : null,
            "decision" => (string) $review["decision"],
            "from_status" => (string) $review["from_status"],
            "to_status" => (string) $review["to_status"],
            "reason" => $review["reason"],
            "created_at" => (string) $review["created_at"]
        ];
    }

    $latestReview = $reviews[0] ?? null;

    $shipment["container_count"] = count($containers);
    $shipment["document_count"] = count($documents);
    $shipment["containers"] = $containers;
    $shipment["documents"] = $documents;
    $shipment["reviews"] = $reviews;
    $shipment["latest_review"] = $latestReview;
    $shipment["latest_review_reason"] = $latestReview["reason"] ?? null;

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
        "data" => "Could not load this shipment.",
        "code" => null
    ]);
}
