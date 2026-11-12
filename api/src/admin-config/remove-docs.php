<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        echo json_encode(["error" => true, "data" => "Method not allowed", "code" => null]);
        exit;
    }

    try {
        $q = $conn->prepare("SELECT role_key FROM roles WHERE id = :id AND scope = 'system' AND is_active = 1 LIMIT 1");
        $q->bindValue(":id", $my_details->system_role_id);
        $q->execute();
        $role = $q->fetch(PDO::FETCH_ASSOC);

        if (!$role || $role["role_key"] !== "system_admin") {
            echo json_encode(["error" => true, "data" => "Access denied", "code" => null]);
            exit;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $docId = trim($data["document_id"] ?? "");

        if ($docId === "") {
            
            echo json_encode(["error" => true, "data" => "Invalid document ID", "code" => null]);
            exit;
        }

        $id = trim($_POST["organisation_id"] ?? $_GET["id"] ?? "");

        $q = $conn->prepare("
            SELECT
                rd.id,
                rd.file_path,
                rd.document_type,
                odr.status,
                odr.organisation_id
            FROM registration_documents rd
            INNER JOIN organisation_document_reviews odr ON odr.registration_document_id = rd.id
            WHERE rd.id = :doc_id
            LIMIT 1
        ");
        $q->bindValue(":doc_id", $docId);
        $q->execute();
        $doc = $q->fetch(PDO::FETCH_ASSOC);

        if (!$doc || ($id !== "" && $doc["organisation_id"] !== $id)) {
            
            echo json_encode(["error" => true, "data" => "Document not found", "code" => null]);
            exit;
        }

        if ($doc["status"] !== "pending") {
            
            echo json_encode(["error" => true, "data" => "Only pending documents can be removed", "code" => null]);
            exit;
        }

        $root = dirname(__DIR__, 2);
        $path = $root . "/" . ltrim($doc["file_path"], "/");

        $conn->beginTransaction();

        $q = $conn->prepare("
            INSERT INTO activity_logs (
                id,
                organisation_id,
                actor_id,
                category,
                action,
                entity_type,
                entity_id,
                description,
                new_values,
                metadata,
                ip_address,
                user_agent,
                severity,
                created_at
            ) VALUES (
                :id,
                :organisation_id,
                :actor_id,
                :category,
                :action,
                :entity_type,
                :entity_id,
                :description,
                :new_values,
                :metadata,
                :ip_address,
                :user_agent,
                :severity,
                CURRENT_TIMESTAMP
            )
        ");

        $q->execute([
            ":id" => generateId(),
            ":organisation_id" => $doc["organisation_id"],
            ":actor_id" => $my_details->id,
            ":category" => "ORGANISATION",
            ":action" => "ORGANISATION_DOCUMENT_REMOVED",
            ":entity_type" => "ORGANISATION_DOCUMENT",
            ":entity_id" => $docId,
            ":description" => "Organisation document removed.",
            ":new_values" => json_encode([
                "status" => "REMOVED"
            ], JSON_THROW_ON_ERROR),
            ":metadata" => json_encode([
                "source_table" => "organisation_audit_logs",
                "document_id" => $docId,
                "document_type" => $doc["document_type"]
            ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
            ":ip_address" => $_SERVER["REMOTE_ADDR"] ?? null,
            ":user_agent" => substr($_SERVER["HTTP_USER_AGENT"] ?? "", 0, 500),
            ":severity" => "WARNING"
        ]);

        $q = $conn->prepare("DELETE FROM registration_documents WHERE id = :id");
        $q->bindValue(":id", $docId);
        $q->execute();

        $conn->commit();

        if (is_file($path)) {
            unlink($path);
        }

        echo json_encode([
            "error" => false,
            "data" => "Document removed",
            "code" => ["document_id" => $docId]
        ]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        
        echo json_encode(["error" => true, "data" => $e->getMessage(), "code" => null]);
    }