<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    header("Cache-Control: no-store, private");

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);
        echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
        exit;
    }

    $settingsFields = [
        "correlation_id_logging",
        "dead_letter_queue_enabled",
        "circuit_breaker_enabled",
        "schema_validation_required",
        "manual_fallback_required"
    ];

    $settings = [];

    foreach ($settingsFields as $field) {
        if (!isset($_POST[$field]) && !array_key_exists($field, $_POST)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "Missing setting: " . $field, "code" => null]);
            exit;
        }

        $value = $_POST[$field];

        if (!in_array($value, ["0", "1", 0, 1, true, false, "true", "false"], true)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "Invalid setting: " . $field, "code" => null]);
            exit;
        }

        $settings[$field] = in_array($value, ["1", 1, true, "true"], true) ? 1 : 0;
    }

    if (!isset($_POST["retry_backoff_seconds"]) || filter_var($_POST["retry_backoff_seconds"], FILTER_VALIDATE_INT) === false) {
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "Invalid retry backoff.", "code" => null]);
        exit;
    }

    $retryBackoffSeconds = (int) $_POST["retry_backoff_seconds"];

    if ($retryBackoffSeconds < 1 || $retryBackoffSeconds > 3600) {
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "Retry backoff must be between 1 and 3600 seconds.", "code" => null]);
        exit;
    }

    if (!isset($_POST["integrations"], $_POST["credentials"])) {
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "Integrations and credentials are required.", "code" => null]);
        exit;
    }

    $integrations = json_decode($_POST["integrations"], true);
    $credentials = json_decode($_POST["credentials"], true);

    if (!is_array($integrations) || !array_is_list($integrations) || !is_array($credentials) || ($credentials !== [] && array_is_list($credentials))) {
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "Invalid integrations or credentials payload.", "code" => null]);
        exit;
    }

    if (!isset($my_details->id) || !is_string($my_details->id) || $my_details->id === "") {
        http_response_code(401);
        echo json_encode(["error" => true, "data" => "Unable to identify the current user.", "code" => null]);
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
        echo json_encode(["error" => true, "data" => "Integration encryption key is missing or invalid.", "code" => null]);
        exit;
    }

    try {
        $conn->beginTransaction();

        $q = $conn->prepare("SELECT id FROM integration_settings LIMIT 1 FOR UPDATE");
        $q->execute();
        $settingsRow = $q->fetch(PDO::FETCH_ASSOC);

        if ($settingsRow) {
            $settingsId = $settingsRow["id"];

            $q = $conn->prepare("UPDATE integration_settings SET correlation_id_logging = ?, dead_letter_queue_enabled = ?, circuit_breaker_enabled = ?, schema_validation_required = ?, manual_fallback_required = ?, retry_backoff_seconds = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $q->execute([
                $settings["correlation_id_logging"],
                $settings["dead_letter_queue_enabled"],
                $settings["circuit_breaker_enabled"],
                $settings["schema_validation_required"],
                $settings["manual_fallback_required"],
                $retryBackoffSeconds,
                $actorId,
                $settingsId
            ]);
        } else {
            $settingsId = generateId();

            $q = $conn->prepare("INSERT INTO integration_settings (id, correlation_id_logging, dead_letter_queue_enabled, circuit_breaker_enabled, schema_validation_required, manual_fallback_required, retry_backoff_seconds, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            $q->execute([
                $settingsId,
                $settings["correlation_id_logging"],
                $settings["dead_letter_queue_enabled"],
                $settings["circuit_breaker_enabled"],
                $settings["schema_validation_required"],
                $settings["manual_fallback_required"],
                $retryBackoffSeconds,
                $actorId
            ]);
        }

        $qAdapter = $conn->prepare("SELECT id, fields FROM integration_adapters WHERE id = ? LIMIT 1 FOR UPDATE");
        $updateAdapter = $conn->prepare("UPDATE integration_adapters SET enabled = ?, environment = ?, retry_count = ?, timeout_seconds = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $saveCredential = $conn->prepare("INSERT INTO integration_credentials (id, integration_id, field_key, encrypted_value, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE encrypted_value = VALUES(encrypted_value), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP");
        $saveAudit = $conn->prepare("INSERT INTO integration_audit_logs (id, actor_id, action, integration_id, details, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)");

        $seenIntegrationIds = [];

        foreach ($integrations as $integration) {
            if (!is_array($integration) || !isset($integration["id"]) || !is_string($integration["id"]) || $integration["id"] === "") {
                throw new InvalidArgumentException("An integration has an invalid ID.");
            }

            $integrationId = $integration["id"];

            if (isset($seenIntegrationIds[$integrationId])) {
                throw new InvalidArgumentException("Duplicate integration ID supplied.");
            }

            if (!array_key_exists("enabled", $integration) || !in_array($integration["enabled"], [true, false, 0, 1, "0", "1", "true", "false"], true)) {
                throw new InvalidArgumentException("Invalid enabled value for integration " . $integrationId . ".");
            }

            $enabled = in_array($integration["enabled"], [true, 1, "1", "true"], true) ? 1 : 0;
            $environment = $integration["environment"] ?? "";
            $retryCount = filter_var($integration["retry_count"] ?? null, FILTER_VALIDATE_INT);
            $timeoutSeconds = filter_var($integration["timeout_seconds"] ?? null, FILTER_VALIDATE_INT);

            if (!in_array($environment, ["sandbox", "production"], true)) {
                throw new InvalidArgumentException("Invalid environment for integration " . $integrationId . ".");
            }

            if ($retryCount === false || $retryCount < 0 || $retryCount > 10) {
                throw new InvalidArgumentException("Retry count must be between 0 and 10.");
            }

            if ($timeoutSeconds === false || $timeoutSeconds < 1 || $timeoutSeconds > 300) {
                throw new InvalidArgumentException("Timeout must be between 1 and 300 seconds.");
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
                $retryCount,
                $timeoutSeconds,
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
                    "environment" => $environment,
                    "retry_count" => $retryCount,
                    "timeout_seconds" => $timeoutSeconds
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

            if ($integrationId === "" || $fieldKey === "" || !isset($seenIntegrationIds[$integrationId])) {
                throw new InvalidArgumentException("Credential references an integration that was not submitted.");
            }

            $qAdapter->execute([$integrationId]);
            $adapter = $qAdapter->fetch(PDO::FETCH_ASSOC);

            if (!$adapter) {
                throw new InvalidArgumentException("Integration not found for credential.");
            }

            $fieldDefinitions = json_decode($adapter["fields"], true);
            $fieldFound = false;

            if (is_array($fieldDefinitions)) {
                foreach ($fieldDefinitions as $fieldDefinition) {
                    if (is_array($fieldDefinition) && ($fieldDefinition["key"] ?? null) === $fieldKey) {
                        $fieldFound = true;
                        break;
                    }
                }
            }

            if (!$fieldFound) {
                throw new InvalidArgumentException("Unknown credential field: " . $fieldKey . ".");
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
                throw new RuntimeException("Could not encrypt an integration credential.");
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
                json_encode(["field_key" => $fieldKey, "credential_updated" => true], JSON_THROW_ON_ERROR)
            ]);
        }

        $saveAudit->execute([
            generateId(),
            $actorId,
            "integration_settings_updated",
            null,
            json_encode([
                "correlation_id_logging" => $settings["correlation_id_logging"],
                "dead_letter_queue_enabled" => $settings["dead_letter_queue_enabled"],
                "circuit_breaker_enabled" => $settings["circuit_breaker_enabled"],
                "schema_validation_required" => $settings["schema_validation_required"],
                "manual_fallback_required" => $settings["manual_fallback_required"],
                "retry_backoff_seconds" => $retryBackoffSeconds
            ], JSON_THROW_ON_ERROR)
        ]);

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => true,
            "code" => ["message" => "Integrations configuration saved successfully."]
        ]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        $isValidationError = $e instanceof InvalidArgumentException;
        http_response_code($isValidationError ? 422 : 500);

        echo json_encode([
            "error" => true,
            "data" => $isValidationError ? $e->getMessage() : "Could not save integrations configuration.",
            "code" => null
        ]);
    }