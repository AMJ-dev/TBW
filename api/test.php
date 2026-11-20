<?php
    require_once __DIR__ . "/include/conn.php";

    $subject = "TRINŪ Email";

    $message = "
        <div style='display:inline-block;background-color:#FFF0E5;color:#D95700;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:7px 12px;border-radius:20px;margin-bottom:20px;'>
            Email configuration test
        </div>

        <h1 style='margin:0 0 14px;font-size:25px;line-height:1.3;font-weight:800;color:#2B2A28;'>
            Outgoing email is working
        </h1>

        <p style='margin:0 0 16px;font-size:15px;line-height:1.7;color:#2B2A28;'>
            Hello HQF,
        </p>

        <p style='margin:0 0 24px;font-size:14px;line-height:1.8;color:#6B6357;'>
            This is an email to confirm that the outgoing mail configuration is working correctly.
        </p>

        <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0'>
            <tr>
                <td align='center' bgcolor='#FFF4E9' style='background-color:#FFF4E9;border:1px solid #F5D5B8;border-radius:12px;padding:22px 16px;'>
                    <div style='font-size:15px;font-weight:700;color:#D95700;'>
                        &#10003;&nbsp; Email sent successfully.
                    </div>
                </td>
            </tr>
        </table>
    ";

    send_email("hqfdevelopers@gmail.com", "HQF", $subject, $message);