<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    if ($_SERVER["REQUEST_METHOD"] !== "GET") {
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed.",
            "code" => null
        ]);
        exit;
    }

    try {
        $stmt = $conn->prepare("
            SELECT
                s.*,
                COALESCE(
                    NULLIF(o.trading_name, ''),
                    o.organisation_name
                ) AS organisation_name,
                m.id AS manifest_id,
                m.manifest_ref,
                m.bill_of_lading AS manifest_bill_of_lading,
                m.vessel AS manifest_vessel,
                m.shipping_line AS manifest_shipping_line,
                m.origin_port AS manifest_origin_port,
                m.eta AS manifest_eta,
                m.containers AS manifest_containers,
                m.packages AS manifest_packages,
                m.gross_weight AS manifest_gross_weight,
                m.consignee AS manifest_consignee,
                m.source AS manifest_source,
                m.status AS manifest_status,
                m.review_status AS manifest_review_status,
                m.review_reason AS manifest_review_reason,
                m.correction_reason AS manifest_correction_reason,
                m.matched_shipment_id
            FROM portal_shipments s
            LEFT JOIN organisations o
                ON o.id = s.organisation_id
            LEFT JOIN operation_manifests m
                ON m.matched_shipment_id = s.id
            WHERE s.status = 'pending_review'
            ORDER BY s.created_at DESC
        ");

        $stmt->execute();
        $shipments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => "Shipment declarations loaded successfully.",
            "code" => $shipments
        ]);
    } catch (Throwable $e) {
        echo json_encode([
            "error" => true,
            "data" => "Could not load shipment declarations.",
            "code" => null
        ]);
    }