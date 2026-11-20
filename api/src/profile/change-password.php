<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $current_password = $_POST["current_password"] ?? "";
    $new_password = $_POST["new_password"] ?? "";
    $confirm_password = $_POST["confirm_password"] ?? "";

    if ($current_password === "" || $new_password === "" || $confirm_password === "") {
        echo json_encode([
            "error" => true,
            "data" => "All password fields are required.",
            "code" => []
        ]);
        exit;
    }

    if (strlen($new_password) < 8) {
        echo json_encode([
            "error" => true,
            "data" => "Your new password must be at least 8 characters.",
            "code" => []
        ]);
        exit;
    }

    if ($new_password !== $confirm_password) {
        echo json_encode([
            "error" => true,
            "data" => "The new password and confirmation password do not match.",
            "code" => []
        ]);
        exit;
    }

    if ($current_password === $new_password) {
        echo json_encode([
            "error" => true,
            "data" => "Your new password must be different from your current password.",
            "code" => []
        ]);
        exit;
    }

    try {

        $conn->beginTransaction();

        $stmt = $conn->prepare("
            SELECT
                id,
                full_name,
                email,
                password_hash
            FROM users
            WHERE id = :user_id
            AND account_status = 'active'
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->execute([
            ":user_id" => $my_details->id
        ]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Your account could not be found.",
                "code" => []
            ]);
            exit;
        }

        if (!password_verify($current_password, $user["password_hash"])) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Your current password is incorrect.",
                "code" => []
            ]);
            exit;
        }

        $new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);

        if ($new_password_hash === false) {
            throw new Exception("Unable to generate password hash.");
        }

        $stmt = $conn->prepare("
            UPDATE users
            SET
                password_hash = :password_hash,
                password_changed_at = NOW()
            WHERE id = :user_id
        ");

        $stmt->execute([
            ":password_hash" => $new_password_hash,
            ":user_id" => $user["id"]
        ]);

        $current_token = "";

        $authorization = $_SERVER["HTTP_AUTHORIZATION"] ?? "";

        if (preg_match("/Bearer\s+(.+)/i", $authorization, $matches)) {
            $current_token = trim($matches[1]);
        }

        if ($current_token !== "") {

            $current_token_hash = hash("sha256", $current_token);

            $stmt = $conn->prepare("
                UPDATE sessions
                SET
                    revoked_at = NOW(),
                    revoked_reason = 'Password changed'
                WHERE user_id = :user_id
                AND session_token_hash != :current_token_hash
                AND revoked_at IS NULL
            ");

            $stmt->execute([
                ":user_id" => $user["id"],
                ":current_token_hash" => $current_token_hash
            ]);

        } else {

            $stmt = $conn->prepare("
                UPDATE sessions
                SET
                    revoked_at = NOW(),
                    revoked_reason = 'Password changed'
                WHERE user_id = :user_id
                AND revoked_at IS NULL
            ");

            $stmt->execute([
                ":user_id" => $user["id"]
            ]);
        }

        $event_id = generateId();

        $ip_address = $_SERVER["HTTP_X_FORWARDED_FOR"]
            ?? $_SERVER["REMOTE_ADDR"]
            ?? "";

        $device_name = $_SERVER["HTTP_USER_AGENT"]
            ?? "Unknown device";

        $detail = json_encode([
            "message" => "Password changed successfully.",
            "sessions_revoked" => true
        ]);

        $stmt = $conn->prepare("
            INSERT INTO account_events (
                id,
                user_id,
                event,
                ip_address,
                device_name,
                detail
            ) VALUES (
                :id,
                :user_id,
                'password_changed',
                :ip_address,
                :device_name,
                :detail
            )
        ");

        $stmt->execute([
            ":id" => $event_id,
            ":user_id" => $user["id"],
            ":ip_address" => $ip_address,
            ":device_name" => $device_name,
            ":detail" => $detail
        ]);

        $conn->commit();

        $subject = "Your TRINU password has been changed";

        $message = "
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
                                            Account security
                                        </div>

                                        <h1 style='margin:0 0 14px;font-size:25px;line-height:1.3;font-weight:800;color:#2B2A28;'>
                                            Your password has been changed
                                        </h1>

                                        <p style='margin:0 0 16px;font-size:15px;line-height:1.7;color:#2B2A28;'>
                                            Hello " . htmlspecialchars($user["full_name"], ENT_QUOTES, "UTF-8") . ",
                                        </p>

                                        <p style='margin:0 0 24px;font-size:14px;line-height:1.8;color:#6B6357;'>
                                            Your TRINŪ Bonded Terminal Digital Platform account password was successfully changed.
                                        </p>

                                        <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:24px;'>
                                            <tr>
                                                <td style='background-color:#FAF0E3;border:1px solid #E8D9C2;border-radius:12px;padding:20px;'>
                                                    <div style='font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#8C7C69;margin-bottom:8px;'>
                                                        Security update
                                                    </div>
                                                    <div style='font-size:15px;font-weight:700;color:#2B2A28;margin-bottom:6px;'>
                                                        Password successfully updated
                                                    </div>
                                                    <div style='font-size:13px;line-height:1.7;color:#6B6357;'>
                                                        All other active sessions on your account have been signed out.
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>

                                        <div style='padding:16px;background-color:#FFF4E9;border-left:3px solid #FF6600;border-radius:4px;'>
                                            <p style='margin:0;font-size:13px;line-height:1.7;color:#765C45;'>
                                                <strong style='color:#2B2A28;'>Didn't make this change?</strong>
                                                If you did not change your password, contact your administrator immediately to secure your account.
                                            </p>
                                        </div>

                                        <p style='margin:24px 0 0;font-size:14px;line-height:1.7;color:#6B6357;'>
                                            Thank you for keeping your account secure.
                                        </p>
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

        send_email($user["email"], $user["full_name"], $subject, $message);

        echo json_encode([
            "error" => false,
            "data" => "Your password has been changed successfully.",
            "code" => [
                "sessions_revoked" => true
            ]
        ]);

        exit;

    } catch (Throwable $e) {
        if ($conn->inTransaction()) $conn->rollBack();
        echo json_encode([
            "error" => true,
            "data" => "An error occurred while changing your password.",
            "code" => []
        ]);
        exit;
    }