<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

try {
    $q = $conn->prepare("
        SELECT id, numbering_prefix, numbering_format, retention_months
        FROM document_config_versions
        WHERE is_current = 1
        ORDER BY created_at DESC
        LIMIT 1
    ");
    $q->execute();
    $configuration = $q->fetch(PDO::FETCH_ASSOC);

    $documentTypes = [];

    if ($configuration) {
        $q = $conn->prepare("
            SELECT id, document_key AS `key`, label
            FROM document_types
            WHERE config_version_id = :config_id
            ORDER BY sort_order ASC, label ASC
        ");
        $q->execute([":config_id" => $configuration["id"]]);
        $documentTypes = $q->fetchAll(PDO::FETCH_ASSOC);
    }

    $q = $conn->prepare("
        SELECT
            id,
            location_key AS `key`,
            label,
            description,
            required,
            allow_multiple
        FROM document_upload_locations
        WHERE is_active = 1
        ORDER BY sort_order ASC, label ASC
    ");
    $q->execute();
    $locations = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT
            location_id,
            document_key,
            is_required,
            allow_multiple
        FROM document_upload_location_types
    ");
    $q->execute();
    $mappings = $q->fetchAll(PDO::FETCH_ASSOC);

    $rulesByLocation = [];

    foreach ($mappings as $mapping) {
        $locationId = $mapping["location_id"];

        if (!isset($rulesByLocation[$locationId])) {
            $rulesByLocation[$locationId] = [];
        }

        $rulesByLocation[$locationId][] = [
            "document_key" => (string)$mapping["document_key"],
            "is_required" => (int)$mapping["is_required"] === 1,
            "allow_multiple" => (int)$mapping["allow_multiple"] === 1,
        ];
    }

    foreach ($locations as &$location) {
        $locationId = $location["id"];

        $location["required"] = (bool)$location["required"];
        $location["allow_multiple"] = (bool)$location["allow_multiple"];
        $location["is_active"] = true;

        $rules = $rulesByLocation[$locationId] ?? [];

        $location["document_settings"] = $rules;
        $location["documentSettings"] = $rules;
        $location["document_type_keys"] = array_map(
            static fn ($rule) => $rule["document_key"],
            $rules
        );
        $location["documentTypeKeys"] = $location["document_type_keys"];
    }
    unset($location);

    echo json_encode([
        "error" => false,
        "data" => "Documents configuration loaded successfully.",
        "code" => [
            "id" => $configuration["id"] ?? null,
            "numbering_prefix" => $configuration["numbering_prefix"] ?? "TRN",
            "numbering_format" => $configuration["numbering_format"] ?? "TRN-{TYPE}-{YYYY}-{SEQ:6}",
            "retention_months" => (int)($configuration["retention_months"] ?? 84),
            "document_types" => $documentTypes,
            "upload_locations" => $locations,
            "uploadLocations" => $locations,
        ],
    ]);
} catch (Throwable $e) {
    error_log("Documents configuration load error: " . $e->getMessage());

    echo json_encode([
        "error" => true,
        "data" => "Unable to load documents configuration.",
        "code" => null,
    ]);
}