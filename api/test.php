<?php 
    require_once __DIR__.'/include/conn.php';
    
    use Firebase\JWT\JWT;
    use Firebase\JWT\Key;

    $privateKey = file_get_contents(__DIR__.'/include/keys/private.key');
    $publicKey = file_get_contents(__DIR__.'/include/keys/public.pem');

    $token = $_COOKIE['token'] ?? null;
    if (!$token) die("No token found");
    echo $token;

    try {
        // $decoded = JWT::decode($token, new Key($publicKey, 'RS256'));
        // var_dump($decoded);
    } catch (Exception $e) {
        // die("Invalid token");
    }



    