<?php
    require_once dirname(__DIR__, 2) . "/include/set-header.php";

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
            <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#333;'>
                <h2 style='color:#2258BF;'>TRINŪ</h2>
                <p>Hello " . htmlspecialchars($user["full_name"], ENT_QUOTES, "UTF-8") . ",</p>
                <p>Here is your new verification code.</p>
                <div style='background:#f4f6fa;padding:20px;text-align:center;border-radius:8px;'>
                    <h1 style='letter-spacing:8px;color:#2258BF;'>" . htmlspecialchars($otp, ENT_QUOTES, "UTF-8") . "</h1>
                </div>
                <p>This code expires in 5 minutes.</p>
                <p>You have a maximum of 5 verification attempts.</p>
                <p>If you did not request this code, you can ignore this email.</p>
                <p style='color:#777;font-size:12px;'>TRINŪ Bonded Terminal Digital Platform</p>
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

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "An error occurred. Please try again.",
            "code" => []
        ]);
    }