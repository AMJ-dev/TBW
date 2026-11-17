<?php
    require_once __DIR__ . "/include/conn.php";

    $subject = "TRINŪ Email Test";

    $message = "
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#333;'>
            <h2 style='color:#2258BF;'>TRINŪ</h2>
            <p>Hello HQF,</p>
            <p>This is a test email to confirm that the outgoing mail configuration is working correctly.</p>
            <div style='background:#f4f6fa;padding:20px;text-align:center;border-radius:8px;'>
                <p style='margin:0;color:#2258BF;font-weight:bold;'>Email sent successfully.</p>
            </div>
            <p style='color:#777;font-size:12px;'>TRINŪ Bonded Terminal Digital Platform</p>
        </div>
    ";

    send_email("hqfdevelopers@gmail.com", "HQF", $subject, $message);