<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if (($my_details->account_type ?? '') !== 'system' || empty($my_details->id)) {
    http_response_code(403);
    echo json_encode(['error'=>true,'data'=>'Access denied.','code'=>null]);
    exit;
}
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method === 'GET') {
    try {
        $stmt = $conn->query("SELECT m.id, m.manifest_ref, m.bill_of_lading AS bl, m.vessel, m.shipping_line, m.origin_port, m.eta, m.containers, m.packages, m.gross_weight, m.consignee, m.agent, m.source, m.status, m.notes, m.received_at, m.matched_shipment_id FROM operation_manifests m ORDER BY m.received_at DESC, m.id DESC LIMIT 1000");
        echo json_encode(['error'=>false,'data'=>'Manifests loaded.','code'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error'=>true,'data'=>'Unable to load manifests.','code'=>null]);
    }
    exit;
}
if ($method !== 'POST') {
    header('Allow: GET, POST');
    http_response_code(405);
    echo json_encode(['error'=>true,'data'=>'Method not allowed.','code'=>null]);
    exit;
}
$ref = trim((string)($_POST['manifestRef'] ?? $_POST['manifest_ref'] ?? ''));
$bl = trim((string)($_POST['bl'] ?? $_POST['bill_of_lading'] ?? ''));
$consignee = trim((string)($_POST['consignee'] ?? ''));
if ($ref === '' || $bl === '' || $consignee === '' || strlen($ref)>150 || strlen($bl)>150 || strlen($consignee)>255) {
    http_response_code(422);
    echo json_encode(['error'=>true,'data'=>'Valid manifest reference, bill of lading and consignee are required.','code'=>null]);
    exit;
}
$source = (string)($_POST['source'] ?? 'Manual');
if (!in_array($source, ['EDI','CSV','XLSX','Manual'], true)) {
    http_response_code(422);
    echo json_encode(['error'=>true,'data'=>'Invalid intake source.','code'=>null]);
    exit;
}
$containers = filter_var($_POST['containers'] ?? 0, FILTER_VALIDATE_INT, ['options'=>['min_range'=>0]]);
$packages = filter_var($_POST['packages'] ?? 0, FILTER_VALIDATE_INT, ['options'=>['min_range'=>0]]);
if ($containers === false || $packages === false) {
    http_response_code(422);
    echo json_encode(['error'=>true,'data'=>'Containers and packages must be nonnegative integers.','code'=>null]);
    exit;
}
try {
    $conn->beginTransaction();
    $find = $conn->prepare('SELECT id FROM operation_manifests WHERE manifest_ref = :ref OR bill_of_lading = :bl ORDER BY received_at ASC LIMIT 1 FOR UPDATE');
    $find->execute([':ref'=>$ref, ':bl'=>$bl]);
    $duplicate = $find->fetchColumn() ?: null;
    $status = $duplicate ? 'Duplicate' : 'Pre-advice';
    $id = generateId();
    $notes = $duplicate ? 'Possible duplicate of manifest '.$duplicate.'; review required.' : trim((string)($_POST['notes'] ?? ''));
    $stmt = $conn->prepare('INSERT INTO operation_manifests (id, manifest_ref, bill_of_lading, vessel, shipping_line, origin_port, eta, containers, packages, gross_weight, consignee, agent, source, status, notes, duplicate_of, created_by) VALUES (:id,:ref,:bl,:vessel,:line,:port,:eta,:containers,:packages,:weight,:consignee,:agent,:source,:status,:notes,:duplicate,:actor)');
    $stmt->execute([
      ':id'=>$id, ':ref'=>$ref, ':bl'=>$bl,
      ':vessel'=>substr(trim((string)($_POST['vessel'] ?? '')),0,200),
      ':line'=>substr(trim((string)($_POST['shippingLine'] ?? $_POST['shipping_line'] ?? '')),0,200),
      ':port'=>substr(trim((string)($_POST['originPort'] ?? $_POST['origin_port'] ?? '')),0,150),
      ':eta'=>substr(trim((string)($_POST['eta'] ?? '')),0,100),
      ':containers'=>$containers, ':packages'=>$packages,
      ':weight'=>substr(trim((string)($_POST['grossWeight'] ?? $_POST['gross_weight'] ?? '')),0,100),
      ':consignee'=>$consignee, ':agent'=>substr(trim((string)($_POST['agent'] ?? '')),0,255),
      ':source'=>$source, ':status'=>$status, ':notes'=>$notes, ':duplicate'=>$duplicate,
      ':actor'=>(string)$my_details->id
    ]);
    $event = $conn->prepare('INSERT INTO operation_manifest_events (id,manifest_id,actor_id,action,from_status,to_status,details) VALUES (:event_id,:id,:actor,:action,NULL,:status,:details)');
    $event->execute([':event_id'=>generateId(),':id'=>$id,':actor'=>(string)$my_details->id,':action'=>'CREATED',':status'=>$status,':details'=>$notes]);
    $conn->commit();
    http_response_code(201);
    echo json_encode(['error'=>false,'data'=>$duplicate ? 'Manifest recorded and flagged as duplicate.' : 'Manifest created.','code'=>['id'=>$id,'status'=>$status,'duplicate_of'=>$duplicate]]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    http_response_code(500);
    echo json_encode(['error'=>true,'data'=>'Unable to create manifest.','code'=>null]);
}
