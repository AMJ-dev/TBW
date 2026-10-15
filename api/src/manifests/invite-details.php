<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET');
    http_response_code(405);
    echo json_encode(['error'=>true,'data'=>'Method not allowed.','code'=>null]);
    exit;
}
$token = trim((string)($_GET['token'] ?? ''));
if (!preg_match('/^[a-f0-9]{64}$/i', $token)) {
    http_response_code(422);
    echo json_encode(['error'=>true,'data'=>'A valid invitation token is required.','code'=>null]);
    exit;
}
try {
    $stmt = $conn->prepare("SELECT i.id AS invite_id,i.email,i.expires_at,i.accepted_at,i.revoked_at,m.id AS manifest_id,m.manifest_ref,m.consignee,m.bill_of_lading,m.consignee_status FROM operation_manifest_consignee_invites i INNER JOIN operation_manifests m ON m.id=i.manifest_id WHERE i.token_hash=? LIMIT 1");
    $stmt->execute([hash('sha256', $token)]);
    $invite = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$invite || $invite['revoked_at'] !== null || $invite['accepted_at'] !== null || strtotime($invite['expires_at']) < time()) {
        http_response_code(410);
        echo json_encode(['error'=>true,'data'=>'This invitation is invalid, expired, revoked, or already used. Request a new invitation.','code'=>null]);
        exit;
    }
    echo json_encode(['error'=>false,'data'=>'Invitation is valid.','code'=>['email'=>$invite['email'],'consignee'=>$invite['consignee'],'manifest_reference'=>$invite['manifest_ref'],'bill_of_lading'=>$invite['bill_of_lading'],'expires_at'=>$invite['expires_at']]]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error'=>true,'data'=>'Unable to validate invitation.','code'=>null]);
}
