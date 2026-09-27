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


    $btn_style = "display:inline-block;padding:12px 20px;border-radius:8px;background:#0000CC;color:#FFFFFF;text-decoration:none;font-weight:600";

    $message = <<<HTML
    <!DOCTYPE html>
    <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="x-ua-compatible" content="IE=edge">
    <title>Confirm Your Sign In</title>
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
    <div class="preheader">Confirm your sign in request with the code we sent you.</div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f0f8ff;">
        <tr>
        <td align="center" style="padding:20px 12px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container card" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden;">
                <tr>
                    <td align="center" style="background-color:#0000CC; padding:24px;">
                        <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:28px; font-weight:bold; letter-spacing:.5px; color:#00FF00;">{$appNameEsc}</div>
                    </td>
                </tr>

                <tr>
                    <td class="px" style="padding:32px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#333333; line-height:1.6;" aria-label="Email body">
                        <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td align="center" style="padding:8px 0 16px 0;">
                                    <div role="img" aria-label="Security" style="display:inline-flex; align-items:center; justify-content:center; width:80px; height:80px; border-radius:50%; background-color:rgba(255,165,0,0.15); color:#FFA500; font-size:40px; border:2px solid #FFA500;">⚠</div>
                                </td>
                            </tr>
                        </table>

                        <h1 class="text" style="margin:0 0 16px 0; font-size:26px; color:#0000CC; text-align:center;">Confirm Your Sign In</h1>

                        <p class="text" style="margin:0 0 12px 0;">Hello <span style="color:#0000CC; font-weight:600;">{$fullNameEsc}</span>,</p>

                        <p class="text" style="margin:0 0 16px 0;">We noticed a new sign in request to your account. To verify it’s you, use the code below.</p>

                        <div style="text-align:center; margin:24px 0;">
                            <div style="display:inline-block; padding:16px 32px; font-size:28px; font-weight:bold; color:#0000CC; background-color:rgba(0,0,204,0.05); border:2px dashed #0000CC; border-radius:8px;">{$otpEsc}</div>
                        </div>

                        <p class="text" style="margin:0 0 16px 0; text-align:center; font-size:14px; color:#666;">This code will expire in <strong>{$otp_expires}</strong>.</p>

                        <div class="divider" style="height:1px; background:linear-gradient(to right, transparent, #0000CC, transparent); margin:24px 0;"></div>

                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:rgba(255,0,0,0.05); border-left:4px solid #FF0000; border-radius:0 4px 4px 0;">
                            <tr>
                                <td style="padding:16px;">
                                    <p class="text" style="margin:0; font-size:14px;"><strong>Important:</strong> If you did not try to sign in, please reset your password immediately to secure your account.</p>
                                </td>
                            </tr>
                        </table>

                        <div style="text-align:center; margin:24px 0;">
                            <a href="{$resetLinkEsc}" style="{$btn_style}">RESET YOUR PASSWORD</a>
                        </div>

                        <p class="text" style="margin:16px 0 0 0;">Stay safe,<br><span style="color:#0000CC; font-weight:600;">{$appNameEsc}</span> Team</p>
                    </td>
                </tr>

                <tr>
                    <td align="center" style="background-color:rgba(0,0,204,0.05); padding:24px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#666666; font-size:14px;">© <?= date("Y") ?> {$appNameEsc}. All rights reserved.</td>
                </tr>
            </table>
        </td>
        </tr>
    </table>
    </body>
    </html>
    HTML;

    send_email($my_details->email, $my_details->full_name, $subject, $message);
