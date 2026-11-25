<?php
    require_once dirname(__DIR__, 2) . "/include/set-header.php";
    require_once dirname(__DIR__, 2) . "/include/rate-limit/non-auth.php";

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
                u.id,
                u.organisation_id,
                u.account_type,
                u.full_name,
                u.email,
                u.phone,
                u.password_hash,
                u.email_verified_at,
                u.account_status,
                u.failed_login_attempts,
                u.locked_until,
                u.mfa_enabled,
                o.verification_status AS organisation_status,
                o.rejection_reason AS organisation_rejection_reason
            FROM users u
            LEFT JOIN organisations o
                ON o.id = u.organisation_id
            WHERE u.email = :email
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

        $can_login = false;

        if ($user["account_status"] === "active" && $user["organisation_status"] === "verified") $can_login = true;

        if (
            $user["account_type"] === "organisation" &&
            $user["account_status"] === "pending_approval" &&
            $user["organisation_status"] === "rejected"
        ) $can_login = true;

        if (!$can_login) {

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
                ":reason" => "Login not permitted. User status: " .
                    $user["account_status"] .
                    ", organisation status: " .
                    ($user["organisation_status"] ?? "none")
            ]);

            echo json_encode([
                "error" => true,
                "data" => "Your account is not currently eligible to sign in.",
                "code" => [
                    "status" => $user["account_status"],
                    "organisation_status" => $user["organisation_status"],
                    "organisation_rejection_reason" => $user["organisation_rejection_reason"]
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
                    expires_at
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
                    :expires_at
                )
            ");

            $stmt->execute([
                ":id" => $otp_id,
                ":user_id" => $user_id,
                ":otp_hash" => $otp_hash,
                ":mfa_token_hash" => $mfa_token_hash,
                ":destination" => $user["email"],
                ":expires_at" => $otp_expires_at
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
                    "mfa_token" => $mfa_token,
                    "organisation_status" => $user["organisation_status"],
                    "organisation_rejection_reason" => $user["organisation_rejection_reason"]
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
                expires_at
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
                :expires_at
            )
        ");

        $stmt->execute([
            ":id" => $otp_id,
            ":user_id" => $user_id,
            ":otp_hash" => $otp_hash,
            ":mfa_token_hash" => $mfa_token_hash,
            ":destination" => $user["email"],
            ":expires_at" => $otp_expires_at
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
            <div style='display:inline-block;background-color:#FFF0E5;color:#D95700;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:7px 12px;border-radius:20px;margin-bottom:20px;'>
                Sign-in verification
            </div>

            <h1 style='margin:0 0 14px;font-size:25px;line-height:1.3;font-weight:800;color:#2B2A28;'>
                Verify your identity
            </h1>

            <p style='margin:0 0 12px;font-size:15px;line-height:1.7;color:#2B2A28;'>
                Hello " . htmlspecialchars($user["full_name"], ENT_QUOTES, "UTF-8") . ",
            </p>

            <p style='margin:0 0 28px;font-size:14px;line-height:1.8;color:#6B6357;'>
                You're almost there. Enter the verification code below to securely complete your sign-in to TRINŪ.
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
                        If you did not attempt to sign in, you can safely ignore this email.
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

        $sent = send_email($user["email"], $user["full_name"], $subject, $message);

        if (!$sent) {

            $stmt = $conn->prepare("
                UPDATE otp_codes
                SET revoked_at = NOW()
                WHERE id = :id
            ");

            $stmt->execute([":id" => $otp_id]);

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
                "mfa_token" => $mfa_token,
                "organisation_status" => $user["organisation_status"],
                "organisation_rejection_reason" => $user["organisation_rejection_reason"]
            ]
        ]);

    } catch (Throwable $e) {

        error_log("Sign-in error: " . $e->getMessage());

        

        echo json_encode([
            "error" => true,
            "data" => "An error occurred. Please try again.",
            "code" => $e->getMessage()
        ]);
    }