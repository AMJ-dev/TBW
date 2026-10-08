<?php
    use \Firebase\JWT\JWT;
    require_once dirname(__DIR__, 2) . "/include/set-header.php";

    function base32Decode($input){
        $input = strtoupper(preg_replace("/[^A-Z2-7]/", "", $input));

        $alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        $bits = "";

        for ($i = 0; $i < strlen($input); $i++) {
            $position = strpos($alphabet, $input[$i]);

            if ($position === false) {
                return false;
            }

            $bits .= str_pad(
                decbin($position),
                5,
                "0",
                STR_PAD_LEFT
            );
        }

        $result = "";

        for ($i = 0; $i + 8 <= strlen($bits); $i += 8) {
            $result .= chr(
                bindec(substr($bits, $i, 8))
            );
        }

        return $result;
    }

    function verifyTotp($secret, $code){
        $key = base32Decode($secret);

        if ($key === false || $key === "") {
            return false;
        }

        $time = floor(time() / 30);

        for ($offset = -1; $offset <= 1; $offset++) {

            $counter = $time + $offset;

            $binary_counter = pack(
                "N2",
                ($counter >> 32) & 0xFFFFFFFF,
                $counter & 0xFFFFFFFF
            );

            $hash = hash_hmac(
                "sha1",
                $binary_counter,
                $key,
                true
            );

            $offset_byte = ord($hash[19]) & 0x0F;

            $binary =
                ((ord($hash[$offset_byte]) & 0x7F) << 24) |
                ((ord($hash[$offset_byte + 1]) & 0xFF) << 16) |
                ((ord($hash[$offset_byte + 2]) & 0xFF) << 8) |
                (ord($hash[$offset_byte + 3]) & 0xFF);

            $otp = str_pad(
                (string)($binary % 1000000),
                6,
                "0",
                STR_PAD_LEFT
            );

            if (hash_equals($otp, $code)) {
                return true;
            }
        }

        return false;
    }

    $mfa_token = trim($_POST["mfa_token"] ?? "");
    $otp = trim($_POST["code"] ?? "");
    $recovery_code = trim($_POST["recovery_code"] ?? "");
    $trust_device = filter_var(
        $_POST["trust_device"] ?? false,
        FILTER_VALIDATE_BOOLEAN
    );
    $device_info = trim($_POST["device_info"] ?? "");
    $location_info = trim($_POST["location_info"] ?? "");

    $ip_address =
        $_SERVER["HTTP_X_FORWARDED_FOR"]
        ?? $_SERVER["REMOTE_ADDR"]
        ?? "";

    $user_agent =
        $_SERVER["HTTP_USER_AGENT"]
        ?? "";

    if (strpos($ip_address, ",") !== false) {
        $ip_address = trim(explode(",", $ip_address)[0]);
    }

    if ($mfa_token === "") {
        echo json_encode([
            "error" => true,
            "data" => "Verification token is required.",
            "code" => []
        ]);
        exit;
    }

    if (!preg_match("/^[a-f0-9]{64}$/i", $mfa_token)) {
        echo json_encode([
            "error" => true,
            "data" => "Invalid verification request.",
            "code" => []
        ]);
        exit;
    }

    $is_recovery = $recovery_code !== "";

    if (!$is_recovery && !preg_match("/^\d{6}$/", $otp)) {
        echo json_encode([
            "error" => true,
            "data" => "Enter a valid 6-digit verification code.",
            "code" => []
        ]);
        exit;
    }

    if (
        $is_recovery &&
        !preg_match("/^[A-Za-z0-9\-]{6,64}$/", $recovery_code)
    ) {
        echo json_encode([
            "error" => true,
            "data" => "Invalid recovery code.",
            "code" => []
        ]);
        exit;
    }

    try {

        $conn->beginTransaction();

        $mfa_token_hash = hash(
            "sha256",
            $mfa_token
        );

        $stmt = $conn->prepare("
            SELECT
                id,
                user_id,
                attempts,
                max_attempts,
                expires_at
            FROM otp_codes
            WHERE mfa_token_hash = :mfa_token_hash
            AND purpose = 'login_mfa'
            AND verified_at IS NULL
            AND revoked_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->execute([
            ":mfa_token_hash" => $mfa_token_hash
        ]);

        $otp_record = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$otp_record) {

            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Invalid or expired verification request.",
                "code" => []
            ]);
            exit;
        }

        $user_id = $otp_record["user_id"];

        $stmt = $conn->prepare("
            SELECT
                id,
                full_name,
                email,
                phone,
                account_type,
                system_role_id,
                account_status,
                email_verified_at,
                mfa_enabled,
                mfa_secret
            FROM users
            WHERE id = :user_id
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->execute([
            ":user_id" => $user_id
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

        if ((int)$user["mfa_enabled"] !== 1) {

            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "MFA is not enabled for this account.",
                "code" => []
            ]);
            exit;
        }

        if (empty($user["mfa_secret"])) {

            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "MFA is not properly configured for this account.",
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
                "data" => "This verification request has expired. Please sign in again.",
                "code" => []
            ]);
            exit;
        }

        if (
            (int)$otp_record["attempts"] >=
            (int)$otp_record["max_attempts"]
        ) {

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
                "data" => "Too many verification attempts. Please sign in again.",
                "code" => []
            ]);
            exit;
        }

        $verification_success = false;

        if ($is_recovery) {

            $stmt = $conn->prepare("
                SELECT
                    id,
                    code_hash
                FROM mfa_recovery_codes
                WHERE user_id = :user_id
                AND used_at IS NULL
            ");

            $stmt->execute([
                ":user_id" => $user_id
            ]);

            $recovery_record = null;

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {

                if (
                    password_verify(
                        $recovery_code,
                        $row["code_hash"]
                    )
                ) {
                    $recovery_record = $row;
                    break;
                }
            }

            if ($recovery_record) {

                $stmt = $conn->prepare("
                    UPDATE mfa_recovery_codes
                    SET used_at = NOW()
                    WHERE id = :id
                ");

                $stmt->execute([
                    ":id" => $recovery_record["id"]
                ]);

                $verification_success = true;
            }

        } else {

            if (!$mfa_key) {
                throw new Exception(
                    "MFA encryption key is not configured."
                );
            }

            $key = hash(
                "sha256",
                $mfa_key,
                true
            );

            $decoded = base64_decode(
                $user["mfa_secret"],
                true
            );

            if (
                $decoded === false ||
                strlen($decoded) < 17
            ) {
                throw new Exception(
                    "Invalid MFA secret."
                );
            }

            $iv = substr(
                $decoded,
                0,
                16
            );

            $encrypted_secret = substr(
                $decoded,
                16
            );

            $secret = openssl_decrypt(
                $encrypted_secret,
                "AES-256-CBC",
                $key,
                OPENSSL_RAW_DATA,
                $iv
            );

            if (
                $secret === false ||
                $secret === ""
            ) {
                throw new Exception(
                    "Could not decrypt MFA secret."
                );
            }

            $verification_success = verifyTotp(
                $secret,
                $otp
            );
        }

        if (!$verification_success) {

            $attempts =
                (int)$otp_record["attempts"] + 1;

            $max_attempts =
                (int)$otp_record["max_attempts"];

            if ($attempts >= $max_attempts) {

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
                ":reason" => $is_recovery
                    ? "Invalid MFA recovery code"
                    : "Invalid authenticator MFA code"
            ]);

            $conn->commit();

            echo json_encode([
                "error" => true,
                "data" => $attempts >= $max_attempts
                    ? "Too many verification attempts. Please sign in again."
                    : (
                        $is_recovery
                        ? "Invalid recovery code."
                        : "Invalid verification code."
                    ),
                "code" => [
                    "attempts_remaining" => max(
                        0,
                        $max_attempts - $attempts
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

        $session_token = bin2hex(
            random_bytes(32)
        );

        $session_token_hash = hash("sha256", $session_token);

        $session_expires_at = date(
            "Y-m-d H:i:s",
            time() + (30 * 24 * 60 * 60)
        );

        $is_trusted = $trust_device ? 1 : 0;

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
                :is_trusted,
                1,
                NOW(),
                :expires_at
            )
        ");

        $stmt->execute([
            ":id" => $session_id,
            ":user_id" => $user_id,
            ":session_token_hash" => $session_token_hash,
            ":device_name" => $device_info !== ""
                ? $device_info
                : "Web Browser",
            ":ip_address" => $ip_address,
            ":location" => $location_info !== ""
                ? $location_info
                : null,
            ":is_trusted" => $is_trusted,
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
            ":reason" => $is_recovery
                ? "Password and MFA recovery code verified"
                : "Password and authenticator MFA code verified"
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
                INNER JOIN roles r ON r.id = om.role_id
                WHERE om.user_id = :user_id
                AND om.membership_status = 'active'
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

            $permissions[] =
                $permission["permission_key"];

            if (
                !in_array(
                    $permission["module"],
                    $privileges,
                    true
                )
            ) {
                $privileges[] =
                    $permission["module"];
            }
        }

        $conn->commit();
        $route = $user["account_type"] === "system"?"/admin":"/portal";

        require_once dirname(__DIR__, 2) . "/include/set-token.php";

    } catch (Throwable $e) {

        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log(
            "MFA verification error: " .
            $e->getMessage()
        );

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "An error occurred while verifying your code.",
            "code" => []
        ]);

        exit;
    }