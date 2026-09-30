<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {

        if ($my_details->account_status !== "active") {
            echo json_encode([
                "error" => true,
                "data" => "Your account is not active.",
                "code" => []
            ]);
            exit;
        }

        if ((int)$my_details->mfa_enabled === 1) {
            echo json_encode([
                "error" => true,
                "data" => "Two-factor authentication is already enabled.",
                "code" => []
            ]);
            exit;
        }

        $secret = "";

        $characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

        for ($i = 0; $i < 32; $i++) {
            $secret .= $characters[random_int(0, strlen($characters) - 1)];
        }

        if (!$mfa_key) {
            throw new Exception("MFA encryption key is not configured.");
        }

        $key = hash("sha256", $mfa_key, true);
        $iv = random_bytes(16);

        $encrypted_secret = openssl_encrypt(
            $secret,
            "AES-256-CBC",
            $key,
            OPENSSL_RAW_DATA,
            $iv
        );

        if ($encrypted_secret === false) {
            throw new Exception("Could not encrypt MFA secret.");
        }

        $stored_secret = base64_encode($iv . $encrypted_secret);

        $stmt = $conn->prepare("
            UPDATE users
            SET mfa_secret = :mfa_secret
            WHERE id = :user_id
        ");

        $stmt->execute([
            ":mfa_secret" => $stored_secret,
            ":user_id" => $my_details->id
        ]);

        $issuer = "TRINU BONDED WAREHOUSE";
        $label = $issuer . ":" . $my_details->email;

        $otpauth_uri =
            "otpauth://totp/" .
            rawurlencode($label) .
            "?secret=" .
            $secret .
            "&issuer=" .
            rawurlencode($issuer) .
            "&algorithm=SHA1&digits=6&period=30";

        echo json_encode([
            "error" => false,
            "data" => "MFA setup initialized.",
            "code" => [
                "otpauth_uri" => $otpauth_uri,
                "secret" => $secret
            ]
        ]);

        exit;

    } catch (Throwable $e) {

        error_log("MFA setup init error: " . $e->getMessage());

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not start MFA setup.",
            "code" => []
        ]);

        exit;
    }