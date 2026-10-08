<?php
    date_default_timezone_set('Africa/Lagos');

    $privateKey = file_get_contents(__DIR__.'/keys/private.key');
    $publicKey = file_get_contents(__DIR__.'/keys/public.pem');

    require_once __DIR__."/constants.php";    
    require_once __DIR__."/connections/redis.php";
    require_once __DIR__."/connections/db.php";

    require_once __DIR__.'/php-jwt/index.php';
    require_once __DIR__."/PHPMailer/index.php";
    require_once __DIR__.'/set-header.php';
    require_once __DIR__.'/functions.php';