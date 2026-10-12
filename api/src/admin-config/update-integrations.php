
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Cache-Control: no-store, private");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed.",
        "code" => null
    ]);
    exit;
}

if (!isset($_POST["integrations"], $_POST["credentials"])) {
    http_response_code(422);
    echo json_encode([
        "error" => true,
        "data" => "Integrations and credentials are required.",
        "code" => null
    ]);
    exit;
}

$integrations = json_decode($_POST["integrations"], true);
$credentials = json_decode($_POST["credentials"], true);

if (
    !is_array($integrations) ||
    !array_is_list($integrations) ||
    !is_array($credentials) ||
    ($credentials !== [] && array_is_list($credentials))
) {
    http_response_code(422);
    echo json_encode([
        "error" => true,
        "data" => "Invalid integrations or credentials payload.",
        "code" => null
    ]);
    exit;
}

if (
    !isset($my_details->id) ||
    !is_string($my_details->id) ||
    $my_details->id === ""
) {
    http_response_code(401);
    echo json_encode([
        "error" => true,
        "data" => "Unable to identify the current user.",
        "code" => null
    ]);
    exit;
}

$actorId = $my_details->id;
$encryptionKey = false;

if (isset($INTEGRATION_ENCRYPTION_KEY) && is_string($INTEGRATION_ENCRYPTION_KEY)) {
    $decodedKey = base64_decode($INTEGRATION_ENCRYPTION_KEY, true);

    if ($decodedKey !== false && strlen($decodedKey) === 32) {
        $encryptionKey = $decodedKey;
    } elseif (strlen($INTEGRATION_ENCRYPTION_KEY) === 32) {
        $encryptionKey = $INTEGRATION_ENCRYPTION_KEY;
    }
}

if (!is_string($encryptionKey) || strlen($encryptionKey) !== 32) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Integration encryption key is missing or invalid.",
        "code" => null
    ]);
    exit;
}

try {
    $conn->beginTransaction();

    $qAdapter = $conn->prepare("
        SELECT id, adapter_key, fields
        FROM integration_adapters
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
    ");

    $updateAdapter = $conn->prepare("
        UPDATE integration_adapters
        SET enabled = ?,
            environment = ?,
            updated_by = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ");

    $saveCredential = $conn->prepare("
        INSERT INTO integration_credentials
            (id, integration_id, field_key, encrypted_value, updated_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
            encrypted_value = VALUES(encrypted_value),
            updated_by = VALUES(updated_by),
            updated_at = CURRENT_TIMESTAMP
    ");

    $saveAudit = $conn->prepare("
        INSERT INTO integration_audit_logs
            (id, actor_id, action, integration_id, details, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ");

    $seenIntegrationIds = [];

    foreach ($integrations as $integration) {
        if (
            !is_array($integration) ||
            !isset($integration["id"]) ||
            !is_string($integration["id"]) ||
            $integration["id"] === ""
        ) {
            throw new InvalidArgumentException("An integration has an invalid ID.");
        }

        $integrationId = $integration["id"];

        if (isset($seenIntegrationIds[$integrationId])) {
            throw new InvalidArgumentException("Duplicate integration ID supplied.");
        }

        if (
            !array_key_exists("enabled", $integration) ||
            !in_array(
                $integration["enabled"],
                [true, false, 0, 1, "0", "1", "true", "false"],
                true
            )
        ) {
            throw new InvalidArgumentException("Invalid enabled value.");
        }

        $enabled = in_array(
            $integration["enabled"],
            [true, 1, "1", "true"],
            true
        ) ? 1 : 0;

        $environment = $integration["environment"] ?? "";

        if (!in_array($environment, ["sandbox", "production"], true)) {
            throw new InvalidArgumentException("Invalid integration environment.");
        }

        $qAdapter->execute([$integrationId]);
        $adapter = $qAdapter->fetch(PDO::FETCH_ASSOC);

        if (!$adapter) {
            throw new InvalidArgumentException("Integration not found.");
        }

        $seenIntegrationIds[$integrationId] = true;

        $updateAdapter->execute([
            $enabled,
            $environment,
            $actorId,
            $integrationId
        ]);

        $saveAudit->execute([
            generateId(),
            $actorId,
            "integration_updated",
            $integrationId,
            json_encode([
                "enabled" => $enabled,
                "environment" => $environment
            ], JSON_THROW_ON_ERROR)
        ]);
    }

    foreach ($credentials as $credentialKey => $credentialValue) {
        if (!is_string($credentialKey) || !is_string($credentialValue)) {
            throw new InvalidArgumentException("Invalid credential entry.");
        }

        if ($credentialValue === "") {
            continue;
        }

        $separatorPosition = strpos($credentialKey, ".");

        if ($separatorPosition === false) {
            throw new InvalidArgumentException("Invalid credential field key.");
        }

        $integrationId = substr($credentialKey, 0, $separatorPosition);
        $fieldKey = substr($credentialKey, $separatorPosition + 1);

        if (
            $integrationId === "" ||
            $fieldKey === "" ||
            !isset($seenIntegrationIds[$integrationId])
        ) {
            throw new InvalidArgumentException(
                "Credential references an integration that was not submitted."
            );
        }

        $qAdapter->execute([$integrationId]);
        $adapter = $qAdapter->fetch(PDO::FETCH_ASSOC);

        if (!$adapter) {
            throw new InvalidArgumentException("Integration not found for credential.");
        }

        $fieldDefinitions = json_decode($adapter["fields"] ?? "[]", true);
        $fieldFound = false;

        if (($adapter["adapter_key"] ?? "") === "email_provider") {
            $fieldFound = in_array(
                $fieldKey,
                ["email_host", "email_port", "email_password", "sender_email"],
                true
            );
        }

        if (!$fieldFound && is_array($fieldDefinitions)) {
            foreach ($fieldDefinitions as $fieldDefinition) {
                if (
                    is_array($fieldDefinition) &&
                    ($fieldDefinition["key"] ?? null) === $fieldKey
                ) {
                    $fieldFound = true;
                    break;
                }
            }
        }

        if (!$fieldFound) {
            throw new InvalidArgumentException(
                "Unknown credential field: " . $fieldKey . "."
            );
        }

        if ($fieldKey === "email_host" && trim($credentialValue) === "") {
            throw new InvalidArgumentException("Email host is required.");
        }

        if ($fieldKey === "email_port") {
            if (
                !ctype_digit($credentialValue) ||
                (int) $credentialValue < 1 ||
                (int) $credentialValue > 65535
            ) {
                throw new InvalidArgumentException(
                    "Email port must be between 1 and 65535."
                );
            }
        }

        if (
            $fieldKey === "sender_email" &&
            filter_var($credentialValue, FILTER_VALIDATE_EMAIL) === false
        ) {
            throw new InvalidArgumentException(
                "Enter a valid sender email address."
            );
        }

        $iv = random_bytes(12);
        $tag = "";

        $ciphertext = openssl_encrypt(
            $credentialValue,
            "aes-256-gcm",
            $encryptionKey,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        if ($ciphertext === false || strlen($tag) !== 16) {
            throw new RuntimeException(
                "Could not encrypt an integration credential."
            );
        }

        $encryptedValue = base64_encode($iv . $tag . $ciphertext);

        $saveCredential->execute([
            generateId(),
            $integrationId,
            $fieldKey,
            $encryptedValue,
            $actorId
        ]);

        $saveAudit->execute([
            generateId(),
            $actorId,
            "credential_updated",
            $integrationId,
            json_encode([
                "field_key" => $fieldKey,
                "credential_updated" => true
            ], JSON_THROW_ON_ERROR)
        ]);
    }

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => true,
        "code" => [
            "message" => "Integrations configuration saved successfully."
        ]
    ]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    $isValidationError = $e instanceof InvalidArgumentException;

    http_response_code($isValidationError ? 422 : 500);

    echo json_encode([
        "error" => true,
        "data" => $isValidationError
            ? $e->getMessage()
            : "Could not save integrations configuration.",
        "code" => null
    ]);
}
