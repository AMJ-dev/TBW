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

    $url = "trinubondedwarehouse.com";
    $baseURL = "https://$url/";
    $apiURL = "https://api.$url/";

    $email_host="mail.evcarsng.com";
    $email_port=465; 
    $email_user="info@evcarsng.com";
    $email_password='vmh;)~#TpW0GkFiV';
    $sender_email = "sender@evcarsng.com";
    $info_email = "info@evcarsng.com";