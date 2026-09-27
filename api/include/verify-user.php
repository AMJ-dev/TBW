<?php
    require_once __DIR__ . '/conn.php';
    require_once __DIR__ . '/set-header.php';

    use Firebase\JWT\JWT;
    use Firebase\JWT\Key;

    function get_token(): ?string {
        $auth = null;
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) $auth = $_SERVER['HTTP_AUTHORIZATION'];
        elseif (function_exists('getallheaders')) {
            $h = getallheaders();
            $auth = $h['Authorization'] ?? $h['authorization'] ?? null;
        } elseif (function_exists('apache_request_headers')) {
            $h = apache_request_headers();
            $auth = $h['Authorization'] ?? $h['authorization'] ?? null;
        }
        if ($auth && preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) return trim($m[1]);
        return null;
    }

    $token = get_token();

    if (!$token) invalid_token();
 
    try { 
        $decoded = JWT::decode($token, $publicKey, array('RS256')); 
        $my_details = get_user($decoded->id); 
        if(empty($my_details) || $my_details==false || !$decoded->login) invalid_token(); 
        unset($my_details->password); 
    } catch (Exception $e) { 
        invalid_token(); 
        // echo $e->getMessage(); 
    }
