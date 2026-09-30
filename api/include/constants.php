<?php
    require_once dirname(__DIR__, 1)."/env.php";
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

    $route_map = [
        "system_admin" => "/admin",
        "organisation_owner" => "/dashboard",
        "management" => "/dashboard",
        "finance" => "/finance",
        "terminal_operations" => "/operations",
        "gate_officer" => "/gate",
        "warehouse_yard_officer" => "/warehouse",
        "documentation_officer" => "/documents",
        "customer_service_sales" => "/customer-service",
        "compliance_customs_liaison" => "/compliance",
        "regulator_auditor" => "/reports",
        "portal_user" => "/portal"
    ];