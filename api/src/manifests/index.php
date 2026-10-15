<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if (($my_details->account_type ?? '') !== 'system' || empty($my_details->id)) {
    http_response_code(403);
    echo json_encode(['error'=>true,'data'=>'Access denied.','code'=>null]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET');
    http_response_code(405);
    echo json_encode(['error'=>true,'data'=>'Method not allowed.','code'=>null]);
    exit;
}

try {
    $stmt = $conn->query("SELECT m.id,m.manifest_ref,m.bill_of_lading AS bl,m.vessel,m.shipping_line,m.origin_port,m.eta,m.containers,m.packages,m.gross_weight,m.consignee,m.consignee_type,m.consignee_organisation_id,m.consignee_status,m.consignee_email,m.consignee_phone,m.consignee_address,m.agent,m.source,m.status,m.notes,m.received_at,m.matched_shipment_id,s.shipment_reference FROM operation_manifests m LEFT JOIN portal_shipments s ON s.id=m.matched_shipment_id ORDER BY m.received_at DESC,m.id DESC LIMIT 1000");
    echo json_encode(['error'=>false,'data'=>'Manifests loaded.','code'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error'=>true,'data'=>'Unable to load manifests.','code'=>null]);
}
