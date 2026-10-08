<?php 
    setcookie(
        "token",
        $token,
        [
            "expires" => time() + 86400,
            "path" => "/",
            "domain" => "",
            "secure" => str_starts_with(strtolower($baseURL), "https://"),
            "httponly" => true,
            "samesite" => "Lax"
        ]
    );