<?php
    require_once dirname(__DIR__, 2) . "/include/set-header.php";
    require_once dirname(__DIR__, 2) . "/include/rate-limit/non-auth.php";

    $error = true;
    $data = "Unable to send verification code.";
    $code = [];

    $honeypot = trim($_POST["honeypot"] ?? $_POST["website"] ?? "");

    if ($honeypot !== "" && !isset($_POST["website"])) {
        echo json_encode([
            "error" => false,
            "data" => "If your details are valid, you will receive further instructions.",
            "code" => []
        ]);
        exit;
    }

    $email = strtolower(trim($_POST["email"] ?? ""));

    if ($email === "") {
        echo json_encode([
            "error" => true,
            "data" => "Email is required.",
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
        $check_user = $conn->prepare("
            SELECT id
            FROM users
            WHERE email = :email
            LIMIT 1
        ");

        $check_user->execute([
            ":email" => $email
        ]);

        if ($check_user->fetch(PDO::FETCH_OBJ)) {
            echo json_encode([
                "error" => true,
                "data" => "An account with this email already exists.",
                "code" => []
            ]);
            exit;
        }

        $conn->beginTransaction();

        $check_request = $conn->prepare("
            SELECT
                id,
                registration_ref,
                status,
                expires_at
            FROM registration_requests
            WHERE email = :email
            AND status IN ('pending_otp', 'verified')
            AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
            FOR UPDATE
        ");

        $check_request->execute([
            ":email" => $email
        ]);

        $existing_request = $check_request->fetch(PDO::FETCH_OBJ);

        if ($existing_request) {
            $request_id = $existing_request->id;
            $registration_ref = $existing_request->registration_ref;

            $reset_request = $conn->prepare("
                UPDATE registration_requests
                SET
                    status = 'pending_otp',
                    email_verified_at = NULL,
                    updated_at = NOW()
                WHERE id = :id
            ");

            $reset_request->execute([
                ":id" => $request_id
            ]);
        } else {
            $request_id = generateId();
            $registration_ref = generateId();
            $request_expires_at = date("Y-m-d H:i:s", strtotime("+30 minutes"));

            $insert_request = $conn->prepare("
                INSERT INTO registration_requests (
                    id,
                    registration_ref,
                    email,
                    status,
                    expires_at
                )
                VALUES (
                    :id,
                    :registration_ref,
                    :email,
                    'pending_otp',
                    :expires_at
                )
            ");

            $insert_request->execute([
                ":id" => $request_id,
                ":registration_ref" => $registration_ref,
                ":email" => $email,
                ":expires_at" => $request_expires_at
            ]);
        }

        $revoke_otps = $conn->prepare("
            UPDATE registration_otps
            SET revoked_at = NOW()
            WHERE registration_request_id = :request_id
            AND channel = 'email'
            AND purpose = 'registration_email'
            AND verified_at IS NULL
            AND revoked_at IS NULL
        ");

        $revoke_otps->execute([
            ":request_id" => $request_id
        ]);

        $otp = (string) random_int(100000, 999999);
        $otp_hash = password_hash($otp, PASSWORD_DEFAULT);
        $otp_expires_at = date("Y-m-d H:i:s", strtotime("+10 minutes"));
        $otp_id = generateId();

        $insert_otp = $conn->prepare("
            INSERT INTO registration_otps (
                id,
                registration_request_id,
                channel,
                destination,
                otp_hash,
                purpose,
                attempts,
                max_attempts,
                resend_count,
                last_sent_at,
                expires_at
            )
            VALUES (
                :id,
                :request_id,
                'email',
                :destination,
                :otp_hash,
                'registration_email',
                0,
                5,
                1,
                NOW(),
                :expires_at
            )
        ");

        $insert_otp->execute([
            ":id" => $otp_id,
            ":request_id" => $request_id,
            ":destination" => $email,
            ":otp_hash" => $otp_hash,
            ":expires_at" => $otp_expires_at
        ]);

        $conn->commit();

        $subject = "Your TRINU Registration Verification Code";

        $email_message = "
            <div style='margin:0;padding:0;background-color:#FAF0E3;'>
                <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color:#FAF0E3;padding:40px 16px;'>
                    <tr>
                        <td align='center'>
                            <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='max-width:600px;background-color:#FFFBF5;border:1px solid #E8D9C2;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;'>

                                <tr>
                                    <td style='background-color:#FF6600;padding:28px 32px;'>
                                        <div style='font-size:24px;font-weight:800;letter-spacing:2px;color:#FFFFFF;'>
                                            TRINŪ
                                        </div>
                                        <div style='font-size:11px;font-weight:600;letter-spacing:1.5px;color:#FFE3CF;text-transform:uppercase;margin-top:5px;'>
                                            Bonded Terminal Digital Platform
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td style='padding:36px 32px 30px;'>
                                        <div style='display:inline-block;background-color:#FFF0E5;color:#D95700;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:7px 12px;border-radius:20px;margin-bottom:20px;'>
                                            Email verification
                                        </div>

                                        <h1 style='margin:0 0 14px;font-size:25px;line-height:1.3;font-weight:800;color:#2B2A28;'>
                                            Verify your email address
                                        </h1>

                                        <p style='margin:0 0 24px;font-size:14px;line-height:1.8;color:#6B6357;'>
                                            Welcome to TRINŪ. Use the verification code below to confirm your email address and continue with your registration.
                                        </p>

                                        <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0'>
                                            <tr>
                                                <td align='center' style='background-color:#FAF0E3;border:1px solid #E8D9C2;border-radius:12px;padding:28px 16px;'>
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
                                                    This code expires in <strong style='color:#2B2A28;'>10 minutes</strong>.
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
                                    </td>
                                </tr>

                                <tr>
                                    <td style='padding:0 32px;'>
                                        <div style='border-top:1px solid #E8D9C2;height:1px;line-height:1px;font-size:0;'>&nbsp;</div>
                                    </td>
                                </tr>

                                <tr>
                                    <td style='padding:24px 32px 30px;text-align:center;'>
                                        <div style='font-size:14px;font-weight:800;letter-spacing:1.5px;color:#FF6600;'>
                                            TRINŪ
                                        </div>
                                        <p style='margin:8px 0 0;font-size:11px;line-height:1.6;color:#8C7C69;'>
                                            Bonded Terminal Digital Platform
                                        </p>
                                        <p style='margin:12px 0 0;font-size:11px;line-height:1.6;color:#B8A894;'>
                                            This is an automated message. Please do not reply.
                                        </p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        ";

        $sent = send_email($email, $AppName, $subject, $email_message);

        if (!$sent) {
            $conn->beginTransaction();

            $revoke_failed_otp = $conn->prepare("
                UPDATE registration_otps
                SET revoked_at = NOW()
                WHERE id = :id
            ");

            $revoke_failed_otp->execute([
                ":id" => $otp_id
            ]);

            $conn->commit();

            echo json_encode([
                "error" => true,
                "data" => "Unable to send verification code. Please try again.",
                "code" => []
            ]);
            exit;
        }

        $error = false;
        $data = "Verification code sent to your email.";

        $code = [
            "registration_ref" => $registration_ref,
            "email" => hide_email($email),
            "expires_in" => 600,
            "retry_after" => 60
        ];

    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log("Register send OTP error: " . $e->getMessage());

        $error = true;
        $data = "An error occurred. Please try again.";
        $code = $e->getMessage();
    }

    echo json_encode([
        "error" => $error,
        "data" => $data,
        "code" => $code
    ]);