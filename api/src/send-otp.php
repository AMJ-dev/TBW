<?php
    $otp = generate_otp();

    $update_otp = $conn->prepare("UPDATE email_otp SET otp=:otp, expire_date=:expire_date WHERE user_id=:user_id");
    $update_otp->bindValue(":otp", $otp);
    $update_otp->bindValue(":user_id", $my_details->id);
    $update_otp->bindValue(":expire_date", get_expires());
    $update_otp->execute();

    unset($_SESSION['redirectURL']);

    $reset_link = $baseURL . "forgot-password";
    $subject = "Security Alert: Your one time password";

    $appNameEsc = htmlspecialchars($AppName, ENT_QUOTES, 'UTF-8');
    $fullNameEsc = htmlspecialchars($my_details->full_name, ENT_QUOTES, 'UTF-8');
    $otpEsc = htmlspecialchars($otp, ENT_QUOTES, 'UTF-8');
    $resetLinkEsc = htmlspecialchars($reset_link, ENT_QUOTES, 'UTF-8');



    $message = "****";

    send_email($my_details->email, $my_details->full_name, $subject, $message);
