<?php
    require_once dirname(__DIR__, 1)."/env.php";
    $date_time=date("Y-m-d");
    $AppName = "TRÏNŪ";
    $currency_sign='₦';
    $currency='NGN';
    $country = "NG";
    $comp_logo=$baseURL."logo.png";
    $error=true;   
    $data="An error occured, Pls try again later";
    $sub_page=["admin", "agent", "auth", "non-auth"];
    $otp_expires = "30 Minutes";
    $img_accept = array("image/jpeg", "image/jpg", "image/png", "image/x-png", "image/pjpeg", "image/svg+xml");

    $route_map = [
        "system_admin" => "/admin",
        "terminal_operations" => "/admin",
        "gate_officer" => "/admin",
        "warehouse_yard_officer" => "/admin",
        "documentation_officer" => "/admin",

        "organisation_owner" => "/operations",
        "management" => "/operations",
        "finance" => "/operations",
        "customer_service_sales" => "/operations",
        "compliance_customs_liaison" => "/operations",
        "regulator_auditor" => "/operations",
        "portal_user" => "/operations"
    ];