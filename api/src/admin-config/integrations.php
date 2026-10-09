<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Cache-Control: no-store, private");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
    exit;
}

try {
    $q = $conn->prepare("SELECT correlation_id_logging, dead_letter_queue_enabled, circuit_breaker_enabled, schema_validation_required, manual_fallback_required, retry_backoff_seconds FROM integration_settings ORDER BY created_at ASC LIMIT 1");
    $q->execute();
    $settings = $q->fetch(PDO::FETCH_ASSOC);

    if (!$settings) {
        $settings = [
            "correlation_id_logging" => 1,
            "dead_letter_queue_enabled" => 1,
            "circuit_breaker_enabled" => 1,
            "schema_validation_required" => 1,
            "manual_fallback_required" => 1,
            "retry_backoff_seconds" => 30
        ];
    }

    $q = $conn->prepare("SELECT id, name, description, category, icon, enabled, environment, retry_count, timeout_seconds, fields FROM integration_adapters ORDER BY name ASC");
    $q->execute();
    $rows = $q->fetchAll(PDO::FETCH_ASSOC);

    $integrations = [];

    foreach ($rows as $row) {
        $fields = json_decode($row["fields"] ?? "[]", true);

        if (!is_array($fields)) {
            $fields = [];
        }

        $normalisedFields = [];

        foreach ($fields as $field) {
            if (!is_array($field)) {
                continue;
            }

            $normalisedFields[] = [
                "key" => (string) ($field["key"] ?? ""),
                "label" => (string) ($field["label"] ?? $field["name"] ?? ""),
                "placeholder" => (string) ($field["placeholder"] ?? ""),
                "kind" => (string) ($field["kind"] ?? "text"),
                "required" => filter_var($field["required"] ?? false, FILTER_VALIDATE_BOOLEAN),
                "secret" => filter_var($field["secret"] ?? (($field["kind"] ?? "") === "password"), FILTER_VALIDATE_BOOLEAN)
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
            "retry_count" => (int) ($row["retry_count"] ?? 3),
            "timeout_seconds" => (int) ($row["timeout_seconds"] ?? 30),
            "fields" => $normalisedFields
        ];
    }

    echo json_encode([
        "error" => false,
        "data" => true,
        "code" => [
            "correlation_id_logging" => (bool) $settings["correlation_id_logging"],
            "dead_letter_queue_enabled" => (bool) $settings["dead_letter_queue_enabled"],
            "circuit_breaker_enabled" => (bool) $settings["circuit_breaker_enabled"],
            "schema_validation_required" => (bool) $settings["schema_validation_required"],
            "manual_fallback_required" => (bool) $settings["manual_fallback_required"],
            "retry_backoff_seconds" => (int) $settings["retry_backoff_seconds"],
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