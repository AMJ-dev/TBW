<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed.",
            "code" => null
        ]);
        exit;
    }

    if (!isset($_POST["integrations"], $_POST["credentials"])) {
        
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
            SELECT id, adapter_key, fields, name
            FROM integration_adapters
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
        ");

        $updateAdapter = $conn->prepare("
            UPDATE integration_adapters
            SET enabled = ?,
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
            INSERT INTO activity_logs (
                id,
                actor_id,
                category,
                action,
                entity_type,
                entity_id,
                description,
                new_values,
                metadata,
                severity,
                created_at
            ) VALUES (
                :id,
                :actor_id,
                :category,
                :action,
                :entity_type,
                :entity_id,
                :description,
                :new_values,
                :metadata,
                :severity,
                CURRENT_TIMESTAMP
            )
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

            $qAdapter->execute([$integrationId]);
            $adapter = $qAdapter->fetch(PDO::FETCH_ASSOC);

            if (!$adapter) {
                throw new InvalidArgumentException("Integration not found.");
            }

            $seenIntegrationIds[$integrationId] = true;

            $updateAdapter->execute([
                $enabled,
                $actorId,
                $integrationId
            ]);

            $saveAudit->execute([
                ":id" => generateId(),
                ":actor_id" => $actorId,
                ":category" => "INTEGRATION",
                ":action" => "INTEGRATION_UPDATED",
                ":entity_type" => "INTEGRATION",
                ":entity_id" => $integrationId,
                ":description" => "Integration configuration updated.",
                ":new_values" => json_encode([
                    "enabled" => $enabled
                ], JSON_THROW_ON_ERROR),
                ":metadata" => json_encode([
                    "source_table" => "integration_audit_logs",
                    "integration_id" => $integrationId
                ], JSON_THROW_ON_ERROR),
                ":severity" => "INFO"
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
                    ["email_host", "email_port", "email_password", "sender_email", "email_user"],
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
                ":id" => generateId(),
                ":actor_id" => $actorId,
                ":category" => "INTEGRATION",
                ":action" => "INTEGRATION_CREDENTIAL_UPDATED",
                ":entity_type" => "INTEGRATION",
                ":entity_id" => $integrationId,
                ":description" => "Integration credential updated.",
                ":new_values" => json_encode([
                    "field_key" => $fieldKey,
                    "credential_updated" => true
                ], JSON_THROW_ON_ERROR),
                ":metadata" => json_encode([
                    "source_table" => "integration_audit_logs",
                    "integration_id" => $integrationId,
                    "field_key" => $fieldKey
                ], JSON_THROW_ON_ERROR),
                ":severity" => "INFO"
            ]);
        }

        if (array_key_exists("bank_accounts", $_POST)) {
            $bankAccounts = json_decode((string) $_POST["bank_accounts"], true);

            if (!is_array($bankAccounts) || !array_is_list($bankAccounts)) {
                throw new InvalidArgumentException("Invalid bank accounts payload.");
            }

            $bankReconciliationQuery = $conn->prepare("
                SELECT id
                FROM integration_adapters
                WHERE adapter_key = 'bank_reconciliation'
                   OR LOWER(name) LIKE '%bank reconciliation%'
                ORDER BY CASE WHEN adapter_key = 'bank_reconciliation' THEN 0 ELSE 1 END
                LIMIT 1
                FOR UPDATE
            ");
            $bankReconciliationQuery->execute();
            $bankReconciliation = $bankReconciliationQuery->fetch(PDO::FETCH_ASSOC);

            if (!$bankReconciliation) {
                throw new InvalidArgumentException("Bank Reconciliation integration was not found.");
            }

            $bankIntegrationId = (string) $bankReconciliation["id"];

            if (!isset($seenIntegrationIds[$bankIntegrationId])) {
                throw new InvalidArgumentException(
                    "Bank Reconciliation must be included in the integrations update."
                );
            }

            $normalisedBankAccounts = [];

            foreach ($bankAccounts as $index => $account) {
                if (!is_array($account)) {
                    throw new InvalidArgumentException("Invalid bank account at row " . ($index + 1) . ".");
                }

                $country = strtoupper(trim((string) ($account["country"] ?? $account["countryCode"] ?? "")));
                $country = in_array($country, ["NIGERIA", "NG"], true) ? "NG" :
                    (in_array($country, ["UNITED STATES", "UNITED STATES OF AMERICA", "US", "USA"], true) ? "US" : "");

                $bankName = trim((string) ($account["bankName"] ?? $account["bank_name"] ?? ""));
                $accountName = trim((string) ($account["accountName"] ?? $account["account_name"] ?? ""));
                $accountNumber = preg_replace('/\\s+/', '', (string) ($account["accountNumber"] ?? $account["account_number"] ?? ""));
                $currency = strtoupper(trim((string) ($account["currency"] ?? ($country === "NG" ? "NGN" : "USD"))));
                $swiftCode = strtoupper(trim((string) ($account["swiftCode"] ?? $account["swift_code"] ?? "")));
                $bankCode = trim((string) ($account["bankCode"] ?? $account["bank_code"] ?? ""));
                $routingNumber = preg_replace('/\\s+/', '', (string) ($account["routingNumber"] ?? $account["routing_number"] ?? ""));
                $accountType = strtolower(trim((string) ($account["accountType"] ?? $account["account_type"] ?? "")));

                if ($country === "" || $bankName === "" || $accountName === "" || $accountNumber === "") {
                    throw new InvalidArgumentException("Country, bank name, account name and account number are required for each bank account.");
                }

                if ($country === "NG") {
                    if (!preg_match('/^\\d{10}$/', $accountNumber)) {
                        throw new InvalidArgumentException("Nigerian bank account numbers must contain exactly 10 digits.");
                    }

                    if (!in_array($currency, ["NGN", "USD"], true)) {
                        throw new InvalidArgumentException("Invalid currency for a Nigerian bank account.");
                    }
                }

                if ($country === "US") {
                    if (!preg_match('/^\\d{4,17}$/', $accountNumber)) {
                        throw new InvalidArgumentException("Enter a valid US bank account number.");
                    }

                    if (!preg_match('/^\\d{9}$/', $routingNumber)) {
                        throw new InvalidArgumentException("US bank accounts require a 9-digit ABA routing number.");
                    }

                    if (!in_array($accountType, ["checking", "savings"], true)) {
                        throw new InvalidArgumentException("Select checking or savings for each US bank account.");
                    }

                    if ($currency !== "USD") {
                        throw new InvalidArgumentException("US bank accounts must use USD.");
                    }
                }

                // if ($swiftCode !== "" && !preg_match('/^[A-Z0-9]{8}([A-Z0-9]{3})?$/', $swiftCode)) {
                //     throw new InvalidArgumentException("Enter a valid SWIFT/BIC code.");
                // }

                $normalisedBankAccounts[] = [
                    "id" => trim((string) ($account["id"] ?? generateId())),
                    "country" => $country,
                    "bankName" => $bankName,
                    "accountName" => $accountName,
                    "accountNumber" => $accountNumber,
                    "currency" => $currency,
                    "bankCode" => $bankCode,
                    "swiftCode" => $swiftCode,
                    "branchName" => trim((string) ($account["branchName"] ?? $account["branch_name"] ?? "")),
                    "branchAddress" => trim((string) ($account["branchAddress"] ?? $account["branch_address"] ?? "")),
                    "routingNumber" => $routingNumber,
                    "accountType" => $accountType,
                    "bankAddress" => trim((string) ($account["bankAddress"] ?? $account["bank_address"] ?? "")),
                    "intermediaryBankName" => trim((string) ($account["intermediaryBankName"] ?? $account["intermediary_bank_name"] ?? "")),
                    "intermediarySwiftCode" => strtoupper(trim((string) ($account["intermediarySwiftCode"] ?? $account["intermediary_swift_code"] ?? ""))),
                    "intermediaryBankAddress" => trim((string) ($account["intermediaryBankAddress"] ?? $account["intermediary_bank_address"] ?? ""))
                ];
            }

            $bankAccountsJson = json_encode($normalisedBankAccounts, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
            $bankAccountsIv = random_bytes(12);
            $bankAccountsTag = "";

            $bankAccountsCiphertext = openssl_encrypt(
                $bankAccountsJson,
                "aes-256-gcm",
                $encryptionKey,
                OPENSSL_RAW_DATA,
                $bankAccountsIv,
                $bankAccountsTag
            );

            if ($bankAccountsCiphertext === false || strlen($bankAccountsTag) !== 16) {
                throw new RuntimeException("Could not encrypt bank account details.");
            }

            $saveCredential->execute([
                generateId(),
                $bankIntegrationId,
                "bank_accounts",
                base64_encode($bankAccountsIv . $bankAccountsTag . $bankAccountsCiphertext),
                $actorId
            ]);

            $saveAudit->execute([
                ":id" => generateId(),
                ":actor_id" => $actorId,
                ":category" => "INTEGRATION",
                ":action" => "BANK_ACCOUNTS_UPDATED",
                ":entity_type" => "INTEGRATION",
                ":entity_id" => $bankIntegrationId,
                ":description" => "Bank reconciliation accounts updated.",
                ":new_values" => json_encode([
                    "bank_account_count" => count($normalisedBankAccounts)
                ], JSON_THROW_ON_ERROR),
                ":metadata" => json_encode([
                    "source_table" => "integration_credentials",
                    "integration_id" => $bankIntegrationId,
                    "field_key" => "bank_accounts"
                ], JSON_THROW_ON_ERROR),
                ":severity" => "INFO"
            ]);
        }

        $conn->commit();
        try {
            update_integration_setting($encryptionKey);
        } catch (Throwable $cacheError) {
            error_log("Integration cache refresh failed: " . $cacheError->getMessage());
        }
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

        echo json_encode([
            "error" => true,
            "data" => $isValidationError
                ? $e->getMessage()
                : "Could not save integrations configuration.",
            "code" => null
        ]);
    }
