<?php 
    use Firebase\JWT\JWT;
    use Firebase\JWT\Key;
    require_once __DIR__."/include/conn.php";

    $token = $_COOKIE['token'] ?? null;
    if (!$token) die("No token found");

    try {
        JWT::decode($token, new Key($publicKey, 'RS256'));
    } catch (Exception $e) {
        die("Invalid token");
    }



    