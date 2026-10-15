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
$email = trim((string)($_POST['email'] ?? ''));
if ($manifestId === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['error'=>true,'data'=>'A manifest ID and valid consignee email are required.','code'=>null]);
    exit;
}
try {
    $stmt = $conn->prepare('SELECT id,consignee,consignee_status FROM operation_manifests WHERE id=? LIMIT 1');
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
    $token = generateId();
    $hash = hash('sha256', $token);
    $expiresAt = date('Y-m-d H:i:s', time() + 7 * 86400);
    $conn->beginTransaction();
    $revoke = $conn->prepare('UPDATE operation_manifest_consignee_invites SET revoked_at=NOW() WHERE manifest_id=? AND accepted_at IS NULL AND revoked_at IS NULL');
    $revoke->execute([$manifestId]);
    $insert = $conn->prepare('INSERT INTO operation_manifest_consignee_invites (id,manifest_id,email,token_hash,expires_at,invited_by) VALUES (?,?,?,?,?,?)');
    $insert->execute([generateId(),$manifestId,$email,$hash,$expiresAt,(string)$my_details->id]);
    $saveEmail = $conn->prepare('UPDATE operation_manifests SET consignee_email=? WHERE id=?');
    $saveEmail->execute([$email,$manifestId]);
    $conn->commit();
    $link = $baseURL ."register/". $token;
    $subject = 'TRÏNŪ consignee onboarding invitation';
    $safeName = htmlspecialchars((string)$manifest['consignee'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeLink = htmlspecialchars($link, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $message = '<p>You have been invited to complete consignee onboarding on TRÏNŪ.</p><p>Consignee: <strong>'.$safeName.'</strong></p><p>This link expires in 7 days and does not automatically register or verify an organisation.</p><p><a href="'.$safeLink.'">Continue onboarding</a></p><p>If you were not expecting this invitation, you can ignore this email.</p>';
    $sent = send_email($email, (string)$manifest['consignee'], $subject, $message);
    if ($sent === false || $sent === null || (is_array($sent) && !empty($sent['error']))) {
        http_response_code(502);
        echo json_encode(['error'=>true,'data'=>'Invite created, but the email could not be sent. Copy the invite link and share it securely.','code'=>['link'=>$link,'expires_at'=>$expiresAt]]);
        exit;
    }
    echo json_encode(['error'=>false,'data'=>'Consignee onboarding invitation sent.','code'=>['email'=>$email,'expires_at'=>$expiresAt]]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    http_response_code(500);
    echo json_encode(['error'=>true,'data'=>'Unable to send consignee invitation.','code'=>null]);
}
