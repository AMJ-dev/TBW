<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if (($my_details->account_type ?? '') !== 'system' || empty($my_details->id)) {
    http_response_code(403);
    echo json_encode(['error'=>true,'data'=>'Access denied.','code'=>null]);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    echo json_encode(['error'=>true,'data'=>'Method not allowed.','code'=>null]);
    exit;
}

$ref = trim((string)($_POST['manifestRef'] ?? $_POST['manifest_ref'] ?? ''));
$bl = trim((string)($_POST['bl'] ?? $_POST['bill_of_lading'] ?? ''));
$consignee = trim((string)($_POST['consignee'] ?? ''));
$type = (string)($_POST['consigneeType'] ?? $_POST['consignee_type'] ?? 'organisation');
$orgId = trim((string)($_POST['consigneeOrganisationId'] ?? $_POST['consignee_organisation_id'] ?? ''));
$email = trim((string)($_POST['consigneeEmail'] ?? $_POST['consignee_email'] ?? ''));
$phone = trim((string)($_POST['consigneePhone'] ?? $_POST['consignee_phone'] ?? ''));
$address = trim((string)($_POST['consigneeAddress'] ?? $_POST['consignee_address'] ?? ''));
$consigneeStatus = $orgId !== '' ? 'linked' : 'unregistered';

if ($ref === '' || $bl === '' || $consignee === '' || strlen($ref)>150 || strlen($bl)>150 || strlen($consignee)>255) {
    http_response_code(422);
    echo json_encode(['error'=>true,'data'=>'Valid manifest reference, bill of lading and consignee name are required.','code'=>null]);
    exit;
}
if (!in_array($type, ['organisation','individual'], true)) {
    http_response_code(422);
    echo json_encode(['error'=>true,'data'=>'Invalid consignee type.','code'=>null]);
    exit;
}
if ($type === 'organisation' && $orgId === '' && $email === '' && $phone === '') {
    http_response_code(422);
    echo json_encode(['error'=>true,'data'=>'For an unregistered organisation, provide an email address or phone number for onboarding follow-up.','code'=>null]);
    exit;
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['error'=>true,'data'=>'Enter a valid consignee email address.','code'=>null]);
    exit;
}
if ($orgId !== '') {
    $checkOrg = $conn->prepare("SELECT id FROM organisations WHERE id=? AND organisation_type <> 'agent' LIMIT 1");
    $checkOrg->execute([$orgId]);
    if (!$checkOrg->fetchColumn()) {
        http_response_code(422);
        echo json_encode(['error'=>true,'data'=>'Selected consignee organisation was not found. Record the consignee by name and leave it unlinked until verified.','code'=>null]);
        exit;
    }
}
$source = (string)($_POST['source'] ?? 'Manual');
$uploadToken = trim((string)($_POST['uploadToken'] ?? $_POST['upload_token'] ?? ''));
if (!in_array($source, ['EDI','CSV','XLSX','Manual'], true)) {
    http_response_code(422);
    echo json_encode(['error'=>true,'data'=>'Invalid intake source.','code'=>null]);
    exit;
}
if ($source !== 'Manual' && $uploadToken === '') {
    http_response_code(422);
    echo json_encode(['error'=>true,'data'=>'Upload the manifest file before submitting.','code'=>null]);
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
    if ($source !== 'Manual') {
        $uploadQuery = $conn->prepare('SELECT id,source,consumed_at FROM operation_manifest_uploads WHERE upload_token=? AND uploaded_by=? FOR UPDATE');
        $uploadQuery->execute([$uploadToken,(string)$my_details->id]);
        $uploadRow = $uploadQuery->fetch(PDO::FETCH_ASSOC);
        if (!$uploadRow || $uploadRow['consumed_at'] !== null || $uploadRow['source'] !== $source) {
            $conn->rollBack();
            http_response_code(422);
            echo json_encode(['error'=>true,'data'=>'The uploaded manifest token is invalid, already used, or does not match the selected source.','code'=>null]);
            exit;
        }
    }
    $find = $conn->prepare('SELECT id FROM operation_manifests WHERE manifest_ref=:ref OR bill_of_lading=:bl ORDER BY received_at ASC LIMIT 1 FOR UPDATE');
    $find->execute([':ref'=>$ref, ':bl'=>$bl]);
    $duplicate = $find->fetchColumn() ?: null;
    $status = $duplicate ? 'Duplicate' : 'Pre-advice';
    $id = generateId();
    $notes = trim((string)($_POST['notes'] ?? ''));
    if ($orgId === '') $notes = trim($notes . "\nConsignee not yet in TRÏNŪ; onboarding and verification follow-up required.");
    if ($duplicate) $notes = trim($notes . "\nPossible duplicate of manifest " . $duplicate . '; review required.');
    $agentId = trim((string)($_POST['agentId'] ?? $_POST['agent_organisation_id'] ?? ''));
    if ($agentId !== '') {
        $agentCheck = $conn->prepare("SELECT id FROM organisations WHERE id=? AND organisation_type='agent' LIMIT 1");
        $agentCheck->execute([$agentId]);
        if (!$agentCheck->fetchColumn()) $agentId = '';
    }
    $stmt = $conn->prepare('INSERT INTO operation_manifests (id,manifest_ref,bill_of_lading,vessel,shipping_line,origin_port,eta,containers,packages,gross_weight,consignee,consignee_type,consignee_organisation_id,consignee_status,consignee_email,consignee_phone,consignee_address,agent,agent_organisation_id,source,status,notes,duplicate_of,created_by) VALUES (:id,:ref,:bl,:vessel,:line,:port,:eta,:containers,:packages,:weight,:consignee,:type,:org,:consignee_status,:email,:phone,:address,:agent,:agent_id,:source,:status,:notes,:duplicate,:actor)');
    $stmt->execute([
        ':id'=>$id, ':ref'=>$ref, ':bl'=>$bl,
        ':vessel'=>substr(trim((string)($_POST['vessel'] ?? '')),0,200),
        ':line'=>substr(trim((string)($_POST['shippingLine'] ?? $_POST['shipping_line'] ?? '')),0,200),
        ':port'=>substr(trim((string)($_POST['originPort'] ?? $_POST['origin_port'] ?? '')),0,150),
        ':eta'=>substr(trim((string)($_POST['eta'] ?? '')),0,100),
        ':containers'=>$containers, ':packages'=>$packages,
        ':weight'=>substr(trim((string)($_POST['grossWeight'] ?? $_POST['gross_weight'] ?? '')),0,100),
        ':consignee'=>$consignee, ':type'=>$type, ':org'=>$orgId !== '' ? $orgId : null,
        ':consignee_status'=>$consigneeStatus, ':email'=>$email !== '' ? $email : null,
        ':phone'=>$phone !== '' ? $phone : null, ':address'=>$address !== '' ? $address : null,
        ':agent'=>substr(trim((string)($_POST['agent'] ?? '')),0,255), ':agent_id'=>$agentId !== '' ? $agentId : null,
        ':source'=>$source, ':status'=>$status, ':notes'=>$notes, ':duplicate'=>$duplicate,
        ':actor'=>(string)$my_details->id
    ]);
    if ($source !== 'Manual') {
        $consume = $conn->prepare('UPDATE operation_manifest_uploads SET consumed_at=NOW() WHERE upload_token=? AND consumed_at IS NULL');
        $consume->execute([$uploadToken]);
    }
    $event = $conn->prepare('INSERT INTO operation_manifest_events (id,manifest_id,actor_id,action,from_status,to_status,details) VALUES (:event_id,:id,:actor,:action,NULL,:status,:details)');
    $event->execute([':event_id'=>generateId(),':id'=>$id,':actor'=>(string)$my_details->id,':action'=>'CREATED',':status'=>$status,':details'=>$notes]);
    $conn->commit();
    http_response_code(201);
    echo json_encode(['error'=>false,'data'=>$duplicate ? 'Manifest recorded and flagged as duplicate.' : 'Manifest created.','code'=>['id'=>$id,'status'=>$status,'duplicate_of'=>$duplicate,'consignee_status'=>$consigneeStatus]]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    http_response_code(500);
    echo json_encode(['error'=>true,'data'=>'Unable to create manifest.','code'=>null]);
}
