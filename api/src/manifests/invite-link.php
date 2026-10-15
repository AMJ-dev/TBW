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
$manifestId = trim((string)($_POST['manifest_id'] ?? ''));
if ($manifestId === '') {
    http_response_code(422);
    echo json_encode(['error'=>true,'data'=>'Manifest ID is required.','code'=>null]);
    exit;
}
$baseUrl = trim((string)(getenv('TRINU_CONSIGNEE_INVITE_URL') ?: ''));
if ($baseUrl === '' || !filter_var($baseUrl, FILTER_VALIDATE_URL) || !in_array(strtolower((string)parse_url($baseUrl, PHP_URL_SCHEME)), ['https','http'], true)) {
    http_response_code(500);
    echo json_encode(['error'=>true,'data'=>'Configure TRINU_CONSIGNEE_INVITE_URL to the public consignee onboarding page URL.','code'=>null]);
    exit;
}
try {
    $stmt = $conn->prepare('SELECT id,consignee,consignee_email,consignee_status FROM operation_manifests WHERE id=? LIMIT 1');
    $stmt->execute([$manifestId]);
    $manifest = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$manifest) {
        http_response_code(404);
        echo json_encode(['error'=>true,'data'=>'Manifest not found.','code'=>null]);
        exit;
    }
    if ($manifest['consignee_status'] !== 'unregistered') {
        http_response_code(409);
        echo json_encode(['error'=>true,'data'=>'This consignee is already linked to an organisation.','code'=>null]);
        exit;
    }
    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    $expiresAt = date('Y-m-d H:i:s', time() + 7 * 86400);
    $conn->beginTransaction();
    $revoke = $conn->prepare('UPDATE operation_manifest_consignee_invites SET revoked_at=NOW() WHERE manifest_id=? AND accepted_at IS NULL AND revoked_at IS NULL');
    $revoke->execute([$manifestId]);
    $insert = $conn->prepare('INSERT INTO operation_manifest_consignee_invites (id,manifest_id,email,token_hash,expires_at,invited_by) VALUES (?,?,?,?,?,?)');
    $insert->execute([generateId(),$manifestId,(string)($manifest['consignee_email'] ?? ''),$hash,$expiresAt,(string)$my_details->id]);
    $conn->commit();
    $separator = str_contains($baseUrl, '?') ? '&' : '?';
    $link = $baseUrl . $separator . http_build_query(['token'=>$token]);
    echo json_encode(['error'=>false,'data'=>'Consignee onboarding link generated.','code'=>['link'=>$link,'url'=>$link,'expires_at'=>$expiresAt,'consignee'=>$manifest['consignee']]]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    http_response_code(500);
    echo json_encode(['error'=>true,'data'=>'Unable to generate consignee invite link.','code'=>null]);
}
