<?php
    require_once __DIR__ . '/set-header.php';

    use Firebase\JWT\JWT;
    use Firebase\JWT\Key;
    
    $token = $_COOKIE['token'] ?? null;

    if (!$token) invalid_token();
    
    try {
        $decoded = JWT::decode($token, new Key($publicKey, 'RS256'));

        $my_details = get_user($decoded->id);

        if (empty($my_details) || $my_details == false) invalid_token();

        if ($my_details->account_status == "suspended") account_suspended();

        if (!in_array($my_details->account_status, ['active', 'pending_approval'])) {
            if (
                $my_details->account_status == 'pending_approval' &&
                $my_details->account_type == 'organisation' &&
                $my_details->organisation->verification_status != 'rejected'
            ) {
                invalid_token();
            }
        }

        $chk_session = $conn->prepare("SELECT expires_at FROM `sessions` WHERE user_id = :user_id AND id = :session_id");

        $chk_session->execute([":user_id" => $decoded->id, ":session_id" => $decoded->session_id]);

        $session = $chk_session->fetch(PDO::FETCH_ASSOC);

        if (!$session) invalid_token();

        if (strtotime($session['expires_at'] . ' UTC') < time()) invalid_token();

        $new_expires_at = date('Y-m-d H:i:s', time() + 86400);

        $update_session = $conn->prepare("UPDATE `sessions` SET expires_at = :expires_at WHERE user_id = :user_id AND id = :session_id");

        $update_session->execute([
            ":expires_at" => $new_expires_at,
            ":user_id" => $decoded->id,
            ":session_id" => $decoded->session_id
        ]);

        $my_details->session_id = $decoded->session_id;

        unset($my_details->password);
        require_once __DIR__ . '/set-cookie.php';
    } catch (Exception $e) {
        invalid_token();
    }