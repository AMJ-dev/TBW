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
        <html>
        <body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#222;\">
            <h2>Password Changed</h2>
            <p>Hello " . htmlspecialchars($user["full_name"]) . ",</p>
            <p>Your TRINU BONDED WAREHOUSE account password was successfully changed.</p>
            <p>All other active sessions on your account have been signed out.</p>
            <p>If you did not make this change, please contact your administrator immediately.</p>
            <p>Regards,<br>TRINU BONDED WAREHOUSE</p>
        </body>
        </html>
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

        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log("Change password error: " . $e->getMessage());

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "An error occurred while changing your password.",
            "code" => []
        ]);

        exit;
    }