<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=UTF-8");

try {
    if (!isset($_GET["id"]) || trim($_GET["id"]) === "") {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Manifest ID is required.",
            "code" => null
        ]);
        exit;
    }

    $id = trim($_GET["id"]);

    $stmt = $conn->prepare("
        SELECT
            m.id,
            m.manifest_ref,
            m.bill_of_lading,
            m.vessel,
            m.shipping_line,
            m.origin_port,
            m.eta,
            m.containers,
            m.packages,
            m.gross_weight,
            m.consignee,
            m.consignee_organisation_id,
            m.consignee_status,
            m.consignee_email,
            m.consignee_phone,
            m.consignee_address,
            m.agent,
            m.source,
            m.status,
            m.received_at,
            m.notes,
            m.matched_shipment_id,
            ps.shipment_reference
        FROM operation_manifests m
        LEFT JOIN portal_shipments ps
            ON ps.id = m.matched_shipment_id
        WHERE m.id = :id
        LIMIT 1
    ");

    $stmt->execute(["id" => $id]);
    $manifest = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$manifest) {
        http_response_code(404);
        echo json_encode([
            "error" => true,
            "data" => "Manifest not found.",
            "code" => null
        ]);
        exit;
    }

    $manifest["shipment_reference"] = $manifest["shipment_reference"] ?? "";
    $manifest["matched_shipment_id"] = $manifest["matched_shipment_id"] ?? null;

    echo json_encode([
        "error" => false,
        "data" => "Manifest loaded successfully.",
        "code" => [
            "manifest" => $manifest
        ]
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not load this manifest.",
        "code" => null
    ]);
}