
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

try {
    $configId = trim((string)($_POST["id"] ?? ""));
    $prefix = trim((string)($_POST["numbering_prefix"] ?? ""));
    $format = trim((string)($_POST["numbering_format"] ?? ""));
    $retentionMonths = filter_var($_POST["retention_months"] ?? null, FILTER_VALIDATE_INT);
    $documentTypesRaw = $_POST["document_types"] ?? null;

    if ($prefix === "" || !preg_match('/^[A-Za-z0-9_-]{1,20}$/', $prefix)) {
        throw new Exception("Invalid numbering prefix.");
    }

    if ($format === "" || !str_contains($format, "{TYPE}") || !str_contains($format, "{YYYY}") || !preg_match('/\{SEQ:\d+\}/', $format)) {
        throw new Exception("Invalid numbering format.");
    }

    if ($retentionMonths === false || $retentionMonths < 1 || $retentionMonths > 1200) {
        throw new Exception("Retention must be between 1 and 1,200 months.");
    }

    if (!is_string($documentTypesRaw)) {
        throw new Exception("Document types must be submitted as JSON form data.");
    }

    $documentTypes = json_decode($documentTypesRaw, true);

    if (!is_array($documentTypes) || json_last_error() !== JSON_ERROR_NONE || count($documentTypes) === 0) {
        throw new Exception("At least one valid document type is required.");
    }

    $keys = [];

    foreach ($documentTypes as $item) {
        if (!is_array($item)) {
            throw new Exception("Invalid document type.");
        }

        $key = trim((string)($item["key"] ?? ""));
        $label = trim((string)($item["label"] ?? ""));

        if ($key === "" || !preg_match('/^[a-z][a-z0-9_]*$/', $key) || $label === "") {
            throw new Exception("Each document type requires a valid key and label.");
        }

        if (isset($keys[strtolower($key)])) {
            throw new Exception("Document type keys must be unique.");
        }

        $keys[strtolower($key)] = true;
    }

    $conn->beginTransaction();

    if ($configId !== "") {
        $q = $conn->prepare("SELECT id, version_no FROM document_config_versions WHERE id = :id LIMIT 1 FOR UPDATE");
        $q->bindValue(":id", $configId, PDO::PARAM_STR);
        $q->execute();
        $existing = $q->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            throw new Exception("The selected document configuration was not found.");
        }
    } else {
        $q = $conn->prepare("SELECT id, version_no FROM document_config_versions WHERE is_current = 1 LIMIT 1 FOR UPDATE");
        $q->execute();
        $existing = $q->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $configId = (string)$existing["id"];
        }
    }

    if ($configId !== "") {
        $q = $conn->prepare("UPDATE document_config_versions SET numbering_prefix = :prefix, numbering_format = :format, retention_months = :retention WHERE id = :id");
        $q->bindValue(":prefix", $prefix, PDO::PARAM_STR);
        $q->bindValue(":format", $format, PDO::PARAM_STR);
        $q->bindValue(":retention", $retentionMonths, PDO::PARAM_INT);
        $q->bindValue(":id", $configId, PDO::PARAM_STR);
        $q->execute();

        $q = $conn->prepare("DELETE FROM document_types WHERE config_version_id = :config_id");
        $q->bindValue(":config_id", $configId, PDO::PARAM_STR);
        $q->execute();

        $action = "updated";
        $savedId = $configId;
        $versionNo = (int)($existing["version_no"] ?? 1);
    } else {
        $savedId = generateId();

        $q = $conn->prepare("SELECT COALESCE(MAX(version_no), 0) + 1 FROM document_config_versions");
        $q->execute();
        $versionNo = (int)$q->fetchColumn();

        $q = $conn->prepare("INSERT INTO document_config_versions (id, version_no, is_current, numbering_prefix, numbering_format, retention_months, change_reason, created_by) VALUES (:id, :version_no, 1, :prefix, :format, :retention, :reason, :created_by)");
        $q->bindValue(":id", $savedId, PDO::PARAM_STR);
        $q->bindValue(":version_no", $versionNo, PDO::PARAM_INT);
        $q->bindValue(":prefix", $prefix, PDO::PARAM_STR);
        $q->bindValue(":format", $format, PDO::PARAM_STR);
        $q->bindValue(":retention", $retentionMonths, PDO::PARAM_INT);
        $q->bindValue(":reason", "Document configuration created", PDO::PARAM_STR);
        $q->bindValue(":created_by", $my_details->id, PDO::PARAM_STR);
        $q->execute();

        $action = "created";
    }

    $q = $conn->prepare("UPDATE document_config_versions SET is_current = 0 WHERE is_current = 1 AND id <> :id");
    $q->bindValue(":id", $savedId, PDO::PARAM_STR);
    $q->execute();

    $q = $conn->prepare("UPDATE document_config_versions SET is_current = 1 WHERE id = :id");
    $q->bindValue(":id", $savedId, PDO::PARAM_STR);
    $q->execute();

    $insertType = $conn->prepare("INSERT INTO document_types (id, config_version_id, document_key, label, required, has_expiry, verification_required, sort_order) VALUES (:id, :config_id, :document_key, :label, :required, :has_expiry, :verification_required, :sort_order)");

    foreach ($documentTypes as $index => $item) {
        $insertType->bindValue(":id", generateId(), PDO::PARAM_STR);
        $insertType->bindValue(":config_id", $savedId, PDO::PARAM_STR);
        $insertType->bindValue(":document_key", trim((string)$item["key"]), PDO::PARAM_STR);
        $insertType->bindValue(":label", trim((string)$item["label"]), PDO::PARAM_STR);
        $insertType->bindValue(":required", !empty($item["required"]) ? 1 : 0, PDO::PARAM_INT);
        $insertType->bindValue(":has_expiry", !empty($item["has_expiry"]) ? 1 : 0, PDO::PARAM_INT);
        $insertType->bindValue(":verification_required", !empty($item["verification_required"]) ? 1 : 0, PDO::PARAM_INT);
        $insertType->bindValue(":sort_order", $index, PDO::PARAM_INT);
        $insertType->execute();
    }

    $requestId = generateId();
    $details = json_encode([
        "numbering_prefix" => $prefix,
        "numbering_format" => $format,
        "retention_months" => $retentionMonths,
        "document_type_count" => count($documentTypes)
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $q = $conn->prepare("INSERT INTO document_config_audit (id, request_id, config_version_id, action, actor_id, details, created_at) VALUES (:id, :request_id, :config_id, :action, :actor_id, :details, NOW())");
    $q->bindValue(":id", generateId(), PDO::PARAM_STR);
    $q->bindValue(":request_id", $requestId, PDO::PARAM_STR);
    $q->bindValue(":config_id", $savedId, PDO::PARAM_STR);
    $q->bindValue(":action", $action, PDO::PARAM_STR);
    $q->bindValue(":actor_id", $my_details->id, PDO::PARAM_STR);
    $q->bindValue(":details", $details, PDO::PARAM_STR);
    $q->execute();

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => [
            "id" => $savedId,
            "version_no" => $versionNo,
            "action" => $action
        ],
        "code" => null
    ]);
} catch (Throwable $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode([
        "error" => true,
        "data" => $e instanceof PDOException ? "Unable to save documents configuration." : $e->getMessage(),
        "code" => $e instanceof PDOException ? $e->getMessage() : null
    ]);
}
