<?php
    require_once __DIR__ . '/conn.php';
    require_once __DIR__ . '/set-header.php';

    use Firebase\JWT\JWT;
    use Firebase\JWT\Key;

    $token = $_COOKIE['token'] ?? null;

    if (!$token) invalid_token();
 
    try { 
        $decoded = JWT::decode($token, $publicKey, array('RS256')); 
        $my_details = get_user($decoded->id); 
        if(empty($my_details) || $my_details==false || $my_details->account_status !='active') invalid_token(); 

        $chk_session =$conn->prepare("SELECT expires_at FROM `sessions` WHERE user_id = :user_id AND id = :session_id");
        $chk_session->execute([":user_id" => $decoded->id, ":session_id" => $decoded->session_id]);

        $session =$chk_session->fetch(PDO::FETCH_ASSOC);

        if (!$session) invalid_token();
        if (strtotime($session['expires_at'] . ' UTC') < time()) invalid_token();

        unset($my_details->password); 
    } catch (Exception $e) { 
        invalid_token(); 
        // echo $e->getMessage(); 
    }
