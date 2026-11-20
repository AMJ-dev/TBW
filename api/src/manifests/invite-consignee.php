<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if (($my_details->account_type ?? '') !== 'system' || empty($my_details->id)) {
   
    echo json_encode(['error'=>true,'data'=>'Access denied.','code'=>null]);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
   
    echo json_encode(['error'=>true,'data'=>'Method not allowed.','code'=>null]);
    exit;
}
$manifestId = trim((string)($_POST['manifest_id'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
if ($manifestId === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    
    echo json_encode(['error'=>true,'data'=>'A manifest ID and valid consignee email are required.','code'=>null]);
    exit;
}
try {
    $stmt = $conn->prepare('SELECT id,consignee,consignee_status FROM operation_manifests WHERE id=? LIMIT 1');
    $stmt->execute([$manifestId]);
    $manifest = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$manifest) {
        
        echo json_encode(['error'=>true,'data'=>'Manifest not found.','code'=>null]);
        exit;
    }
    if ($manifest['consignee_status'] !== 'unregistered') {
        
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
    $message = "
        <div style='margin:0;padding:0;background-color:#FAF0E3;'>
            <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color:#FAF0E3;padding:40px 16px;'>
                <tr>
                    <td align='center'>
                        <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='max-width:600px;background-color:#FFFBF5;border:1px solid #E8D9C2;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;'>

                            <tr>
                                <td style='background-color:#FF6600;padding:28px 32px;'>
                                    <div style='font-size:24px;font-weight:800;letter-spacing:2px;color:#FFFFFF;'>
                                        TRINŪ
                                    </div>
                                    <div style='font-size:11px;font-weight:600;letter-spacing:1.5px;color:#FFE3CF;text-transform:uppercase;margin-top:5px;'>
                                        Bonded Terminal Digital Platform
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td style='padding:36px 32px 30px;'>
                                    <div style='display:inline-block;background-color:#FFF0E5;color:#D95700;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:7px 12px;border-radius:20px;margin-bottom:20px;'>
                                        Consignee invitation
                                    </div>

                                    <h1 style='margin:0 0 14px;font-size:25px;line-height:1.3;font-weight:800;color:#2B2A28;'>
                                        Complete your onboarding
                                    </h1>

                                    <p style='margin:0 0 22px;font-size:14px;line-height:1.8;color:#6B6357;'>
                                        You have been invited to complete consignee onboarding on TRINŪ. Follow the secure link below to get started.
                                    </p>

                                    <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:26px;'>
                                        <tr>
                                            <td style='background-color:#FAF0E3;border:1px solid #E8D9C2;border-radius:12px;padding:20px;'>
                                                <div style='font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8C7C69;margin-bottom:8px;'>
                                                    Consignee
                                                </div>
                                                <div style='font-size:17px;font-weight:700;color:#2B2A28;'>
                                                    " . $safeName . "
                                                </div>
                                            </td>
                                        </tr>
                                    </table>

                                    <table role='presentation' cellpadding='0' cellspacing='0' border='0' width='100%'>
                                        <tr>
                                            <td align='center' style='padding:4px 0 26px;'>
                                                <a href='" . $safeLink . "' style='display:inline-block;background-color:#FF6600;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;padding:16px 32px;border-radius:8px;letter-spacing:0.3px;'>
                                                    Continue onboarding
                                                </a>
                                            </td>
                                        </tr>
                                    </table>

                                    <div style='padding:16px;background-color:#FFF4E9;border-left:3px solid #FF6600;border-radius:4px;'>
                                        <p style='margin:0;font-size:13px;line-height:1.7;color:#765C45;'>
                                            <strong style='color:#2B2A28;'>Important:</strong>
                                            This invitation link expires in <strong>7 days</strong>. Opening this link does not automatically register or verify an organisation.
                                        </p>
                                    </div>

                                    <p style='margin:24px 0 0;font-size:13px;line-height:1.7;color:#6B6357;'>
                                        If you were not expecting this invitation, you can safely ignore this email.
                                    </p>
                                </td>
                            </tr>

                            <tr>
                                <td style='padding:0 32px;'>
                                    <div style='border-top:1px solid #E8D9C2;height:1px;line-height:1px;font-size:0;'>&nbsp;</div>
                                </td>
                            </tr>

                            <tr>
                                <td style='padding:24px 32px 30px;text-align:center;'>
                                    <div style='font-size:14px;font-weight:800;letter-spacing:1.5px;color:#FF6600;'>
                                        TRINŪ
                                    </div>
                                    <p style='margin:8px 0 0;font-size:11px;line-height:1.6;color:#8C7C69;'>
                                        Bonded Terminal Digital Platform
                                    </p>
                                    <p style='margin:12px 0 0;font-size:11px;line-height:1.6;color:#B8A894;'>
                                        This is an automated message. Please do not reply.
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </div>
        ";
    $sent = send_email($email, (string)$manifest['consignee'], $subject, $message);
    if ($sent === false || $sent === null || (is_array($sent) && !empty($sent['error']))) {
        echo json_encode(['error'=>true,'data'=>'Invite created, but the email could not be sent. Copy the invite link and share it securely.','code'=>['link'=>$link,'expires_at'=>$expiresAt]]);
        exit;
    }
    echo json_encode(['error'=>false,'data'=>'Consignee onboarding invitation sent.','code'=>['email'=>$email,'expires_at'=>$expiresAt]]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    
    echo json_encode(['error'=>true,'data'=>'Unable to send consignee invitation.','code'=>null]);
}
