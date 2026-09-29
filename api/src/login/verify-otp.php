<?php

    require_once dirname(__DIR__, 2) . "/include/set-header.php";

    $email = strtolower(trim($_POST["email"] ?? ""));
    $otp = trim($_POST["otp"] ?? "");
    $device_info = trim($_POST["deviceInfo"] ?? "");
    $location_info = trim($_POST["locationInfo"] ?? "");

    $ip_address = $_SERVER["HTTP_X_FORWARDED_FOR"] ?? $_SERVER["REMOTE_ADDR"] ?? "";
    $user_agent = $_SERVER["HTTP_USER_AGENT"] ?? "";

    if ($email === "" || $otp === "") {
        echo json_encode([
            "error" => true,
            "data" => "Email and verification code are required.",
            "code" => []
        ]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            "error" => true,
            "data" => "Invalid email address.",
            "code" => []
        ]);
        exit;
    }

    if (!preg_match("/^\d{6}$/", $otp)) {
        echo json_encode([
            "error" => true,
            "data" => "Enter a valid 6-digit verification code.",
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
                account_status,
                email_verified_at
            FROM users
            WHERE email = :email
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->execute([
            ":email" => $email
        ]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Invalid verification request.",
                "code" => []
            ]);
            exit;
        }

        $user_id = $user["id"];

        if ($user["account_status"] !== "active") {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Your account is not currently active.",
                "code" => []
            ]);
            exit;
        }

        if ($user["email_verified_at"] === null) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Your email address has not been verified.",
                "code" => []
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT
                id,
                otp_hash,
                attempts,
                max_attempts,
                expires_at
            FROM otp_codes
            WHERE user_id = :user_id
            AND purpose = 'login_mfa'
            AND channel = 'email'
            AND verified_at IS NULL
            AND revoked_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->execute([
            ":user_id" => $user_id
        ]);

        $otp_record = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$otp_record) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Verification code not found. Please request a new code.",
                "code" => []
            ]);
            exit;
        }

        if (strtotime($otp_record["expires_at"]) <= time()) {

            $stmt = $conn->prepare("
                UPDATE otp_codes
                SET revoked_at = NOW()
                WHERE id = :id
            ");

            $stmt->execute([
                ":id" => $otp_record["id"]
            ]);

            $conn->commit();

            echo json_encode([
                "error" => true,
                "data" => "This verification code has expired. Please request a new code.",
                "code" => []
            ]);
            exit;
        }

        if ((int)$otp_record["attempts"] >= (int)$otp_record["max_attempts"]) {

            $stmt = $conn->prepare("
                UPDATE otp_codes
                SET revoked_at = NOW()
                WHERE id = :id
            ");

            $stmt->execute([
                ":id" => $otp_record["id"]
            ]);

            $conn->commit();

            echo json_encode([
                "error" => true,
                "data" => "Too many verification attempts. Please request a new code.",
                "code" => []
            ]);
            exit;
        }

        if (!password_verify($otp, $otp_record["otp_hash"])) {

            $attempts = (int)$otp_record["attempts"] + 1;

            if ($attempts >= (int)$otp_record["max_attempts"]) {

                $stmt = $conn->prepare("
                    UPDATE otp_codes
                    SET
                        attempts = :attempts,
                        revoked_at = NOW()
                    WHERE id = :id
                ");

                $stmt->execute([
                    ":attempts" => $attempts,
                    ":id" => $otp_record["id"]
                ]);

            } else {

                $stmt = $conn->prepare("
                    UPDATE otp_codes
                    SET attempts = :attempts
                    WHERE id = :id
                ");

                $stmt->execute([
                    ":attempts" => $attempts,
                    ":id" => $otp_record["id"]
                ]);
            }

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
                    'mfa_failed',
                    :reason
                )
            ");

            $stmt->execute([
                ":id" => $attempt_id,
                ":email" => $user["email"],
                ":user_id" => $user_id,
                ":ip_address" => $ip_address,
                ":user_agent" => $user_agent,
                ":reason" => "Invalid MFA verification code"
            ]);

            $conn->commit();

            echo json_encode([
                "error" => true,
                "data" => $attempts >= (int)$otp_record["max_attempts"]
                    ? "Too many verification attempts. Please request a new code."
                    : "Invalid verification code.",
                "code" => [
                    "attempts_remaining" => max(
                        0,
                        (int)$otp_record["max_attempts"] - $attempts
                    )
                ]
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            UPDATE otp_codes
            SET verified_at = NOW()
            WHERE id = :id
        ");

        $stmt->execute([
            ":id" => $otp_record["id"]
        ]);

        $session_id = generateId();

        $session_token = bin2hex(random_bytes(32));
        $session_token_hash = hash("sha256", $session_token);

        $session_expires_at = date(
            "Y-m-d H:i:s",
            time() + (30 * 24 * 60 * 60)
        );

        $stmt = $conn->prepare("
            INSERT INTO sessions (
                id,
                user_id,
                session_token_hash,
                device_name,
                device_kind,
                os,
                browser,
                ip_address,
                location,
                is_trusted,
                mfa_verified,
                last_active_at,
                expires_at
            ) VALUES (
                :id,
                :user_id,
                :session_token_hash,
                :device_name,
                'unknown',
                NULL,
                NULL,
                :ip_address,
                :location,
                0,
                1,
                NOW(),
                :expires_at
            )
        ");

        $stmt->execute([
            ":id" => $session_id,
            ":user_id" => $user_id,
            ":session_token_hash" => $session_token_hash,
            ":device_name" => $device_info !== "" ? $device_info : "Web Browser",
            ":ip_address" => $ip_address,
            ":location" => $location_info !== "" ? $location_info : null,
            ":expires_at" => $session_expires_at
        ]);

        $stmt = $conn->prepare("
            UPDATE users
            SET
                last_login_at = NOW(),
                failed_login_attempts = 0,
                locked_until = NULL
            WHERE id = :user_id
        ");

        $stmt->execute([
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
                'success',
                :reason
            )
        ");

        $stmt->execute([
            ":id" => $attempt_id,
            ":email" => $user["email"],
            ":user_id" => $user_id,
            ":ip_address" => $ip_address,
            ":user_agent" => $user_agent,
            ":reason" => "Password and MFA verified"
        ]);

        $stmt = $conn->prepare("
            SELECT member_role
            FROM organisation_members
            WHERE user_id = :user_id
            AND membership_status = 'active'
            ORDER BY
                CASE member_role
                    WHEN 'owner' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'member' THEN 3
                    ELSE 4
                END
            LIMIT 1
        ");

        $stmt->execute([
            ":user_id" => $user_id
        ]);

        $membership = $stmt->fetch(PDO::FETCH_ASSOC);

        $member_role = $membership["member_role"] ?? "member";

        if ($member_role === "owner" || $member_role === "admin") {

            $privileges = [
                "operations",
                "portal",
                "finance",
                "gate",
                "reports",
                "administration"
            ];

        } else {

            $privileges = [
                "portal"
            ];
        }

        $route_map = [
            "operations" => "/operations",
            "portal" => "/portal",
            "finance" => "/finance",
            "gate" => "/gate",
            "reports" => "/reports",
            "administration" => "/admin"
        ];

        $route = "/portal";

        foreach ($privileges as $privilege) {
            if (isset($route_map[$privilege])) {
                $route = $route_map[$privilege];
                break;
            }
        }

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Login successful.",
            "code" => [
                "token" => $session_token,
                "email" => $user["email"],
                "expires_in" => 2592000,
                "route" => $route,
                "privileges" => $privileges
            ]
        ]);

        exit;

    } catch (Throwable $e) {

        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log("Login verify OTP error: " . $e->getMessage());

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "An error occurred while verifying your code.",
            "code" => []
        ]);

        exit;
    }