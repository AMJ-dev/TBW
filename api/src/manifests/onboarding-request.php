<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    echo json_encode(['error'=>true,'data'=>'Method not allowed.','code'=>null]);
    exit;
}
$token = trim((string)($_POST['token'] ?? ''));
$name = trim((string)($_POST['organisation_name'] ?? ''));
$rc = trim((string)($_POST['rc_number'] ?? ''));
$tin = trim((string)($_POST['tin'] ?? ''));
$contact = trim((string)($_POST['contact_person'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? ''));
$address = trim((string)($_POST['registered_address'] ?? ''));
if (!preg_match('/^[a-f0-9]{64}$/i', $token) || $name === '' || strlen($name)>255 || $contact === '' || strlen($contact)>150 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email)>254) {
    http_response_code(422);
    echo json_encode(['error'=>true,'data'=>'Provide a valid invitation, organisation name, contact person and email address.','code'=>null]);
    exit;
}
try {
    $conn->beginTransaction();
    $stmt = $conn->prepare("SELECT id,manifest_id,email,expires_at,accepted_at,revoked_at FROM operation_manifest_consignee_invites WHERE token_hash=? FOR UPDATE");
    $stmt->execute([hash('sha256', $token)]);
    $invite = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$invite || $invite['revoked_at'] !== null || $invite['accepted_at'] !== null || strtotime($invite['expires_at']) < time()) {
        $conn->rollBack();
        http_response_code(410);
        echo json_encode(['error'=>true,'data'=>'This invitation is invalid, expired, revoked, or already used. Request a new invitation.','code'=>null]);
        exit;
    }
    $insert = $conn->prepare("INSERT INTO operation_manifest_consignee_onboarding_requests (id,invite_id,organisation_name,rc_number,tin,contact_person,email,phone,registered_address,submitted_data) VALUES (?,?,?,?,?,?,?,?,?,?)");
    $insert->execute([generateId(),$invite['id'],$name,$rc !== '' ? $rc : null,$tin !== '' ? $tin : null,$contact,$email,$phone !== '' ? $phone : null,$address !== '' ? $address : null,json_encode(['manifest_id'=>$invite['manifest_id']], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
    $updateInvite = $conn->prepare('UPDATE operation_manifest_consignee_invites SET accepted_at=NOW() WHERE id=?');
    $updateInvite->execute([$invite['id']]);
    $conn->commit();
    echo json_encode(['error'=>false,'data'=>'Onboarding details submitted for review. The organisation has not been created or verified.','code'=>['status'=>'pending']]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    http_response_code(500);
    echo json_encode(['error'=>true,'data'=>'Unable to submit onboarding details.','code'=>null]);
}
