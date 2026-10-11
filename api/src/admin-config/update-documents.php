
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

try {
    $prefix = trim((string)($_POST["numbering_prefix"] ?? ""));
    $format = trim((string)($_POST["numbering_format"] ?? ""));
    $retentionMonths = filter_var(
        $_POST["retention_months"] ?? null,
        FILTER_VALIDATE_INT
    );

    $documentTypesRaw = $_POST["document_types"] ?? null;
    $uploadLocationsRaw = $_POST["upload_locations"] ?? null;

    if ($prefix === "" || !preg_match('/^[A-Za-z0-9_-]{1,20}$/', $prefix)) {
        throw new Exception("Invalid numbering prefix.");
    }

    if (
        $format === "" ||
        !str_contains($format, "{TYPE}") ||
        !str_contains($format, "{YYYY}") ||
        !preg_match('/\{SEQ:\d+\}/', $format)
    ) {
        throw new Exception("Invalid numbering format.");
    }

    if (
        $retentionMonths === false ||
        $retentionMonths < 1 ||
        $retentionMonths > 1200
    ) {
        throw new Exception("Retention must be between 1 and 1,200 months.");
    }

    if (!is_string($documentTypesRaw)) {
        throw new Exception("Document types must be submitted as JSON form data.");
    }

    if (!is_string($uploadLocationsRaw)) {
        throw new Exception("Upload locations must be submitted as JSON form data.");
    }

    $documentTypes = json_decode($documentTypesRaw, true);
    $uploadLocations = json_decode($uploadLocationsRaw, true);

    if (
        !is_array($documentTypes) ||
        json_last_error() !== JSON_ERROR_NONE ||
        count($documentTypes) === 0
    ) {
        throw new Exception("At least one valid document type is required.");
    }

    if (
        !is_array($uploadLocations) ||
        json_last_error() !== JSON_ERROR_NONE
    ) {
        throw new Exception("Invalid upload location settings.");
    }

    $keys = [];
    $normalisedTypes = [];

    foreach ($documentTypes as $item) {
        if (!is_array($item)) {
            throw new Exception("Invalid document type.");
        }

        $key = trim((string)($item["key"] ?? ""));
        $label = trim((string)($item["label"] ?? ""));

        if (
            $key === "" ||
            !preg_match('/^[a-z][a-z0-9_]*$/', $key) ||
            $label === "" ||
            strlen($key) > 80 ||
            strlen($label) > 150
        ) {
            throw new Exception("Each document type requires a valid key and name.");
        }

        if (isset($keys[$key])) {
            throw new Exception("Document type keys must be unique.");
        }

        $keys[$key] = true;

        $normalisedTypes[] = [
            "key" => $key,
            "label" => $label
        ];
    }

    $conn->beginTransaction();

    $q = $conn->prepare("
        SELECT id, version_no, numbering_prefix, numbering_format, retention_months
        FROM document_config_versions
        WHERE is_current = 1
        LIMIT 1
        FOR UPDATE
    ");
    $q->execute();
    $existing = $q->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $configId = (string)$existing["id"];
        $versionNo = (int)$existing["version_no"];

        $before = [
            "numbering_prefix" => $existing["numbering_prefix"],
            "numbering_format" => $existing["numbering_format"],
            "retention_months" => (int)$existing["retention_months"]
        ];

        $q = $conn->prepare("
            UPDATE document_config_versions
            SET numbering_prefix = :prefix,
                numbering_format = :format,
                retention_months = :retention,
                change_reason = :reason
            WHERE id = :id
        ");
        $q->execute([
            ":prefix" => $prefix,
            ":format" => $format,
            ":retention" => $retentionMonths,
            ":reason" => "Documents configuration updated",
            ":id" => $configId
        ]);

        $action = "updated";
    } else {
        $q = $conn->prepare("
            SELECT COALESCE(MAX(version_no), 0) + 1
            FROM document_config_versions
        ");
        $q->execute();
        $versionNo = (int)$q->fetchColumn();

        $configId = generateId();

        $before = null;

        $q = $conn->prepare("
            INSERT INTO document_config_versions
            (
                id,
                version_no,
                is_current,
                numbering_prefix,
                numbering_format,
                retention_months,
                change_reason,
                created_by
            )
            VALUES
            (
                :id,
                :version_no,
                1,
                :prefix,
                :format,
                :retention,
                :reason,
                :created_by
            )
        ");
        $q->execute([
            ":id" => $configId,
            ":version_no" => $versionNo,
            ":prefix" => $prefix,
            ":format" => $format,
            ":retention" => $retentionMonths,
            ":reason" => "Initial document configuration",
            ":created_by" => $my_details->id
        ]);

        $action = "created";
    }

    $q = $conn->prepare("
        UPDATE document_config_versions
        SET is_current = 0
        WHERE is_current = 1 AND id <> :id
    ");
    $q->execute([":id" => $configId]);

    $q = $conn->prepare("
        UPDATE document_config_versions
        SET is_current = 1
        WHERE id = :id
    ");
    $q->execute([":id" => $configId]);

    $q = $conn->prepare("
        DELETE FROM document_types
        WHERE config_version_id = :config_id
    ");
    $q->execute([":config_id" => $configId]);

    $insertType = $conn->prepare("
        INSERT INTO document_types
        (
            id,
            config_version_id,
            document_key,
            label,
            required,
            has_expiry,
            verification_required,
            sort_order
        )
        VALUES
        (
            :id,
            :config_id,
            :document_key,
            :label,
            0,
            0,
            0,
            :sort_order
        )
    ");

    foreach ($normalisedTypes as $index => $item) {
        $insertType->execute([
            ":id" => generateId(),
            ":config_id" => $configId,
            ":document_key" => $item["key"],
            ":label" => $item["label"],
            ":sort_order" => $index
        ]);
    }

    $q = $conn->prepare("
        SELECT id, location_key
        FROM document_upload_locations
        WHERE is_active = 1
    ");
    $q->execute();
    $databaseLocations = $q->fetchAll(PDO::FETCH_ASSOC);

    $locationsByKey = [];

    foreach ($databaseLocations as $location) {
        $locationsByKey[$location["location_key"]] = $location;
    }

    $submittedLocations = [];

    foreach ($uploadLocations as $location) {
        if (!is_array($location)) {
            throw new Exception("Invalid upload location.");
        }

        $key = trim((string)($location["key"] ?? ""));

        if ($key === "" || !isset($locationsByKey[$key])) {
            throw new Exception("An upload location is invalid.");
        }

        if (isset($submittedLocations[$key])) {
            throw new Exception("An upload location was submitted more than once.");
        }

        $submittedLocations[$key] = $location;
    }

    if (count($submittedLocations) !== count($databaseLocations)) {
        throw new Exception("Submit settings for every fixed upload location.");
    }

    $deleteMappings = $conn->prepare("
        DELETE FROM document_upload_location_types
        WHERE location_id = :location_id
    ");

    $insertMapping = $conn->prepare("
        INSERT INTO document_upload_location_types
        (id, location_id, document_key)
        VALUES (:id, :location_id, :document_key)
    ");

    $updateLocation = $conn->prepare("
        UPDATE document_upload_locations
        SET required = :required,
            allow_multiple = :allow_multiple,
            is_active = 1
        WHERE id = :id
    ");

    foreach ($databaseLocations as $databaseLocation) {
        $key = $databaseLocation["location_key"];
        $locationId = $databaseLocation["id"];
        $submitted = $submittedLocations[$key];

        $documentKeys = $submitted["document_type_keys"] ?? [];

        if (!is_array($documentKeys)) {
            throw new Exception("Accepted document types must be an array.");
        }

        $uniqueKeys = [];

        foreach ($documentKeys as $documentKey) {
            $documentKey = trim((string)$documentKey);

            if (!isset($keys[$documentKey])) {
                throw new Exception(
                    "An upload location references an unknown document type."
                );
            }

            $uniqueKeys[$documentKey] = true;
        }

        $required = !empty($submitted["required"]) ? 1 : 0;
        $allowMultiple = !empty($submitted["allow_multiple"]) ? 1 : 0;

        $updateLocation->execute([
            ":required" => $required,
            ":allow_multiple" => $allowMultiple,
            ":id" => $locationId
        ]);

        $deleteMappings->execute([
            ":location_id" => $locationId
        ]);

        foreach (array_keys($uniqueKeys) as $documentKey) {
            $insertMapping->execute([
                ":id" => generateId(),
                ":location_id" => $locationId,
                ":document_key" => $documentKey
            ]);
        }
    }

    $after = [
        "numbering_prefix" => $prefix,
        "numbering_format" => $format,
        "retention_months" => $retentionMonths,
        "document_types" => $normalisedTypes,
        "upload_locations" => array_map(
            function ($location) use ($submittedLocations) {
                $submitted = $submittedLocations[$location["location_key"]];

                return [
                    "key" => $location["location_key"],
                    "document_type_keys" =>
                        $submitted["document_type_keys"] ?? [],
                    "required" => !empty($submitted["required"]),
                    "allow_multiple" =>
                        !empty($submitted["allow_multiple"])
                ];
            },
            $databaseLocations
        )
    ];

    $requestId = generateId();

    $q = $conn->prepare("
        INSERT INTO document_config_audit
        (
            id,
            config_version_id,
            actor_id,
            action,
            change_reason,
            before_json,
            after_json,
            request_id,
            ip_address,
            user_agent,
            details
        )
        VALUES
        (
            :id,
            :config_id,
            :actor_id,
            :action,
            :reason,
            :before_json,
            :after_json,
            :request_id,
            :ip_address,
            :user_agent,
            :details
        )
    ");

    $q->execute([
        ":id" => generateId(),
        ":config_id" => $configId,
        ":actor_id" => $my_details->id,
        ":action" => "DOCUMENT_CONFIGURATION_" . strtoupper($action),
        ":reason" => "Documents configuration updated",
        ":before_json" => $before === null
            ? null
            : json_encode($before, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ":after_json" => json_encode(
            $after,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        ),
        ":request_id" => $requestId,
        ":ip_address" => $_SERVER["REMOTE_ADDR"] ?? "",
        ":user_agent" => substr($_SERVER["HTTP_USER_AGENT"] ?? "", 0, 500),
        ":details" => json_encode([
            "document_type_count" => count($normalisedTypes),
            "upload_location_count" => count($databaseLocations)
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Documents configuration saved successfully.",
        "code" => [
            "id" => $configId,
            "version_no" => $versionNo,
            "action" => $action
        ]
    ]);
} catch (Throwable $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log("Documents configuration save error: " . $e->getMessage());

    http_response_code($e instanceof PDOException ? 500 : 400);

    echo json_encode([
        "error" => true,
        "data" => $e instanceof PDOException
            ? "Unable to save documents configuration."
            : $e->getMessage(),
        "code" => $e->getMessage()
    ]);
}
