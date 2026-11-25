<?php
    require_once dirname(__DIR__, 2) . "/include/set-header.php";
    require_once dirname(__DIR__, 2) . "/include/rate-limit/non-auth.php";

    $email = strtolower(trim($_POST["email"] ?? ""));

    $ip_address = $_SERVER["HTTP_X_FORWARDED_FOR"] ?? $_SERVER["REMOTE_ADDR"] ?? "";

    if ($email === "") {
        echo json_encode([
            "error" => true,
            "data" => "Email address is required.",
            "code" => []
        ]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            "error" => true,
            "data" => "Enter a valid email address.",
            "code" => []
        ]);
        exit;
    }

    try {

        $stmt = $conn->prepare("
            SELECT
                id,
                full_name,
                email,
                account_status,
                email_verified_at
            FROM users
            WHERE email = :email
            LIMIT 1
        ");

        $stmt->execute([
            ":email" => $email
        ]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            echo json_encode([
                "error" => true,
                "data" => "Unable to resend verification code.",
                "code" => []
            ]);
            exit;
        }

        if (!in_array($user["account_status"], ["active", "rejected"], true)) {
            echo json_encode([
                "error" => true,
                "data" => "Your account is not currently active.",
                "code" => []
            ]);
            exit;
        }

        if ($user["email_verified_at"] === null) {
            echo json_encode([
                "error" => true,
                "data" => "Please verify your email address first.",
                "code" => []
            ]);
            exit;
        }

        $user_id = $user["id"];

        $stmt = $conn->prepare("
            SELECT
                id,
                last_sent_at,
                resend_count
            FROM otp_codes
            WHERE user_id = :user_id
            AND purpose = 'login_mfa'
            AND channel = 'email'
            AND verified_at IS NULL
            AND revoked_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
        ");

        $stmt->execute([
            ":user_id" => $user_id
        ]);

        $existing_otp = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing_otp && $existing_otp["last_sent_at"] !== null) {

            $seconds_since_sent = time() - strtotime($existing_otp["last_sent_at"]);

            if ($seconds_since_sent < 120) {

                $retry_after = 120 - $seconds_since_sent;

                echo json_encode([
                    "error" => true,
                    "data" => "Please wait before requesting another code.",
                    "code" => [
                        "retry_after" => $retry_after
                    ]
                ]);
                exit;
            }
        }

        $conn->beginTransaction();

        $stmt = $conn->prepare("
            UPDATE otp_codes
            SET revoked_at = NOW()
            WHERE user_id = :user_id
            AND purpose = 'login_mfa'
            AND verified_at IS NULL
            AND revoked_at IS NULL
        ");

        $stmt->execute([
            ":user_id" => $user_id
        ]);

        $otp = (string)random_int(100000, 999999);
        $otp_hash = password_hash($otp, PASSWORD_DEFAULT);
        $otp_id = generateId();
        $otp_expires_at = date("Y-m-d H:i:s", time() + 300);

        $stmt = $conn->prepare("
            INSERT INTO otp_codes (
                id,
                user_id,
                otp_hash,
                channel,
                destination,
                purpose,
                attempts,
                max_attempts,
                resend_count,
                last_sent_at,
                expires_at,
                ip_address
            ) VALUES (
                :id,
                :user_id,
                :otp_hash,
                'email',
                :destination,
                'login_mfa',
                0,
                5,
                1,
                NOW(),
                :expires_at,
                :ip_address
            )
        ");

        $stmt->execute([
            ":id" => $otp_id,
            ":user_id" => $user_id,
            ":otp_hash" => $otp_hash,
            ":destination" => $user["email"],
            ":expires_at" => $otp_expires_at,
            ":ip_address" => $ip_address
        ]);

        $conn->commit();

        $subject = "Your TRINŪ Sign-In Verification Code";

        $message = "
            <div style='display:inline-block;background-color:#FFF0E5;color:#D95700;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:7px 12px;border-radius:20px;margin-bottom:20px;'>
                New verification code
            </div>

            <h1 style='margin:0 0 14px;font-size:25px;line-height:1.3;font-weight:800;color:#2B2A28;'>
                Your new code is ready
            </h1>

            <p style='margin:0 0 12px;font-size:15px;line-height:1.7;color:#2B2A28;'>
                Hello " . htmlspecialchars($user["full_name"], ENT_QUOTES, "UTF-8") . ",
            </p>

            <p style='margin:0 0 28px;font-size:14px;line-height:1.8;color:#6B6357;'>
                Here is your new verification code. Enter it to continue securely with your sign-in to TRINŪ.
            </p>

            <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0'>
                <tr>
                    <td align='center' bgcolor='#FAF0E3' style='background-color:#FAF0E3;border:1px solid #E8D9C2;border-radius:12px;padding:28px 16px;'>
                        <div style='font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#8C7C69;margin-bottom:14px;'>
                            Your verification code
                        </div>
                        <div style='font-family:Consolas,Monaco,monospace;font-size:34px;font-weight:800;letter-spacing:10px;color:#FF6600;'>
                            " . htmlspecialchars($otp, ENT_QUOTES, "UTF-8") . "
                        </div>
                    </td>
                </tr>
            </table>

            <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-top:26px;'>
                <tr>
                    <td style='padding:8px 0;font-size:13px;line-height:1.6;color:#6B6357;'>
                        <span style='color:#FF6600;font-weight:700;'>&#9679;</span>&nbsp;&nbsp;
                        This code expires in <strong style='color:#2B2A28;'>5 minutes</strong>.
                    </td>
                </tr>
                <tr>
                    <td style='padding:8px 0;font-size:13px;line-height:1.6;color:#6B6357;'>
                        <span style='color:#FF6600;font-weight:700;'>&#9679;</span>&nbsp;&nbsp;
                        You have a maximum of <strong style='color:#2B2A28;'>5 verification attempts</strong>.
                    </td>
                </tr>
                <tr>
                    <td style='padding:8px 0;font-size:13px;line-height:1.6;color:#6B6357;'>
                        <span style='color:#FF6600;font-weight:700;'>&#9679;</span>&nbsp;&nbsp;
                        If you did not request this code, you can safely ignore this email.
                    </td>
                </tr>
            </table>

            <div style='margin-top:26px;padding:15px 16px;background-color:#FFF4E9;border-left:3px solid #FF6600;border-radius:4px;'>
                <p style='margin:0;font-size:12px;line-height:1.7;color:#765C45;'>
                    <strong style='color:#2B2A28;'>Security reminder:</strong>
                    Never share your verification code with anyone. TRINŪ will never ask you to disclose it.
                </p>
            </div>
        ";

        $sent = send_email(
            $user["email"],
            $user["full_name"],
            $subject,
            $message
        );

        if (!$sent) {

            $stmt = $conn->prepare("
                UPDATE otp_codes
                SET revoked_at = NOW()
                WHERE id = :id
            ");

            $stmt->execute([
                ":id" => $otp_id
            ]);

            echo json_encode([
                "error" => true,
                "data" => "Unable to send verification code. Please try again.",
                "code" => []
            ]);
            exit;
        }

        echo json_encode([
            "error" => false,
            "data" => "A new verification code has been sent to your email.",
            "code" => [
                "expires_in" => 300,
                "retry_after" => 120
            ]
        ]);

    } catch (Throwable $e) {

        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log("Login resend OTP error: " . $e->getMessage());

        

        echo json_encode([
            "error" => true,
            "data" => "An error occurred. Please try again.",
            "code" => []
        ]);
    }