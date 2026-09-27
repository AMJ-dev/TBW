<?php
    require_once dirname(__DIR__, 1)."/env.php";
    $info_email="info@$url";
    $date_time=date("Y-m-d");
    $AppName = "EVCarsNG";
    $admin_email = "admin@evcarsng.com";
    $currency_sign='₦';
    $currency='NGN';
    $country = "NG";
    $comp_logo=$baseURL."logo.png";
    $error=true;   
    $data="An error occured, Pls try again later";
    $sub_page=["admin", "agent", "auth", "non-auth"];
    $otp_expires = "30 Minutes";
    $img_accept = array("image/jpeg", "image/jpg", "image/png", "image/x-png", "image/pjpeg", "image/svg+xml");

    