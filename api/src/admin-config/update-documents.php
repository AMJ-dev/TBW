
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

try {
    $prefix = trim($_POST["numbering_prefix"] ?? "TRN");
    $format = trim($_POST["numbering_format"] ?? "TRN-{TYPE}-{YYYY}-{SEQ:6}");
    $retention = filter_var(
        $_POST["retention_months"] ?? 84,
        FILTER_VALIDATE_INT
    );

    $documentTypes = json_decode($_POST["document_types"] ?? "[]", true);
    $uploadLocations = json_decode($_POST["upload_locations"] ?? "[]", true);

    if ($prefix === "" || strlen($prefix) > 20) {
        throw new RuntimeException("Enter a valid numbering prefix.");
    }

    if ($format === "" || strlen($format) > 150) {
        throw new RuntimeException("Enter a valid numbering format.");
    }

    if ($retention === false || $retention < 1 || $retention > 1200) {
        throw new RuntimeException("Enter a valid retention period.");
    }

    if (!is_array($documentTypes) || !is_array($uploadLocations)) {
        throw new RuntimeException("Invalid document configuration data.");
    }

    $normalisedTypes = [];
    $seenKeys = [];

    foreach ($documentTypes as $type) {
        $label = trim($type["label"] ?? "");
        $key = trim($type["key"] ?? "");
        $id = trim($type["id"] ?? "");

        if ($label === "" || strlen($label) > 150) {
            throw new RuntimeException("Every document type must have a valid name.");
        }

        if (!preg_match('/^[a-z][a-z0-9_]*$/', $key)) {
            throw new RuntimeException("A document type has an invalid generated key.");
        }

        if (isset($seenKeys[$key])) {
            throw new RuntimeException("Document type keys must be unique.");
        }

        $seenKeys[$key] = true;

        $normalisedTypes[] = [
            "id" => $id,
            "key" => $key,
            "label" => $label
        ];
    }

    $q = $conn->prepare("
        SELECT id, location_key
        FROM document_upload_locations
        ORDER BY sort_order ASC
    ");
    $q->execute();
    $databaseLocations = $q->fetchAll(PDO::FETCH_ASSOC);

    $locationIds = [];
    $locationsByKey = [];

    foreach ($databaseLocations as $location) {
        $locationIds[$location["id"]] = $location;
        $locationsByKey[$location["location_key"]] = $location;
    }

    $normalisedLocations = [];
    $submittedLocations = [];

    foreach ($uploadLocations as $location) {
        $key = trim($location["key"] ?? "");

        if ($key === "" || !isset($locationsByKey[$key])) {
            throw new RuntimeException("An upload location is invalid.");
        }

        if (isset($submittedLocations[$key])) {
            throw new RuntimeException("An upload location was submitted more than once.");
        }

        $submittedLocations[$key] = true;
        $documentSettings = $location["document_settings"] ?? [];

        if (!is_array($documentSettings)) {
            throw new RuntimeException("Invalid document settings for an upload location.");
        }

        $settingsByKey = [];

        foreach ($documentSettings as $setting) {
            $documentKey = trim($setting["document_key"] ?? "");

            if ($documentKey === "" || !isset($seenKeys[$documentKey])) {
                throw new RuntimeException("A location references an unknown document type.");
            }

            if (isset($settingsByKey[$documentKey])) {
                throw new RuntimeException("A document type was duplicated in an upload location.");
            }

            $settingsByKey[$documentKey] = [
                "is_required" => !empty($setting["is_required"]) ? 1 : 0,
                "allow_multiple" => !empty($setting["allow_multiple"]) ? 1 : 0
            ];
        }

        $normalisedLocations[$key] = $settingsByKey;
    }

    foreach ($locationsByKey as $key => $location) {
        if (!isset($submittedLocations[$key])) {
            throw new RuntimeException("Submit all configured upload locations. Missing: " . $key);
        }
    }

    $conn->beginTransaction();

    $q = $conn->prepare("
        SELECT id, version_no, numbering_prefix, numbering_format, retention_months
        FROM document_config_versions
        WHERE is_current = 1
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
    ");
    $q->execute();
    $current = $q->fetch(PDO::FETCH_ASSOC);

    if ($current) {
        $configId = $current["id"];
        $versionNo = (int) $current["version_no"];

        $before = [
            "numbering_prefix" => $current["numbering_prefix"],
            "numbering_format" => $current["numbering_format"],
            "retention_months" => (int) $current["retention_months"]
        ];

        $q = $conn->prepare("
            SELECT document_key AS `key`, label
            FROM document_types
            WHERE config_version_id = :config_version_id
            ORDER BY sort_order ASC, label ASC
        ");
        $q->execute([
            ":config_version_id" => $configId
        ]);
        $before["document_types"] = $q->fetchAll(PDO::FETCH_ASSOC);

        $q = $conn->prepare("
            SELECT l.location_key, m.document_key,
                   m.is_required, m.allow_multiple
            FROM document_upload_location_types m
            INNER JOIN document_upload_locations l ON l.id = m.location_id
        ");
        $q->execute();
        $before["document_settings"] = $q->fetchAll(PDO::FETCH_ASSOC);

        $q = $conn->prepare("
            UPDATE document_config_versions
            SET numbering_prefix = :prefix,
                numbering_format = :format,
                retention_months = :retention,
                change_reason = :change_reason,
                created_by = :created_by
            WHERE id = :id
        ");
        $q->execute([
            ":prefix" => $prefix,
            ":format" => $format,
            ":retention" => $retention,
            ":change_reason" => trim($_POST["change_reason"] ?? "Document configuration updated"),
            ":created_by" => $my_details->id,
            ":id" => $configId
        ]);
    } else {
        $configId = generateId();
        $versionNo = 1;

        $before = [
            "document_types" => [],
            "document_settings" => []
        ];

        $q = $conn->prepare("
            INSERT INTO document_config_versions
                (id, version_no, is_current, numbering_prefix,
                 numbering_format, retention_months, change_reason, created_by)
            VALUES
                (:id, :version_no, 1, :prefix, :format, :retention,
                 :change_reason, :created_by)
        ");
        $q->execute([
            ":id" => $configId,
            ":version_no" => $versionNo,
            ":prefix" => $prefix,
            ":format" => $format,
            ":retention" => $retention,
            ":change_reason" => trim($_POST["change_reason"] ?? "Initial document configuration"),
            ":created_by" => $my_details->id
        ]);
    }

    $q = $conn->prepare("
        DELETE FROM document_types
        WHERE config_version_id = :config_version_id
    ");
    $q->execute([
        ":config_version_id" => $configId
    ]);

    $q = $conn->prepare("
        INSERT INTO document_types
            (id, config_version_id, document_key, label, sort_order)
        VALUES
            (:id, :config_version_id, :document_key, :label, :sort_order)
    ");

    foreach ($normalisedTypes as $index => $type) {
        $q->execute([
            ":id" => generateId(),
            ":config_version_id" => $configId,
            ":document_key" => $type["key"],
            ":label" => $type["label"],
            ":sort_order" => $index + 1
        ]);
    }

    $q = $conn->prepare("DELETE FROM document_upload_location_types");
    $q->execute();

    $q = $conn->prepare("
        INSERT INTO document_upload_location_types
            (id, location_id, document_key, is_required, allow_multiple)
        VALUES
            (:id, :location_id, :document_key, :is_required, :allow_multiple)
    ");

    foreach ($normalisedLocations as $locationKey => $settings) {
        $locationId = $locationsByKey[$locationKey]["id"];

        foreach ($settings as $documentKey => $rule) {
            $q->execute([
                ":id" => generateId(),
                ":location_id" => $locationId,
                ":document_key" => $documentKey,
                ":is_required" => $rule["is_required"],
                ":allow_multiple" => $rule["allow_multiple"]
            ]);
        }
    }

    $after = [
        "numbering_prefix" => $prefix,
        "numbering_format" => $format,
        "retention_months" => $retention,
        "document_types" => $normalisedTypes,
        "document_settings" => $normalisedLocations
    ];

    $requestId = vsprintf(
        "%s%s-%s-%s-%s-%s%s%s",
        str_split(bin2hex(random_bytes(16)), 4)
    );

    $q = $conn->prepare("
        INSERT INTO document_config_audit
            (id, config_version_id, actor_id, action, change_reason,
             before_json, after_json, request_id, ip_address, user_agent, details)
        VALUES
            (:id, :config_version_id, :actor_id, :action, :change_reason,
             :before_json, :after_json, :request_id, :ip_address, :user_agent, :details)
    ");

    $q->execute([
        ":id" => generateId(),
        ":config_version_id" => $configId,
        ":actor_id" => $my_details->id,
        ":action" => "update",
        ":change_reason" => trim($_POST["change_reason"] ?? "Document configuration updated"),
        ":before_json" => json_encode($before),
        ":after_json" => json_encode($after),
        ":request_id" => $requestId,
        ":ip_address" => $_SERVER["REMOTE_ADDR"] ?? "",
        ":user_agent" => substr($_SERVER["HTTP_USER_AGENT"] ?? "", 0, 500),
        ":details" => "Document types and upload location rules updated"
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Documents configuration saved successfully.",
        "code" => [
            "config_version_id" => $configId,
            "version_no" => $versionNo
        ]
    ]);
} catch (Throwable $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }

    

    echo json_encode([
        "error" => true,
        "data" => $e instanceof PDOException
            ? "Unable to save documents configuration."
            : $e->getMessage(),
        "code" => $e instanceof PDOException
            ? $e->getMessage()
            : null
    ]);
}
