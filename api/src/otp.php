<?php
    use \Firebase\JWT\JWT;
    require_once dirname(__DIR__, 1).'/include/conn.php';
    $jwt=false;      
    if(isset($_POST["jwt"])){
        $decoded = JWT::decode($_POST["jwt"], $publicKey, array('RS256'));
        $my_details = get_user($decoded->id);
        if(empty($my_details) || $my_details==false) invalid_token();
        $_SESSION["login_id"] = $decoded->id;
    }      
    $verify_resp = verify_otp(); 

    if($verify_resp["error"]){
        $error = $verify_resp["error"];
        $data = $verify_resp["data"];
    }else{
        $error = false; 
        $data = "OTP Verified"; 
        if(isset($_SESSION["login_id"])) {
            $my_details = get_user($_SESSION["login_id"], "id,email, full_name");
            require_once dirname(__DIR__, 1).'/include/update-token.php';
 
            $locationInfo = isset($_POST["locationInfo"])?$_POST["locationInfo"]:"";
            $deviceInfo = isset($_POST["deviceInfo"])?$_POST["deviceInfo"]:"";
            $AppName_h     = htmlspecialchars($AppName, ENT_QUOTES, 'UTF-8');
            $FullName_h   = htmlspecialchars($my_details->full_name, ENT_QUOTES, 'UTF-8');
            $deviceInfo_h  = htmlspecialchars($deviceInfo, ENT_QUOTES, 'UTF-8');
            $locationInfo_h= htmlspecialchars($locationInfo, ENT_QUOTES, 'UTF-8');
            
            $date_long = date("F j, Y, g:i a");
            $year      = date("Y");
            
            $msg = <<<HTML
            <!DOCTYPE html>
            <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <meta http-equiv="x-ua-compatible" content="IE=edge">
                <title>OTP Verification Successful</title>
                <!--[if mso]>
                <xml>
                    <o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings>
                </xml>
                <![endif]-->
                <style>
                    @media (prefers-color-scheme: dark) {
                    body, .bg-body { background-color: #0b0d12 !important; }
                    .card { background-color: #111827 !important; }
                    .text { color: #e5e7eb !important; }
                    .muted { color: #9ca3af !important; }
                    .divider { opacity: .5 !important; }
                    }
                    @media only screen and (max-width: 600px) {
                    .container { width: 100% !important; }
                    .px { padding-left: 24px !important; padding-right: 24px !important; }
                    }
                    .preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all; }
                </style>
                </head>
                <body class="bg-body" style="margin:0; padding:0; background-color:#f0f8ff;">
                <div class="preheader">
                    Your OTP verification was successful. Your account is now fully secured.
                </div>
                
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f0f8ff;">
                    <tr>
                    <td align="center" style="padding:20px 12px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container card" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden;">
                        <tr>
                            <td align="center" style="background-color:#0000CC; padding:24px;">
                            <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:28px; font-weight:bold; letter-spacing:.5px; color:#00FF00;">
                                {$AppName_h}
                            </div>
                            </td>
                        </tr>
                
                        <tr>
                            <td class="px" style="padding:32px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#333333; line-height:1.6;" aria-label="Email body">
                            <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                <td align="center" style="padding:8px 0 16px 0;">
                                    <!--[if mso]>
                                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" arcsize="50%" strokecolor="#00FF00" strokeweight="2px" fillcolor="#D9FFD9" style="v-text-anchor:middle; height:80px; width:80px;">
                                    <center style="color:#00FF00; font-size:40px; font-family:Arial;">✓</center>
                                    </v:roundrect>
                                    <![endif]-->
                                    <!--[if !mso]><!-- -->
                                    <div role="img" aria-label="Success" style="display:inline-flex; align-items:center; justify-content:center; width:80px; height:80px; border-radius:50%; background-color:rgba(0,255,0,0.15); color:#00FF00; font-size:40px; border:2px solid #00FF00;">
                                    ✓
                                    </div>
                                    <!--<![endif]-->
                                </td>
                                </tr>
                            </table>
                
                            <h1 class="text" style="margin:0 0 16px 0; font-size:28px; color:#0000CC; text-align:center;">OTP Verification Successful</h1>
                
                            <p class="text" style="margin:0 0 12px 0;">Hello <span style="color:#0000CC; font-weight:600;">{$FullName_h}</span>,</p>
                
                            <p class="text" style="margin:0 0 16px 0;">
                                Your OTP verification was successful. Your account is now fully secured and you can access all features of our platform.
                            </p>
                
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:rgba(0,0,204,0.05); border-radius:8px;">
                                <tr>
                                <td style="padding:16px;">
                                    <p class="text" style="margin:0 0 8px 0; font-weight:700;">Verification Details:</p>
                                    <ul style="margin:0; padding-left:20px;">
                                    <li style="margin-bottom:8px;">Date: {$date_long}</li>
                                    <li style="margin-bottom:8px;">Device: {$deviceInfo_h}</li>
                                    <li style="margin-bottom:0;">Location: {$locationInfo_h}</li>
                                    </ul>
                                </td>
                                </tr>
                            </table>
                
                            <div class="divider" style="height:1px; background:linear-gradient(to right, transparent, #0000CC, transparent); margin:24px 0;"></div>
                
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:rgba(255,0,0,0.05); border-left:4px solid #FF0000; border-radius:0 4px 4px 0;">
                                <tr>
                                <td style="padding:16px;">
                                    <p class="text" style="margin:0; font-size:14px;">
                                    <strong>Security Tip:</strong> If you did not initiate this verification, please contact our support team immediately to secure your account.
                                    </p>
                                </td>
                                </tr>
                            </table>
                
                            <p class="text" style="margin:16px 0 0 0;">
                                If you have any questions or need assistance, please don't hesitate to contact our support team.
                            </p>
                
                            <p class="text" style="margin:16px 0 0 0;">
                                Thank you,<br>
                                <span style="color:#0000CC; font-weight:600;">{$AppName_h}</span> Team
                            </p>
                            </td>
                        </tr>
                
                        <tr>
                            <td align="center" style="background-color:rgba(0,0,204,0.05); padding:24px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#666666; font-size:14px;">
                            © {$year} {$AppName_h}. All rights reserved.
                            </td>
                        </tr>
                        </table>
                    </td>
                    </tr>
                </table>
                </body>
            </html>
            HTML;
            send_email($my_details->email, $my_details->full_name, "You Logged In", $msg);
            unset($_SESSION["redirectURL"]);
            unset($_SESSION["login_id"]);

            $ipAddress = getUserIP();
            $stmt = $conn->prepare("INSERT INTO login_logs (user_id, email, ip_address, os, browser, device_type ) VALUES ( :user_id, :email, :ip_address, :os, :browser, :device_type )");

            $stmt->bindValue(':user_id', $my_details->id, PDO::PARAM_INT);
            $stmt->bindValue(':email', $my_details->email, PDO::PARAM_STR);
            $stmt->bindValue(':ip_address', $ipAddress, PDO::PARAM_STR);
            $stmt->bindValue(':os', $_POST['OS'], PDO::PARAM_STR);
            $stmt->bindValue(':browser', $_POST['browser'], PDO::PARAM_STR);
            $stmt->bindValue(':device_type', $_POST['device_type'], PDO::PARAM_STR);

            $stmt->execute();
        } else $my_details = "";
    }
    echo json_encode(["data"=>$data, "error"=>$error, 'token'=>$jwt]);
