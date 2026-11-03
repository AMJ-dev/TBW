<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "GET") {
    header("Allow: GET");
    echo json_encode(["error" => true, "data" => "Method not allowed", "code" => null]);
    exit;
}

try {
    $organisationId = (string) ($my_details->organisation_id ?? "");

    if ($organisationId === "") {
        echo json_encode(["error" => true, "data" => "Organisation context is required to view shipments.", "code" => null]);
        exit;
    }

    $manifestMatch = "(
        om.matched_shipment_id = s.id
        OR EXISTS (
            SELECT 1
            FROM operation_manifest_shipment_matches omsm
            WHERE omsm.manifest_id = om.id
              AND omsm.shipment_id = s.id
        )
    )";

    $q = $conn->prepare("
        SELECT
            s.*,
            (SELECT COUNT(*) FROM portal_shipment_containers c WHERE c.shipment_id = s.id) AS container_count,
            (SELECT COUNT(*) FROM portal_shipment_documents d WHERE d.shipment_id = s.id) AS document_count,
            (SELECT om.id FROM operation_manifests om WHERE $manifestMatch ORDER BY om.updated_at DESC, om.received_at DESC LIMIT 1) AS manifest_id,
            (SELECT om.manifest_ref FROM operation_manifests om WHERE $manifestMatch ORDER BY om.updated_at DESC, om.received_at DESC LIMIT 1) AS manifest_reference,
            (SELECT om.bill_of_lading FROM operation_manifests om WHERE $manifestMatch ORDER BY om.updated_at DESC, om.received_at DESC LIMIT 1) AS manifest_bill_of_lading,
            (SELECT om.status FROM operation_manifests om WHERE $manifestMatch ORDER BY om.updated_at DESC, om.received_at DESC LIMIT 1) AS manifest_status,
            (SELECT om.review_reason FROM operation_manifests om WHERE $manifestMatch ORDER BY om.updated_at DESC, om.received_at DESC LIMIT 1) AS manifest_review_reason,
            (SELECT om.review_responsible_party FROM operation_manifests om WHERE $manifestMatch ORDER BY om.updated_at DESC, om.received_at DESC LIMIT 1) AS manifest_review_responsible_party,
            (SELECT om.flagged_at FROM operation_manifests om WHERE $manifestMatch ORDER BY om.updated_at DESC, om.received_at DESC LIMIT 1) AS manifest_flagged_at,
            (SELECT om.notes FROM operation_manifests om WHERE $manifestMatch ORDER BY om.updated_at DESC, om.received_at DESC LIMIT 1) AS manifest_notes
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
            SELECT id, shipment_id, container_no, size, seal_no, package_count, gross_weight, created_at
            FROM portal_shipment_containers
            WHERE shipment_id IN ($placeholders)
            ORDER BY created_at ASC
        ");
        $q->execute($shipmentIds);
        $containerRows = $q->fetchAll(PDO::FETCH_ASSOC);
        $containersByShipment = [];
        foreach ($containerRows as $container) {
            $shipmentId = (string) $container["shipment_id"];
            $containersByShipment[$shipmentId][] = $container;
        }

        $q = $conn->prepare("
            SELECT d.id, d.shipment_id, d.document_type, d.original_name, d.stored_name,
                   d.file_path, d.mime_type, d.file_size, d.uploaded_at, dt.label AS document_label
            FROM portal_shipment_documents d
            LEFT JOIN document_types dt ON dt.document_key = d.document_type
            WHERE d.shipment_id IN ($placeholders)
            ORDER BY d.uploaded_at DESC
        ");
        $q->execute($shipmentIds);
        $documentRows = $q->fetchAll(PDO::FETCH_ASSOC);
        $documentsByShipment = [];
        foreach ($documentRows as $document) {
            $shipmentId = (string) $document["shipment_id"];
            $documentsByShipment[$shipmentId][] = $document;
        }

        foreach ($shipments as &$shipment) {
            $shipmentId = (string) $shipment["id"];
            $shipment["containers"] = $containersByShipment[$shipmentId] ?? [];
            $shipment["documents"] = $documentsByShipment[$shipmentId] ?? [];
            $shipment["container_count"] = (int) $shipment["container_count"];
            $shipment["document_count"] = (int) $shipment["document_count"];
            $shipment["manifest_linked"] = !empty($shipment["manifest_id"]);

            $manifestStatus = (string) ($shipment["manifest_status"] ?? "");
            $responsibleParty = (string) ($shipment["manifest_review_responsible_party"] ?? "");
            $shipment["manifest_requires_action"] = $manifestStatus === "Discrepancy"
                && ($responsibleParty === "" || $responsibleParty === "Organisation");

            if ($manifestStatus === "Discrepancy") {
                $shipment["manifest_action_status"] = $shipment["manifest_requires_action"] ? "Action required" : "Under operations review";
            } elseif ($manifestStatus === "Duplicate") {
                $shipment["manifest_action_status"] = "Contact operations";
            } elseif ($manifestStatus === "Pre-advice") {
                $shipment["manifest_action_status"] = "Awaiting manifest validation";
            } elseif ($manifestStatus === "Validated") {
                $shipment["manifest_action_status"] = "Manifest validated";
            } elseif ($manifestStatus === "Received") {
                $shipment["manifest_action_status"] = "Manifest received";
            } else {
                $shipment["manifest_action_status"] = "No manifest linked";
            }

            $shipment["manifest_review_reason"] = trim((string) ($shipment["manifest_review_reason"] ?? "")) ?: null;
            $shipment["manifest_review_responsible_party"] = $responsibleParty !== "" ? $responsibleParty : null;
        }
        unset($shipment);
    }

    $q = $conn->prepare("SELECT id, label, is_active FROM terminal_shipment_types WHERE is_active = 1 ORDER BY label");
    $q->execute();
    $shipmentTypes = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("SELECT id, label, is_active FROM terminal_cargo_categories WHERE is_active = 1 ORDER BY label");
    $q->execute();
    $cargoCategories = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("SELECT id, label, is_active FROM terminal_packaging_types WHERE is_active = 1 ORDER BY label");
    $q->execute();
    $packagingTypes = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT dt.id, dt.document_key, dt.label, dt.sort_order, dult.is_required, dult.allow_multiple
        FROM document_types dt
        INNER JOIN document_upload_location_types dult ON dult.document_key = dt.document_key
        INNER JOIN document_upload_locations dul ON dul.id = dult.location_id
        WHERE dul.location_key = 'shipment_documents' AND dul.is_active = 1
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
    echo json_encode(["error" => true, "data" => "Unable to retrieve shipment information.", "code" => null]);
}
