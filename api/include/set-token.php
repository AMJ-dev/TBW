<?php 
    use Firebase\JWT\JWT;

    $jwt_payload = ["id" => $user_id, "session_id" => $session_id];

    $token = JWT::encode($jwt_payload, $privateKey, "RS256");

    require_once __DIR__ . '/set-cookie.php';
    
    echo json_encode([
        "error" => false,
        "data" => "Login successful.",
        "code" => [
            "email" => $user["email"],
            "expires_in" => 2592000,
            "user" => [
                "id" => $user["id"],
                "email" => $user["email"],
                "full_name" => $user["full_name"],
                "phone" => $user["phone"],
                "account_type" => $user["account_type"],
                "account_status" => $user["account_status"],
            ],
            "role" => [
                "id" => $role_id,
                "key" => $role_key,
                "name" => $role_name,
                "scope" => $role_scope
            ],
            "route" => $route,
            "privileges" => $privileges,
            "permissions" => $permissions
        ]
    ]);

    exit;