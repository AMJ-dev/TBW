<?php
    date_default_timezone_set('Africa/Lagos');

    $privateKey = file_get_contents(__DIR__.'/keys/private.key');
    $publicKey = file_get_contents(__DIR__.'/keys/public.pem');

    require_once __DIR__."/constants.php";    
    require_once __DIR__."/connections/redis.php";

    require_once __DIR__."/connections/db.php";

    require_once __DIR__.'/php-jwt/BeforeValidException.php';
    require_once __DIR__.'/php-jwt/ExpiredException.php';
    require_once __DIR__.'/php-jwt/SignatureInvalidException.php';
    require_once __DIR__.'/php-jwt/JWT.php';

    require __DIR__."/PHPMailer/Exception.php";
    require __DIR__."/PHPMailer/PHPMailer.php";
    require __DIR__."/PHPMailer/SMTP.php";

    require __DIR__.'/set-header.php';
    
    require __DIR__.'/functions.php';