<?php   
    require_once __DIR__."/include/conn.php";
    
    $to_email = "d.stone.david@gmail.com";
    $to_name  = "Samuel David";
    $subject  = "Important Update Regarding Your Account";
    $body     = "Hi Samuel,\n\nPlease find the latest details attached.\n\nBest regards,\nDavid Stone";

    send_email($to_email, $to_name, $subject, $body);



