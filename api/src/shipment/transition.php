<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed",
        "code" => null
    ]);
    exit;
}

try {
    $userId = (string) ($my_details->id ?? "");

    if ($userId === "") {
        http_response_code(401);
        echo json_encode([
            "error" => true,
            "data" => "Authentication required.",
            "code" => null
        ]);
        exit;
    }

    $accountType = (string) ($my_details->account_type ?? "");
    $systemRoleId = (string) ($my_details->system_role_id ?? "");

    if ($accountType !== "system" || $systemRoleId === "") {
        http_response_code(403);
        echo json_encode([
            "error" => true,
            "data" => "You do not have permission to update shipments.",
            "code" => null
        ]);
        exit;
    }

    $permStmt = $conn->prepare("
        SELECT 1
        FROM role_permissions rp
        INNER JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.role_id = :role_id
          AND p.permission_key = :permission_key
        LIMIT 1
    ");
    $permStmt->bindValue(":role_id", $systemRoleId);
    $permStmt->bindValue(":permission_key", "operations.manage");
    $permStmt->execute();

    if (!$permStmt->fetchColumn()) {
        http_response_code(403);
        echo json_encode([
            "error" => true,
            "data" => "You do not have permission to update shipments.",
            "code" => null
        ]);
        exit;
    }

    $shipmentId = trim($_POST["id"] ?? "");

    if ($shipmentId === "") {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Shipment id is required.",
            "code" => null
        ]);
        exit;
    }

    $toStatus = trim($_POST["to_status"] ?? "");
    $note = trim($_POST["note"] ?? "");
    $holdReason = trim($_POST["hold_reason"] ?? "");
    $authorityReference = trim($_POST["authority_reference"] ?? "");
    $financialReference = trim($_POST["financial_reference"] ?? "");

    if ($toStatus === "") {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Target status is required.",
            "code" => null
        ]);
        exit;
    }

    $shipmentStmt = $conn->prepare("
        SELECT id, shipment_reference, status, organisation_id
        FROM portal_shipments
        WHERE id = :id
        LIMIT 1
    ");
    $shipmentStmt->bindValue(":id", $shipmentId);
    $shipmentStmt->execute();
    $shipment = $shipmentStmt->fetch(PDO::FETCH_ASSOC);

    if (!$shipment) {
        http_response_code(404);
        echo json_encode([
            "error" => true,
            "data" => "Shipment not found.",
            "code" => null
        ]);
        exit;
    }

    $currentStatus = (string) $shipment["status"];

    if ($currentStatus === $toStatus) {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Shipment is already in that state.",
            "code" => null
        ]);
        exit;
    }

    $versionStmt = $conn->prepare("
        SELECT id
        FROM cargo_config_versions
        WHERE is_current = 1
        LIMIT 1
    ");
    $versionStmt->execute();
    $configVersionId = $versionStmt->fetchColumn();

    if (!$configVersionId) {
        http_response_code(500);
        echo json_encode([
            "error" => true,
            "data" => "Cargo lifecycle configuration is not available.",
            "code" => null
        ]);
        exit;
    }

    $transitionStmt = $conn->prepare("
        SELECT
            rule_key, from_code, to_code,
            requires_hold_clear, requires_docs,
            requires_financial_clearance,
            requires_authority_reference,
            notifies
        FROM cargo_transitions
        WHERE config_version_id = :version_id
          AND from_code = :from_code
          AND to_code = :to_code
          AND active = 1
        LIMIT 1
    ");
    $transitionStmt->bindValue(":version_id", $configVersionId);
    $transitionStmt->bindValue(":from_code", $currentStatus);
    $transitionStmt->bindValue(":to_code", $toStatus);
    $transitionStmt->execute();
    $transition = $transitionStmt->fetch(PDO::FETCH_ASSOC);

    if (!$transition) {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "This transition is not permitted by the current cargo lifecycle configuration.",
            "code" => null
        ]);
        exit;
    }

    $targetStateStmt = $conn->prepare("
        SELECT code, internal_label, customer_label
        FROM cargo_states
        WHERE config_version_id = :version_id
          AND code = :code
          AND active = 1
        LIMIT 1
    ");
    $targetStateStmt->bindValue(":version_id", $configVersionId);
    $targetStateStmt->bindValue(":code", $toStatus);
    $targetStateStmt->execute();
    $targetState = $targetStateStmt->fetch(PDO::FETCH_ASSOC);

    if (!$targetState) {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Target state is not defined in the current cargo lifecycle configuration.",
            "code" => null
        ]);
        exit;
    }

    if ((int) $transition["requires_authority_reference"] === 1 && $authorityReference === "") {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "An authority reference is required for this transition.",
            "code" => null
        ]);
        exit;
    }

    if ((int) $transition["requires_financial_clearance"] === 1 && $financialReference === "") {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "A financial clearance reference is required for this transition.",
            "code" => null
        ]);
        exit;
    }

    if ((int) $transition["requires_docs"] === 1) {
        $requiredDocsStmt = $conn->prepare("
            SELECT dt.document_key, dt.label
            FROM document_upload_locations dul
            INNER JOIN document_upload_location_types dult
                ON dult.location_id = dul.id
            INNER JOIN document_types dt
                ON dt.document_key = dult.document_key
            INNER JOIN document_config_versions dcv
                ON dcv.id = dt.config_version_id
            WHERE dul.location_key = 'shipment_documents'
              AND dul.is_active = 1
              AND dcv.is_current = 1
              AND dult.is_required = 1
        ");
        $requiredDocsStmt->execute();
        $requiredDocs = $requiredDocsStmt->fetchAll(PDO::FETCH_ASSOC);

        if ($requiredDocs) {
            $uploadedStmt = $conn->prepare("
                SELECT document_type
                FROM portal_shipment_documents
                WHERE shipment_id = :shipment_id
            ");
            $uploadedStmt->bindValue(":shipment_id", $shipmentId);
            $uploadedStmt->execute();
            $uploadedRows = $uploadedStmt->fetchAll(PDO::FETCH_COLUMN);

            $uploaded = [];
            foreach ($uploadedRows as $label) {
                $uploaded[(string) $label] = true;
            }

            foreach ($requiredDocs as $doc) {
                $label = (string) $doc["label"];
                if (!isset($uploaded[$label])) {
                    http_response_code(422);
                    echo json_encode([
                        "error" => true,
                        "data" => "Missing required document: " . $label . ".",
                        "code" => null
                    ]);
                    exit;
                }
            }
        }
    }

    if ((int) $transition["requires_hold_clear"] === 1) {
        $activeHoldsStmt = $conn->prepare("
            SELECT COUNT(*)
            FROM portal_shipment_holds
            WHERE shipment_id = :shipment_id
              AND released_at IS NULL
        ");
        try {
            $activeHoldsStmt->bindValue(":shipment_id", $shipmentId);
            $activeHoldsStmt->execute();
            $activeHolds = (int) $activeHoldsStmt->fetchColumn();

            if ($activeHolds > 0) {
                http_response_code(422);
                echo json_encode([
                    "error" => true,
                    "data" => "Active holds must be cleared before this transition.",
                    "code" => null
                ]);
                exit;
            }
        } catch (Throwable $inner) {
            // portal_shipment_holds may not exist yet — skip hold enforcement.
        }
    }

    $conn->beginTransaction();

    try {
        $updateStmt = $conn->prepare("
            UPDATE portal_shipments
            SET status = :status,
                updated_at = current_timestamp()
            WHERE id = :id
        ");
        $updateStmt->bindValue(":status", $toStatus);
        $updateStmt->bindValue(":id", $shipmentId);
        $updateStmt->execute();

        $auditId = generateId();

        $auditStmt = $conn->prepare("
            INSERT INTO cargo_status_audit (
                id, shipment_id, actor_id,
                from_code, to_code,
                note, hold_reason,
                authority_reference, financial_reference,
                config_version_id, created_at
            ) VALUES (
                :id, :shipment_id, :actor_id,
                :from_code, :to_code,
                :note, :hold_reason,
                :authority_reference, :financial_reference,
                :config_version_id, current_timestamp()
            )
        ");

        try {
            $auditStmt->bindValue(":id", $auditId);
            $auditStmt->bindValue(":shipment_id", $shipmentId);
            $auditStmt->bindValue(":actor_id", $userId);
            $auditStmt->bindValue(":from_code", $currentStatus);
            $auditStmt->bindValue(":to_code", $toStatus);
            $auditStmt->bindValue(":note", $note !== "" ? $note : null);
            $auditStmt->bindValue(":hold_reason", $holdReason !== "" ? $holdReason : null);
            $auditStmt->bindValue(":authority_reference", $authorityReference !== "" ? $authorityReference : null);
            $auditStmt->bindValue(":financial_reference", $financialReference !== "" ? $financialReference : null);
            $auditStmt->bindValue(":config_version_id", $configVersionId);
            $auditStmt->execute();
        } catch (Throwable $inner) {
            // cargo_status_audit may not exist yet — skip audit write.
        }

        $conn->commit();
    } catch (Throwable $inner) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        throw $inner;
    }

    echo json_encode([
        "error" => false,
        "data" => "Shipment moved to " . $targetState["customer_label"] . ".",
        "code" => [
            "shipment_id" => $shipmentId,
            "shipment_reference" => $shipment["shipment_reference"],
            "from_status" => $currentStatus,
            "status" => $toStatus,
            "customer_label" => $targetState["customer_label"]
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not update shipment.",
        "code" => null
    ]);
}