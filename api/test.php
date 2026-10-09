<?php
require_once __DIR__ . '/include/conn.php';

try {
    $conn->beginTransaction();

    $q = $conn->prepare("SELECT id FROM document_config_versions WHERE version_no = :version_no LIMIT 1");
    $q->bindValue(":version_no", 1, PDO::PARAM_INT);
    $q->execute();
    $configurationId = $q->fetchColumn();

    if (!$configurationId) {
        $configurationId = generateId();

        $q = $conn->prepare("INSERT INTO document_config_versions (id, version_no, is_current, numbering_prefix, numbering_format, retention_months, change_reason, created_by) VALUES (:id, :version_no, :is_current, :numbering_prefix, :numbering_format, :retention_months, :change_reason, :created_by)");
        $q->bindValue(":id", $configurationId, PDO::PARAM_STR);
        $q->bindValue(":version_no", 1, PDO::PARAM_INT);
        $q->bindValue(":is_current", 1, PDO::PARAM_INT);
        $q->bindValue(":numbering_prefix", "TRN", PDO::PARAM_STR);
        $q->bindValue(":numbering_format", "TRN-{TYPE}-{YYYY}-{SEQ:6}", PDO::PARAM_STR);
        $q->bindValue(":retention_months", 84, PDO::PARAM_INT);
        $q->bindValue(":change_reason", "Initial document configuration", PDO::PARAM_STR);
        $q->bindValue(":created_by", "00000000-0000-4000-8000-000000000000", PDO::PARAM_STR);
        $q->execute();
    }

    $documentTypes = [
        ["receipt_note", "Receipt Note", 1, 0, 1],
        ["release_authorisation", "Release Authorisation", 1, 0, 2],
        ["gate_pass", "Gate Pass", 1, 1, 3],
        ["storage_statement", "Storage Statement", 0, 0, 4],
        ["examination_report", "Examination Attendance Report", 0, 0, 5],
        ["delivery_order", "Delivery Order", 1, 1, 6]
    ];

    $q = $conn->prepare("SELECT id FROM document_types WHERE config_version_id = :config_version_id AND document_key = :document_key LIMIT 1");

    $insert = $conn->prepare("INSERT INTO document_types (id, config_version_id, document_key, label, required, has_expiry, verification_required, sort_order) VALUES (:id, :config_version_id, :document_key, :label, :required, :has_expiry, :verification_required, :sort_order)");

    foreach ($documentTypes as $type) {
        $q->bindValue(":config_version_id", $configurationId, PDO::PARAM_STR);
        $q->bindValue(":document_key", $type[0], PDO::PARAM_STR);
        $q->execute();

        if (!$q->fetchColumn()) {
            $insert->bindValue(":id", generateId(), PDO::PARAM_STR);
            $insert->bindValue(":config_version_id", $configurationId, PDO::PARAM_STR);
            $insert->bindValue(":document_key", $type[0], PDO::PARAM_STR);
            $insert->bindValue(":label", $type[1], PDO::PARAM_STR);
            $insert->bindValue(":required", $type[2], PDO::PARAM_INT);
            $insert->bindValue(":has_expiry", $type[3], PDO::PARAM_INT);
            $insert->bindValue(":verification_required", 1, PDO::PARAM_INT);
            $insert->bindValue(":sort_order", $type[4], PDO::PARAM_INT);
            $insert->execute();
        }
    }

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Document configuration initialized successfully",
        "code" => [
            "configuration_id" => $configurationId,
            "version" => 1,
            "numbering_prefix" => "TRN",
            "numbering_format" => "TRN-{TYPE}-{YYYY}-{SEQ:6}",
            "retention_months" => 84,
            "document_types" => array_map(function ($type) {
                return [
                    "key" => $type[0],
                    "label" => $type[1],
                    "required" => (bool)$type[2],
                    "has_expiry" => (bool)$type[3],
                    "verification_required" => true,
                    "sort_order" => $type[4]
                ];
            }, $documentTypes)
        ]
    ]);
} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log("Document configuration initialization error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Unable to initialize document configuration",
        "code" => null
    ]);
}