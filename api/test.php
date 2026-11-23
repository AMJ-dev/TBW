<?php
    require_once __DIR__ . "/include/conn.php";
    $smtp = [
        "email_host" => "mail.tbw.ng",
        "email_port" => 587,
        "email_user" => "api@tbw.ng",
        "email_password" => "Group2026@",
    ];
    
    try {
        $encryptionKey = false;

        if (isset($INTEGRATION_ENCRYPTION_KEY) && is_string($INTEGRATION_ENCRYPTION_KEY)) {
            $decodedKey = base64_decode($INTEGRATION_ENCRYPTION_KEY, true);

            if ($decodedKey !== false && strlen($decodedKey) === 32) {
                $encryptionKey = $decodedKey;
            } elseif (strlen($INTEGRATION_ENCRYPTION_KEY) === 32) {
                $encryptionKey = $INTEGRATION_ENCRYPTION_KEY;
            }
        }

        if ($encryptionKey === false) {
            throw new RuntimeException("Invalid integration encryption key.");
        }

        $save = $conn->prepare("
            UPDATE integration_credentials
            SET encrypted_value = :encrypted_value
            WHERE field_key = :field_key
        ");

        $conn->beginTransaction();

        foreach ($smtp as $key => $value) {
            $iv = random_bytes(12);
            $tag = "";

            $ciphertext = openssl_encrypt(
                (string) $value,
                "aes-256-gcm",
                $encryptionKey,
                OPENSSL_RAW_DATA,
                $iv,
                $tag
            );

            if ($ciphertext === false) {
                throw new RuntimeException("Encryption failed for {$key}.");
            }

            $encryptedValue = base64_encode($iv . $tag . $ciphertext);

            $save->execute([
                ":encrypted_value" => $encryptedValue,
                ":field_key" => $key
            ]);

            if ($save->rowCount() === 0) {
                throw new RuntimeException("No credential record updated for {$key}.");
            }
        }

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "SMTP credentials encrypted successfully.",
            "code" => null
        ]);

    } catch (Throwable $th) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log("SMTP credential encryption error: " . $th->getMessage());

        echo json_encode([
            "error" => true,
            "data" => "Could not encrypt SMTP credentials.",
            "code" => null
        ]);
    }