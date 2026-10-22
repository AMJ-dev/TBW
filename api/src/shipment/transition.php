<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=utf-8");

function respond(int $status, bool $error, string $message, ?array $code = null): void {
    echo json_encode([
        "error" => $error,
        "data" => $message,
        "code" => $code
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        respond(405, true, "Method not allowed.");
    }

    $userId = (string) ($my_details->id ?? "");
    $accountType = (string) ($my_details->account_type ?? "");
    $systemRoleId = (string) ($my_details->system_role_id ?? "");

    if ($userId === "") respond(401, true, "Authentication required.");
    if ($accountType !== "system" || $systemRoleId === "") {
        respond(403, true, "You do not have permission to update shipments.");
    }

    $permStmt = $conn->prepare("
        SELECT 1
        FROM role_permissions rp
        INNER JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.role_id = :role_id
          AND p.permission_key = 'operations.manage'
        LIMIT 1
    ");
    $permStmt->execute([":role_id" => $systemRoleId]);
    if (!$permStmt->fetchColumn()) {
        respond(403, true, "You do not have permission to update shipments.");
    }

    $shipmentId = trim((string) ($_POST["id"] ?? ""));
    $toStatus = trim((string) ($_POST["to_status"] ?? ""));
    $action = trim((string) ($_POST["action"] ?? ""));
    $note = trim((string) ($_POST["note"] ?? ""));
    $holdReason = trim((string) ($_POST["hold_reason"] ?? ""));
    $authorityReference = trim((string) ($_POST["authority_reference"] ?? ""));
    $financialReference = trim((string) ($_POST["financial_reference"] ?? ""));

    if ($shipmentId === "") respond(400, true, "Shipment id is required.");

    $shipmentStmt = $conn->prepare("
        SELECT id, shipment_reference, status, organisation_id
        FROM portal_shipments
        WHERE id = :id
        LIMIT 1
    ");
    $shipmentStmt->execute([":id" => $shipmentId]);
    $shipment = $shipmentStmt->fetch(PDO::FETCH_ASSOC);
    if (!$shipment) respond(404, true, "Shipment not found.");

    $currentStatus = (string) $shipment["status"];

    /*
     * Declaration review is intentionally separate from cargo_transitions.
     * Only declarations waiting for review can be approved/rejected/returned.
     */
    if ($action !== "") {
        if (!in_array($action, ["approve", "reject", "return"], true)) {
            respond(422, true, "Invalid declaration review decision.");
        }
        if (!in_array($currentStatus, ["pending_review", "CHANGES_REQUESTED"], true)) {
            respond(422, true, "Only declarations awaiting review can be reviewed.");
        }
        if ($action !== "approve" && mb_strlen($note) < 5) {
            respond(422, true, "A reason of at least 5 characters is required.");
        }
        if (mb_strlen($note) > 500) {
            respond(422, true, "Review reason cannot exceed 500 characters.");
        }

        $decisionMap = [
            "approve" => ["approved", "EXPECTED", "Declaration approved and moved to EXPECTED."],
            "reject" => ["rejected", "REJECTED", "Declaration rejected."],
            "return" => ["changes_requested", "CHANGES_REQUESTED", "Declaration returned for correction."]
        ];
        [$decision, $targetStatus, $message] = $decisionMap[$action];

        $conn->beginTransaction();
        try {
            $lockStmt = $conn->prepare("SELECT status FROM portal_shipments WHERE id = :id FOR UPDATE");
            $lockStmt->execute([":id" => $shipmentId]);
            $lockedStatus = (string) $lockStmt->fetchColumn();

            if (!in_array($lockedStatus, ["pending_review", "CHANGES_REQUESTED"], true)) {
                throw new RuntimeException("This declaration has already been reviewed.");
            }

            $updateStmt = $conn->prepare("
                UPDATE portal_shipments
                SET status = :status, updated_at = CURRENT_TIMESTAMP
                WHERE id = :id
            ");
            $updateStmt->execute([":status" => $targetStatus, ":id" => $shipmentId]);

            $reviewStmt = $conn->prepare("
                INSERT INTO shipment_declaration_reviews
                    (id, shipment_id, reviewer_id, decision, from_status, to_status, reason, created_at)
                VALUES
                    (:id, :shipment_id, :reviewer_id, :decision, :from_status, :to_status, :reason, CURRENT_TIMESTAMP)
            ");
            $reviewStmt->execute([
                ":id" => generateId(),
                ":shipment_id" => $shipmentId,
                ":reviewer_id" => $userId,
                ":decision" => $decision,
                ":from_status" => $lockedStatus,
                ":to_status" => $targetStatus,
                ":reason" => $note !== "" ? $note : null
            ]);

            $conn->commit();
        } catch (Throwable $inner) {
            if ($conn->inTransaction()) $conn->rollBack();
            if ($inner instanceof RuntimeException) respond(409, true, $inner->getMessage());
            throw $inner;
        }

        respond(200, false, $message, [
            "shipment_id" => $shipmentId,
            "shipment_reference" => $shipment["shipment_reference"],
            "from_status" => $currentStatus,
            "status" => $targetStatus,
            "decision" => $decision,
            "reason" => $note !== "" ? $note : null
        ]);
    }

    if ($toStatus === "") respond(400, true, "Target status is required.");
    if ($currentStatus === $toStatus) respond(422, true, "Shipment is already in that state.");

    $versionStmt = $conn->prepare("
        SELECT id FROM cargo_config_versions WHERE is_current = 1 LIMIT 1
    ");
    $versionStmt->execute();
    $configVersionId = $versionStmt->fetchColumn();
    if (!$configVersionId) respond(500, true, "Cargo lifecycle configuration is not available.");

    $transitionStmt = $conn->prepare("
        SELECT rule_key, from_code, to_code, requires_hold_clear, requires_docs,
               requires_financial_clearance, requires_authority_reference, notifies
        FROM cargo_transitions
        WHERE config_version_id = :version_id
          AND from_code = :from_code
          AND to_code = :to_code
          AND active = 1
        LIMIT 1
    ");
    $transitionStmt->execute([
        ":version_id" => $configVersionId,
        ":from_code" => $currentStatus,
        ":to_code" => $toStatus
    ]);
    $transitionRow = $transitionStmt->fetch(PDO::FETCH_ASSOC);
    if (!$transitionRow) {
        respond(422, true, "This transition is not permitted by the current cargo lifecycle configuration.");
    }

    $targetStmt = $conn->prepare("
        SELECT code, internal_label, customer_label
        FROM cargo_states
        WHERE config_version_id = :version_id AND code = :code AND active = 1
        LIMIT 1
    ");
    $targetStmt->execute([":version_id" => $configVersionId, ":code" => $toStatus]);
    $targetState = $targetStmt->fetch(PDO::FETCH_ASSOC);
    if (!$targetState) respond(422, true, "Target state is not defined in the current cargo lifecycle configuration.");

    if ((int) $transitionRow["requires_authority_reference"] === 1 && $authorityReference === "") {
        respond(422, true, "An authority reference is required for this transition.");
    }
    if ((int) $transitionRow["requires_financial_clearance"] === 1 && $financialReference === "") {
        respond(422, true, "A financial clearance reference is required for this transition.");
    }

    if ((int) $transitionRow["requires_docs"] === 1) {
        $requiredDocsStmt = $conn->prepare("
            SELECT dt.label
            FROM document_upload_locations dul
            INNER JOIN document_upload_location_types dult ON dult.location_id = dul.id
            INNER JOIN document_types dt ON dt.document_key = dult.document_key
            INNER JOIN document_config_versions dcv ON dcv.id = dt.config_version_id
            WHERE dul.location_key = 'shipment_documents'
              AND dul.is_active = 1 AND dcv.is_current = 1 AND dult.is_required = 1
        ");
        $requiredDocsStmt->execute();
        $requiredDocs = $requiredDocsStmt->fetchAll(PDO::FETCH_COLUMN);

        if ($requiredDocs) {
            $uploadedStmt = $conn->prepare("
                SELECT document_type FROM portal_shipment_documents WHERE shipment_id = :shipment_id
            ");
            $uploadedStmt->execute([":shipment_id" => $shipmentId]);
            $uploaded = array_fill_keys(array_map("strval", $uploadedStmt->fetchAll(PDO::FETCH_COLUMN)), true);
            foreach ($requiredDocs as $label) {
                if (!isset($uploaded[(string) $label])) {
                    respond(422, true, "Missing required document: " . $label . ".");
                }
            }
        }
    }

    if ((int) $transitionRow["requires_hold_clear"] === 1) {
        try {
            $holdsStmt = $conn->prepare("
                SELECT COUNT(*) FROM portal_shipment_holds
                WHERE shipment_id = :shipment_id AND released_at IS NULL
            ");
            $holdsStmt->execute([":shipment_id" => $shipmentId]);
            if ((int) $holdsStmt->fetchColumn() > 0) {
                respond(422, true, "Active holds must be cleared before this transition.");
            }
        } catch (PDOException $inner) {
            if ($inner->getCode() !== "42S02") throw $inner;
        }
    }

    $conn->beginTransaction();
    try {
        $updateStmt = $conn->prepare("
            UPDATE portal_shipments SET status = :status, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ");
        $updateStmt->execute([":status" => $toStatus, ":id" => $shipmentId]);

        $auditStmt = $conn->prepare("
            INSERT INTO cargo_status_audit
                (id, shipment_id, actor_id, from_code, to_code, note, hold_reason,
                 authority_reference, financial_reference, config_version_id, created_at)
            VALUES
                (:id, :shipment_id, :actor_id, :from_code, :to_code, :note, :hold_reason,
                 :authority_reference, :financial_reference, :config_version_id, CURRENT_TIMESTAMP)
        ");
        $auditStmt->execute([
            ":id" => generateId(),
            ":shipment_id" => $shipmentId,
            ":actor_id" => $userId,
            ":from_code" => $currentStatus,
            ":to_code" => $toStatus,
            ":note" => $note !== "" ? $note : null,
            ":hold_reason" => $holdReason !== "" ? $holdReason : null,
            ":authority_reference" => $authorityReference !== "" ? $authorityReference : null,
            ":financial_reference" => $financialReference !== "" ? $financialReference : null,
            ":config_version_id" => $configVersionId
        ]);
        $conn->commit();
    } catch (Throwable $inner) {
        if ($conn->inTransaction()) $conn->rollBack();
        throw $inner;
    }

    respond(200, false, "Shipment moved to " . $targetState["customer_label"] . ".", [
        "shipment_id" => $shipmentId,
        "shipment_reference" => $shipment["shipment_reference"],
        "from_status" => $currentStatus,
        "status" => $toStatus,
        "customer_label" => $targetState["customer_label"]
    ]);
} catch (Throwable $e) {
    error_log("TRINU shipment transition error: " . $e->getMessage());
    respond(500, true, "Could not update shipment.");
}
