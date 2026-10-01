<?php

    require_once dirname(__DIR__, 2) . "/include/set-header.php";

    $email = strtolower(trim($_POST["email"] ?? ""));
    $password = $_POST["password"] ?? "";

    $ip_address = $_SERVER["HTTP_X_FORWARDED_FOR"] ?? $_SERVER["REMOTE_ADDR"] ?? "";
    $user_agent = $_SERVER["HTTP_USER_AGENT"] ?? "";

    if ($email === "" || $password === "") {
        echo json_encode([
            "error" => true,
            "data" => "Email and password are required.",
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
                organisation_id,
                full_name,
                email,
                phone,
                password_hash,
                email_verified_at,
                account_status,
                failed_login_attempts,
                locked_until,
                mfa_enabled
            FROM users
            WHERE email = :email
            LIMIT 1
        ");

        $stmt->execute([
            ":email" => $email
        ]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {

            $attempt_id = generateId();

            $stmt = $conn->prepare("
                INSERT INTO login_attempts (
                    id,
                    email,
                    user_id,
                    ip_address,
                    user_agent,
                    outcome,
                    reason
                ) VALUES (
                    :id,
                    :email,
                    NULL,
                    :ip_address,
                    :user_agent,
                    'invalid_email',
                    :reason
                )
            ");

            $stmt->execute([
                ":id" => $attempt_id,
                ":email" => $email,
                ":ip_address" => $ip_address,
                ":user_agent" => $user_agent,
                ":reason" => "Email address not found"
            ]);

            echo json_encode([
                "error" => true,
                "data" => "Invalid email or password.",
                "code" => []
            ]);
            exit;
        }

        $user_id = $user["id"];

        if (
            $user["locked_until"] !== null &&
            strtotime($user["locked_until"]) > time()
        ) {

            $attempt_id = generateId();

            $stmt = $conn->prepare("
                INSERT INTO login_attempts (
                    id,
                    email,
                    user_id,
                    ip_address,
                    user_agent,
                    outcome,
                    reason
                ) VALUES (
                    :id,
                    :email,
                    :user_id,
                    :ip_address,
                    :user_agent,
                    'locked',
                    :reason
                )
            ");

            $stmt->execute([
                ":id" => $attempt_id,
                ":email" => $email,
                ":user_id" => $user_id,
                ":ip_address" => $ip_address,
                ":user_agent" => $user_agent,
                ":reason" => "Account temporarily locked"
            ]);

            echo json_encode([
                "error" => true,
                "data" => "Your account is temporarily locked. Please try again later.",
                "code" => []
            ]);
            exit;
        }

        if (!password_verify($password, $user["password_hash"])) {

            $failed_attempts = (int)$user["failed_login_attempts"] + 1;

            if ($failed_attempts >= 5) {

                $locked_until = date("Y-m-d H:i:s", time() + (15 * 60));

                $stmt = $conn->prepare("
                    UPDATE users
                    SET
                        failed_login_attempts = :failed_attempts,
                        locked_until = :locked_until
                    WHERE id = :user_id
                ");

                $stmt->execute([
                    ":failed_attempts" => $failed_attempts,
                    ":locked_until" => $locked_until,
                    ":user_id" => $user_id
                ]);

                $attempt_id = generateId();

                $stmt = $conn->prepare("
                    INSERT INTO login_attempts (
                        id,
                        email,
                        user_id,
                        ip_address,
                        user_agent,
                        outcome,
                        reason
                    ) VALUES (
                        :id,
                        :email,
                        :user_id,
                        :ip_address,
                        :user_agent,
                        'locked',
                        :reason
                    )
                ");

                $stmt->execute([
                    ":id" => $attempt_id,
                    ":email" => $user["email"],
                    ":user_id" => $user_id,
                    ":ip_address" => $ip_address,
                    ":user_agent" => $user_agent,
                    ":reason" => "Too many failed password attempts"
                ]);

                echo json_encode([
                    "error" => true,
                    "data" => "Too many failed attempts. Your account has been temporarily locked.",
                    "code" => []
                ]);
                exit;
            }

            $stmt = $conn->prepare("
                UPDATE users
                SET failed_login_attempts = :failed_attempts
                WHERE id = :user_id
            ");

            $stmt->execute([
                ":failed_attempts" => $failed_attempts,
                ":user_id" => $user_id
            ]);

            $attempt_id = generateId();

            $stmt = $conn->prepare("
                INSERT INTO login_attempts (
                    id,
                    email,
                    user_id,
                    ip_address,
                    user_agent,
                    outcome,
                    reason
                ) VALUES (
                    :id,
                    :email,
                    :user_id,
                    :ip_address,
                    :user_agent,
                    'invalid_password',
                    :reason
                )
            ");

            $stmt->execute([
                ":id" => $attempt_id,
                ":email" => $user["email"],
                ":user_id" => $user_id,
                ":ip_address" => $ip_address,
                ":user_agent" => $user_agent,
                ":reason" => "Invalid password"
            ]);

            echo json_encode([
                "error" => true,
                "data" => "Invalid email or password.",
                "code" => []
            ]);
            exit;
        }

        if (!in_array($user["account_status"], ['active', 'rejected'])) {

            $attempt_id = generateId();

            $stmt = $conn->prepare("
                INSERT INTO login_attempts (
                    id,
                    email,
                    user_id,
                    ip_address,
                    user_agent,
                    outcome,
                    reason
                ) VALUES (
                    :id,
                    :email,
                    :user_id,
                    :ip_address,
                    :user_agent,
                    'invalid_password',
                    :reason
                )
            ");

            $stmt->execute([
                ":id" => $attempt_id,
                ":email" => $user["email"],
                ":user_id" => $user_id,
                ":ip_address" => $ip_address,
                ":user_agent" => $user_agent,
                ":reason" => "Account status: " . $user["account_status"]
            ]);

            echo json_encode([
                "error" => true,
                "data" => "Your account is not currently active.",
                "code" => [
                    "status" => $user["account_status"]
                ]
            ]);
            exit;
        }

        if ($user["email_verified_at"] === null) {

            echo json_encode([
                "error" => true,
                "data" => "Please verify your email address before signing in.",
                "code" => [
                    "email" => $user["email"]
                ]
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            UPDATE users
            SET
                failed_login_attempts = 0,
                locked_until = NULL
            WHERE id = :user_id
        ");

        $stmt->execute([
            ":user_id" => $user_id
        ]);

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

        $mfa_enabled = (int)$user["mfa_enabled"] === 1;

        $mfa_token = bin2hex(random_bytes(32));
        $mfa_token_hash = hash("sha256", $mfa_token);

        $otp_id = generateId();
        $otp_expires_at = date("Y-m-d H:i:s", time() + 300);

        if ($mfa_enabled) {

            $otp_hash = password_hash(
                bin2hex(random_bytes(32)),
                PASSWORD_DEFAULT
            );

            $stmt = $conn->prepare("
                INSERT INTO otp_codes (
                    id,
                    user_id,
                    otp_hash,
                    mfa_token_hash,
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
                    :mfa_token_hash,
                    'email',
                    :destination,
                    'login_mfa',
                    0,
                    5,
                    0,
                    NULL,
                    :expires_at,
                    :ip_address
                )
            ");

            $stmt->execute([
                ":id" => $otp_id,
                ":user_id" => $user_id,
                ":otp_hash" => $otp_hash,
                ":mfa_token_hash" => $mfa_token_hash,
                ":destination" => $user["email"],
                ":expires_at" => $otp_expires_at,
                ":ip_address" => $ip_address
            ]);

            $attempt_id = generateId();

            $stmt = $conn->prepare("
                INSERT INTO login_attempts (
                    id,
                    email,
                    user_id,
                    ip_address,
                    user_agent,
                    outcome,
                    reason
                ) VALUES (
                    :id,
                    :email,
                    :user_id,
                    :ip_address,
                    :user_agent,
                    'mfa_pending',
                    :reason
                )
            ");

            $stmt->execute([
                ":id" => $attempt_id,
                ":email" => $user["email"],
                ":user_id" => $user_id,
                ":ip_address" => $ip_address,
                ":user_agent" => $user_agent,
                ":reason" => "Password verified, authenticator MFA required"
            ]);

            echo json_encode([
                "error" => false,
                "data" => "Authenticator verification required.",
                "code" => [
                    "email" => $user["email"],
                    "expires_in" => 300,
                    "mfa_enabled" => true,
                    "mfa_token" => $mfa_token
                ]
            ]);
            exit;
        }

        $otp = (string)random_int(100000, 999999);
        $otp_hash = password_hash($otp, PASSWORD_DEFAULT);

        $stmt = $conn->prepare("
            INSERT INTO otp_codes (
                id,
                user_id,
                otp_hash,
                mfa_token_hash,
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
                :mfa_token_hash,
                'email',
                :destination,
                'login_mfa',
                0,
                5,
                0,
                NOW(),
                :expires_at,
                :ip_address
            )
        ");

        $stmt->execute([
            ":id" => $otp_id,
            ":user_id" => $user_id,
            ":otp_hash" => $otp_hash,
            ":mfa_token_hash" => $mfa_token_hash,
            ":destination" => $user["email"],
            ":expires_at" => $otp_expires_at,
            ":ip_address" => $ip_address
        ]);

        $attempt_id = generateId();

        $stmt = $conn->prepare("
            INSERT INTO login_attempts (
                id,
                email,
                user_id,
                ip_address,
                user_agent,
                outcome,
                reason
            ) VALUES (
                :id,
                :email,
                :user_id,
                :ip_address,
                :user_agent,
                'mfa_pending',
                :reason
            )
        ");

        $stmt->execute([
            ":id" => $attempt_id,
            ":email" => $user["email"],
            ":user_id" => $user_id,
            ":ip_address" => $ip_address,
            ":user_agent" => $user_agent,
            ":reason" => "Password verified, email OTP required"
        ]);

        $subject = "Your TRINŪ Sign-In Verification Code";

        $message = "
            <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#333;'>
                <h2 style='color:#2258BF;'>TRINŪ</h2>
                <p>Hello " . htmlspecialchars($user["full_name"], ENT_QUOTES, "UTF-8") . ",</p>
                <p>Use the verification code below to complete your sign-in.</p>
                <div style='background:#f4f6fa;padding:20px;text-align:center;border-radius:8px;'>
                    <h1 style='letter-spacing:8px;color:#2258BF;'>" . htmlspecialchars($otp, ENT_QUOTES, "UTF-8") . "</h1>
                </div>
                <p>This code expires in 5 minutes.</p>
                <p>You have a maximum of 5 verification attempts.</p>
                <p>If you did not attempt to sign in, you can ignore this email.</p>
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
            "data" => "A verification code has been sent to your email.",
            "code" => [
                "email" => $user["email"],
                "expires_in" => 300,
                "mfa_enabled" => false,
                "mfa_token" => $mfa_token
            ]
        ]);

    } catch (Throwable $e) {

        error_log("Sign-in error: " . $e->getMessage());

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "An error occurred. Please try again.",
            "code" => []
        ]);
    }