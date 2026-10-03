<?php

    use Firebase\JWT\JWT;
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
                account_type,
                account_status,
                phone,
                system_role_id,
                organisation_id,
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

        $organisation = null;

        if (
            $user["account_type"] === "organisation" &&
            !empty($user["organisation_id"])
        ) {
            $stmt = $conn->prepare("
                SELECT
                    id,
                    organisation_name,
                    organisation_type,
                    verification_status,
                    rejection_reason,
                    verified_by,
                    verified_at
                FROM organisations
                WHERE id = :id
                LIMIT 1
            ");

            $stmt->execute([
                ":id" => $user["organisation_id"]
            ]);

            $organisation = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$organisation) {
                $conn->rollBack();

                echo json_encode([
                    "error" => true,
                    "data" => "Organisation associated with this account was not found.",
                    "code" => []
                ]);
                exit;
            }
        }

        $can_login = false;

        if (
            $user["account_status"] === "active" &&
            $organisation &&
            $organisation["verification_status"] === "verified"
        ) {
            $can_login = true;
        }

        if (
            $user["account_type"] === "organisation" &&
            $user["account_status"] === "pending_approval" &&
            $organisation &&
            $organisation["verification_status"] === "rejected"
        ) {
            $can_login = true;
        }

        if (!$can_login) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Your account is not currently eligible to sign in.",
                "code" => [
                    "status" => $user["account_status"],
                    "organisation_status" => $organisation["verification_status"] ?? null,
                    "organisation_rejection_reason" => $organisation["rejection_reason"] ?? null
                ]
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
                )
                VALUES (
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
            )
            VALUES (
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
            )
            VALUES (
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

        $role = null;

        if ($user["account_type"] === "system") {

            if (empty($user["system_role_id"])) {
                $conn->rollBack();

                echo json_encode([
                    "error" => true,
                    "data" => "Your system account does not have an assigned role.",
                    "code" => []
                ]);
                exit;
            }

            $stmt = $conn->prepare("
                SELECT
                    id,
                    role_key,
                    role_name,
                    scope
                FROM roles
                WHERE id = :role_id
                AND is_active = 1
                AND scope = 'system'
                LIMIT 1
            ");

            $stmt->execute([
                ":role_id" => $user["system_role_id"]
            ]);

            $role = $stmt->fetch(PDO::FETCH_ASSOC);

        } else {

            $stmt = $conn->prepare("
                SELECT
                    r.id,
                    r.role_key,
                    r.role_name,
                    r.scope
                FROM organisation_members om
                INNER JOIN roles r
                    ON r.id = om.role_id
                WHERE om.user_id = :user_id
                AND om.membership_status != 'revoked'
                AND r.is_active = 1
                AND r.scope = 'organisation'
                ORDER BY
                    CASE r.role_key
                        WHEN 'organisation_owner' THEN 1
                        WHEN 'management' THEN 2
                        WHEN 'finance' THEN 3
                        WHEN 'terminal_operations' THEN 4
                        WHEN 'gate_officer' THEN 5
                        WHEN 'warehouse_yard_officer' THEN 6
                        WHEN 'documentation_officer' THEN 7
                        WHEN 'customer_service_sales' THEN 8
                        WHEN 'compliance_customs_liaison' THEN 9
                        WHEN 'regulator_auditor' THEN 10
                        ELSE 99
                    END
                LIMIT 1
            ");

            $stmt->execute([
                ":user_id" => $user_id
            ]);

            $role = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        if (!$role) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Your account does not have an active role.",
                "code" => []
            ]);
            exit;
        }

        $role_id = $role["id"];
        $role_key = $role["role_key"];
        $role_name = $role["role_name"];
        $role_scope = $role["scope"];

        $stmt = $conn->prepare("
            SELECT
                p.permission_key,
                p.module,
                p.action
            FROM role_permissions rp
            INNER JOIN permissions p
                ON p.id = rp.permission_id
            WHERE rp.role_id = :role_id
            ORDER BY p.module, p.action
        ");

        $stmt->execute([
            ":role_id" => $role_id
        ]);

        $permission_rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $permissions = [];
        $privileges = [];

        foreach ($permission_rows as $permission) {

            $permissions[] = $permission["permission_key"];

            if (!in_array($permission["module"], $privileges, true)) {
                $privileges[] = $permission["module"];
            }
        }

        if (
            $user["account_type"] === "organisation" &&
            $organisation &&
            $organisation["verification_status"] === "rejected"
        ) {
            $route = "/organisation-resubmit";
        } else {
            $route = $route_map[$role_key] ?? "/portal";
        }

        $conn->commit();

        $token = [
            "id" => $user_id,
            "session_id" => $session_id
        ];

        $jwt = JWT::encode($token, $privateKey, "RS256");

        setcookie(
            "token",
            $jwt,
            [
                "expires" => time() + 86400,
                "path" => "/",
                "domain" => "",
                "secure" => str_starts_with(strtolower($baseURL), "https://"),
                "httponly" => true,
                "samesite" => "Lax"
            ]
        );

        echo json_encode([
            "error" => false,
            "data" => "Login successful.",
            "code" => [
                "email" => $user["email"],
                "expires_in" => 2592000,
                "user" => [
                    "id" => $user["id"],
                    "email" => $user["email"],
                    "full_name" => $user["full_name"],
                    "phone" => $user["phone"],
                    "account_type" => $user["account_type"],
                    "account_status" => $user["account_status"],
                ],
                "organisation" => $organisation,
                "role" => [
                    "id" => $role_id,
                    "key" => $role_key,
                    "name" => $role_name,
                    "scope" => $role_scope
                ],
                "route" => $route,
                "privileges" => $privileges,
                "permissions" => $permissions
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
            "code" => $e->getMessage()
        ]);

        exit;
    }