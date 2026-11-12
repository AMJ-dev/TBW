<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $examination_id = $_POST["examination_id"] ?? null;
        $decision = strtoupper(trim($_POST["decision"] ?? ""));
        $remarks = trim($_POST["remarks"] ?? "");

        if (!$examination_id || !$decision || !$remarks) {
            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "Examination ID, decision and remarks are required.",
                "code" => null
            ]);
            exit;
        }

        $allowed_decisions = [
            "APPROVED",
            "CHANGES_REQUESTED",
            "REJECTED"
        ];

        if (!in_array($decision, $allowed_decisions, true)) {
            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "Invalid examination review decision.",
                "code" => null
            ]);
            exit;
        }

        $conn->beginTransaction();

        $stmt = $conn->prepare("
            SELECT
                e.id,
                e.status,
                e.container_id,
                c.shipment_id,
                c.status AS container_status
            FROM terminal_examinations e
            LEFT JOIN portal_shipment_containers c
                ON c.id = e.container_id
            WHERE e.id = :id
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->execute([
            ":id" => $examination_id
        ]);

        $examination = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$examination) {
            $conn->rollBack();

            http_response_code(404);

            echo json_encode([
                "error" => true,
                "data" => "Examination not found.",
                "code" => null
            ]);
            exit;
        }

        if ($examination["status"] !== "PENDING_REVIEW") {
            $conn->rollBack();

            http_response_code(409);

            echo json_encode([
                "error" => true,
                "data" => "This examination is no longer awaiting review.",
                "code" => null
            ]);
            exit;
        }

        if (
            empty($examination["container_id"]) ||
            empty($examination["shipment_id"])
        ) {
            $conn->rollBack();

            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "The examination is not linked to a valid shipment container.",
                "code" => null
            ]);
            exit;
        }

        if ($examination["container_status"] !== "UNDER_EXAMINATION") {
            $conn->rollBack();

            http_response_code(409);

            echo json_encode([
                "error" => true,
                "data" => "The container is not currently under examination.",
                "code" => null
            ]);
            exit;
        }

        $previous_status = $examination["status"];

        $stmt = $conn->prepare("
            UPDATE terminal_examinations
            SET
                review_remarks = :remarks,     
                status = :status,
                reviewed_by = :reviewed_by,
                reviewed_at = NOW(),
                updated_at = NOW()
            WHERE id = :id AND status = 'PENDING_REVIEW'
        ");

        $stmt->execute([
            ":remarks" => $remarks,
            ":status" => $decision,
            ":reviewed_by" => $my_details->id,
            ":id" => $examination_id
        ]);

        if ($stmt->rowCount() !== 1) {
            throw new Exception("Could not update examination review.");
        }

        if ($decision === "APPROVED") {
            $stmt = $conn->prepare("
                UPDATE portal_shipment_containers
                SET status = 'EXAMINATION_COMPLETE'
                WHERE id = :container_id
                    AND status = 'UNDER_EXAMINATION'
            ");

            $stmt->execute([
                ":container_id" => $examination["container_id"]
            ]);

            if ($stmt->rowCount() !== 1) {
                throw new Exception("Could not update container examination status.");
            }

            $stmt = $conn->prepare("
                UPDATE portal_shipments s
                SET s.status = 'EXAMINATION_COMPLETE'
                WHERE s.id = :shipment_id
                    AND s.status IN (
                        'EXAMINATION_SCHEDULED',
                        'UNDER_EXAMINATION'
                    )
                    AND EXISTS (
                        SELECT 1
                        FROM portal_shipment_containers c
                        WHERE c.shipment_id = s.id
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM portal_shipment_containers c
                        WHERE c.shipment_id = s.id
                        AND c.status NOT IN (
                            'EXAMINATION_COMPLETE',
                            'CHARGES_PENDING',
                            'CHARGES_SETTLED',
                            'RELEASE_AUTHORISED',
                            'GATE_OUT',
                            'TRANSFERRED_OUT',
                            'RETURNED_RE_EXPORTED',
                            'CANCELLED'
                        )
                    )
            ");

            $stmt->execute([
                ":shipment_id" => $examination["shipment_id"]
            ]);

        } elseif ($decision === "REJECTED") {
            $stmt = $conn->prepare("
                UPDATE portal_shipment_containers
                SET status = 'EXAMINATION_REJECTED'
                WHERE id = :container_id
                    AND status = 'UNDER_EXAMINATION'
            ");

            $stmt->execute([
                ":container_id" => $examination["container_id"]
            ]);

            if ($stmt->rowCount() !== 1) {
                throw new Exception("Could not update rejected container status.");
            }
        }

        $actions = [
            "APPROVED" => "EXAMINATION_APPROVED",
            "CHANGES_REQUESTED" => "EXAMINATION_CHANGES_REQUESTED",
            "REJECTED" => "EXAMINATION_REJECTED"
        ];

        $metadata = json_encode([
            "decision" => $decision,
            "remarks" => $remarks,
            "container_id" => $examination["container_id"],
            "shipment_id" => $examination["shipment_id"]
        ]);

        $stmt = $conn->prepare("
            INSERT INTO activity_logs (
                id,
                actor_id,
                category,
                action,
                entity_type,
                entity_id,
                description,
                old_values,
                new_values,
                metadata,
                severity,
                created_at
            ) VALUES (
                :id,
                :actor_id,
                :category,
                :action,
                :entity_type,
                :entity_id,
                :description,
                :old_values,
                :new_values,
                :metadata,
                :severity,
                NOW()
            )
        ");

        $stmt->execute([
            ":id" => generateId(),
            ":actor_id" => $my_details->id,
            ":category" => "EXAMINATION",
            ":action" => $actions[$decision],
            ":entity_type" => "EXAMINATION",
            ":entity_id" => $examination_id,
            ":description" => $remarks,
            ":old_values" => json_encode([
                "status" => $previous_status
            ], JSON_THROW_ON_ERROR),
            ":new_values" => json_encode([
                "status" => $decision
            ], JSON_THROW_ON_ERROR),
            ":metadata" => json_encode([
                "source_table" => "terminal_examination_logs",
                "examination_id" => $examination_id,
                "details" => $metadata
            ], JSON_THROW_ON_ERROR),
            ":severity" => "INFO"
        ]);

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Examination review submitted successfully.",
            "code" => [
                "examination_id" => $examination_id,
                "decision" => $decision,
                "status" => $decision
            ]
        ]);

    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not save examination review.",
            "code" => null
        ]);
    }