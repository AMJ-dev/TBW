<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $q = $conn->prepare("SELECT id, numbering_prefix, numbering_format, retention_months FROM document_config_versions WHERE is_current = 1 ORDER BY created_at DESC LIMIT 1");
        $q->execute();
        $configuration = $q->fetch(PDO::FETCH_ASSOC);

        if (!$configuration) {
            echo json_encode([
                "error" => false,
                "data" => "Documents configuration loaded successfully.",
                "code" => [
                    "numbering_prefix" => "TRN",
                    "numbering_format" => "TRN-{TYPE}-{YYYY}-{SEQ:6}",
                    "retention_months" => 84,
                    "document_types" => []
                ]
            ]);
            exit;
        }

        $q = $conn->prepare("SELECT id, document_key AS `key`, label, required, has_expiry, verification_required FROM document_types WHERE config_version_id = :config_version_id ORDER BY sort_order ASC, label ASC");
        $q->bindValue(":config_version_id", $configuration["id"], PDO::PARAM_STR);
        $q->execute();
        $documentTypes = $q->fetchAll(PDO::FETCH_ASSOC);

        foreach ($documentTypes as &$type) {
            $type["required"] = (bool)$type["required"];
            $type["has_expiry"] = (bool)$type["has_expiry"];
            $type["verification_required"] = (bool)$type["verification_required"];
        }
        unset($type);

        echo json_encode([
            "error" => false,
            "data" => "Documents configuration loaded successfully.",
            "code" => [
                "numbering_prefix" => $configuration["numbering_prefix"],
                "numbering_format" => $configuration["numbering_format"],
                "retention_months" => (int)$configuration["retention_months"],
                "document_types" => $documentTypes
            ]
        ]);
    } catch (Throwable $e) {
        error_log("Documents configuration load error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            "error" => true,
            "data" => "Unable to load documents configuration.",
            "code" => null
        ]);
    }