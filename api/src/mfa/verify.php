<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $code = trim($_POST["code"] ?? "");

    if (!preg_match("/^\d{6}$/", $code)) {
        echo json_encode([
            "error" => true,
            "data" => "Enter a valid 6-digit verification code.",
            "code" => []
        ]);
        exit;
    }

    function base32Decode($input){
        $input = strtoupper(preg_replace("/[^A-Z2-7]/", "", $input));

        $alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        $bits = "";

        for ($i = 0; $i < strlen($input); $i++) {
            $position = strpos($alphabet, $input[$i]);
            if ($position === false) return false;
            $bits .= str_pad(decbin($position), 5, "0", STR_PAD_LEFT);
        }
        $result = "";
        for ($i = 0; $i + 8 <= strlen($bits); $i += 8) $result .= chr(bindec(substr($bits, $i, 8)));
        return $result;
    }

    function verifyTotp($secret, $code){
        $key = base32Decode($secret);

        if ($key === false) return false;
        $time = floor(time() / 30);

        for ($offset = -1; $offset <= 1; $offset++) {

            $counter = $time + $offset;

            $binary_counter = pack("N2",($counter >> 32) & 0xFFFFFFFF,$counter & 0xFFFFFFFF);

            $hash = hash_hmac("sha1", $binary_counter, $key, true);

            $offset_byte = ord($hash[19]) & 0x0F;

            $binary =
                ((ord($hash[$offset_byte]) & 0x7F) << 24) |
                ((ord($hash[$offset_byte + 1]) & 0xFF) << 16) |
                ((ord($hash[$offset_byte + 2]) & 0xFF) << 8) |
                (ord($hash[$offset_byte + 3]) & 0xFF);

            $otp = str_pad((string)($binary % 1000000),6,"0",STR_PAD_LEFT);
            if (hash_equals($otp, $code)) return true;
        }
        return false;
    }

    try {
        $conn->beginTransaction();
        $stmt = $conn->prepare("
            SELECT
                id,
                full_name,
                email,
                account_status,
                mfa_enabled,
                mfa_secret
            FROM users
            WHERE id = :user_id
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->execute([":user_id" => $my_details->id]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "User account not found.",
                "code" => []
            ]);
            exit;
        }

        if ($user["account_status"] !== "active") {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Your account is not active.",
                "code" => []
            ]);
            exit;
        }

        if ((int)$user["mfa_enabled"] === 1) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Two-factor authentication is already enabled.",
                "code" => []
            ]);
            exit;
        }

        if (empty($user["mfa_secret"])) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "MFA setup has expired. Please start setup again.",
                "code" => []
            ]);
            exit;
        }

        if (!$mfa_key) throw new Exception("MFA encryption key is not configured.");
        
        $key = hash("sha256", $mfa_key, true);

        $decoded = base64_decode($user["mfa_secret"], true);

        if ($decoded === false || strlen($decoded) < 17) throw new Exception("Invalid MFA secret.");
        
        $iv = substr($decoded, 0, 16);
        $encrypted_secret = substr($decoded, 16);

        $secret = openssl_decrypt($encrypted_secret,"AES-256-CBC",$key,OPENSSL_RAW_DATA,$iv);

        if (!$secret) throw new Exception("Could not decrypt MFA secret.");

        if (!verifyTotp($secret, $code)) {
            $event_id = generateId();

            $ip_address = $_SERVER["HTTP_X_FORWARDED_FOR"]?? $_SERVER["REMOTE_ADDR"]?? "";

            $device_name = $_SERVER["HTTP_USER_AGENT"] ?? "Unknown device";

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
                    'mfa_failed',
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
                ":detail" => json_encode([
                    "reason" => "Invalid MFA setup verification code"
                ])
            ]);

            $conn->commit();

            echo json_encode([
                "error" => true,
                "data" => "That code is incorrect. Try again.",
                "code" => []
            ]);
            exit;
        }

        $recovery_codes = [];

        for ($i = 0; $i < 8; $i++) {

            $part1 = strtoupper(bin2hex(random_bytes(4)));
            $part2 = strtoupper(bin2hex(random_bytes(4)));

            $recovery_code = $part1 . "-" . $part2;

            $recovery_codes[] = $recovery_code;

            $recovery_id = generateId();
            $recovery_hash = password_hash(
                $recovery_code,
                PASSWORD_DEFAULT
            );

            $stmt = $conn->prepare("
                INSERT INTO mfa_recovery_codes (
                    id,
                    user_id,
                    code_hash
                ) VALUES (
                    :id,
                    :user_id,
                    :code_hash
                )
            ");

            $stmt->execute([
                ":id" => $recovery_id,
                ":user_id" => $user["id"],
                ":code_hash" => $recovery_hash
            ]);
        }

        $stmt = $conn->prepare("UPDATE users SET mfa_enabled = 1 WHERE id = :user_id");

        $stmt->execute([ ":user_id" => $user["id"] ]);

        $event_id = generateId();

        $ip_address =
            $_SERVER["HTTP_X_FORWARDED_FOR"]
            ?? $_SERVER["REMOTE_ADDR"]
            ?? "";

        $device_name =
            $_SERVER["HTTP_USER_AGENT"]
            ?? "Unknown device";

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
                'mfa_enabled',
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
            ":detail" => json_encode([
                "method" => "totp",
                "recovery_codes_generated" => count($recovery_codes)
            ])
        ]);

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Two-factor authentication is now enabled.",
            "code" => [
                "recovery_codes" => $recovery_codes
            ]
        ]);

        exit;

    } catch (Throwable $e) {

        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log("MFA setup verification error: " . $e->getMessage());

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not verify the MFA code.",
            "code" => []
        ]);

        exit;
    }