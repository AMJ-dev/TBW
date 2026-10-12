<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Cache-Control: no-store, private");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed.",
        "code" => null
    ]);
    exit;
}

try {
    $q = $conn->prepare("
        SELECT
            id,
            name,
            description,
            category,
            icon,
            enabled,
            environment,
            fields
        FROM integration_adapters
        ORDER BY name ASC
    ");
    $q->execute();
    $rows = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT integration_id, field_key, encrypted_value
        FROM integration_credentials
    ");
    $q->execute();
    $credentialRows = $q->fetchAll(PDO::FETCH_ASSOC);

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
        throw new RuntimeException("Integration encryption key is missing or invalid.");
    }

    $savedCredentials = [];

    foreach ($credentialRows as $credential) {
        $encryptedValue = base64_decode(
            (string) $credential["encrypted_value"],
            true
        );

        if ($encryptedValue === false || strlen($encryptedValue) < 29) {
            continue;
        }

        $iv = substr($encryptedValue, 0, 12);
        $tag = substr($encryptedValue, 12, 16);
        $ciphertext = substr($encryptedValue, 28);

        $value = openssl_decrypt(
            $ciphertext,
            "aes-256-gcm",
            $encryptionKey,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        if ($value === false) {
            continue;
        }

        $integrationId = (string) $credential["integration_id"];
        $fieldKey = (string) $credential["field_key"];

        $savedCredentials[$integrationId][$fieldKey] = $value;
    }

    $integrations = [];

    foreach ($rows as $row) {
        $fields = json_decode($row["fields"] ?? "[]", true);

        if (!is_array($fields)) {
            $fields = [];
        }

        $normalisedFields = [];
        $seenFieldKeys = [];

        foreach ($fields as $field) {
            if (!is_array($field)) {
                continue;
            }

            $key = trim((string) ($field["key"] ?? ""));
            $label = trim((string) ($field["label"] ?? $field["name"] ?? ""));

            if ($key === "" || $label === "") {
                continue;
            }

            $normalisedKey = strtolower(
                preg_replace("/[^a-z0-9]/i", "", $key)
            );

            $normalisedLabel = strtolower($label);

            if (
                str_contains($normalisedKey, "apikey") ||
                str_contains($normalisedKey, "apisecret") ||
                str_contains($normalisedKey, "secretkey") ||
                str_contains($normalisedKey, "maxretries") ||
                str_contains($normalisedKey, "retrycount") ||
                str_contains($normalisedKey, "timeout") ||
                str_contains($normalisedLabel, "api key") ||
                str_contains($normalisedLabel, "api secret") ||
                str_contains($normalisedLabel, "maximum retries") ||
                str_contains($normalisedLabel, "retry count") ||
                str_contains($normalisedLabel, "timeout")
            ) {
                continue;
            }

            if (isset($seenFieldKeys[$key])) {
                continue;
            }

            $seenFieldKeys[$key] = true;

            $kind = (string) ($field["kind"] ?? "text");

            if (!in_array($kind, ["text", "password", "email", "url", "number"], true)) {
                $kind = "text";
            }

            $isSecret = filter_var(
                $field["secret"] ?? ($kind === "password"),
                FILTER_VALIDATE_BOOLEAN
            );

            $credential = $savedCredentials[(string) $row["id"]][$key] ?? null;
            $value = $savedCredentials[(string) $row["id"]][$key] ?? "";
            $normalisedFields[] = [
                "key" => $key,
                "label" => $label,
                "placeholder" => (string) ($field["placeholder"] ?? ""),
                "kind" => $kind,
                "required" => filter_var(
                    $field["required"] ?? false,
                    FILTER_VALIDATE_BOOLEAN
                ),
                "secret" => $isSecret,
                "configured" => (bool) ($credential["configured"] ?? false),
                "value" => $value
            ];
        }

        $integrations[] = [
            "id" => (string) $row["id"],
            "name" => (string) ($row["name"] ?? ""),
            "description" => (string) ($row["description"] ?? ""),
            "category" => (string) ($row["category"] ?? ""),
            "icon" => (string) ($row["icon"] ?? "Webhook"),
            "enabled" => (bool) $row["enabled"],
            "environment" => (string) ($row["environment"] ?? "sandbox"),
            "fields" => $normalisedFields
        ];
    }

    echo json_encode([
        "error" => false,
        "data" => true,
        "code" => [
            "integrations" => $integrations
        ]
    ]);
} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Could not load integrations configuration.",
        "code" => null
    ]);
}