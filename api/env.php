<?php
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
    // error_reporting(0);
    ob_start();
    // ob_end_clean();
    
    if (session_status() === PHP_SESSION_NONE) session_start();
    
    $db_host = "localhost";
    $db_name = "trinu";
    $db_user = "cyberpros";
    $db_pass = "Group2022@";

    $baseURL = "http://localhost:8080/";
    $apiURL = "https://api.trinubondedwarehouse.com/";

    $redis_ip = "192.168.205.67";

    $email_host="mail.evcarsng.com";
    $email_port=465; 
    $email_user="info@evcarsng.com";
    $email_password='vmh;)~#TpW0GkFiV';
    $sender_email = "sender@evcarsng.com";
    $info_email = "info@evcarsng.com";
    
    $email_host="smtp.resend.com";
    $email_port=465; 
    $email_user="resend";
    $email_password="re_aU7TUdFD_Pf9144Q5tjcMm7ptVjxeJ1zv";
    $sender_email = "info@lovebite.online";
    $info_email = "sender@lovebite.online";
    
    $admin_email = "admin@trinubondedwarehouse.com";

    $mfa_key = "8227adcc2200e3bb07c8eb44db8eaf3de06bf261662c889a3a0f2a01963a681b";

    $sms_sender = "TRINU";
    $sms_api_token = "u6MNFnajPKvyVj7bW0av21j5D3YuVNcUNEehecKfrRdLWdw71NKnw9Yv5zDD";
