<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    header("Content-Type: application/json");

    $id = trim($_POST["id"] ?? "");

    if ($id === "") {
        echo json_encode(["error" => true, "data" => "Driver ID is required.", "code" => null]);
        exit;
    }

    try {
        $conn->beginTransaction();
        $organisation_id = $my_details->organisation_id ?? null;

        $stmt = $conn->prepare("
            SELECT id, status, licence_expiry
            FROM gate_drivers
            WHERE id = :id AND organisation_id=:organisation_id
            LIMIT 1
            FOR UPDATE
        ");
        $stmt->execute([":id" => $id, ":organisation_id" => $organisation_id]);
        $driver = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$driver) {
            $conn->rollBack();
            echo json_encode(["error" => true, "data" => "Driver not found.", "code" => null]);
            exit;
        }

        if ($driver["status"] !== "Pending review") {
            $conn->rollBack();
            echo json_encode(["error" => true, "data" => "Only pending drivers can be approved.", "code" => null]);
            exit;
        }

        if (empty($driver["licence_expiry"]) || $driver["licence_expiry"] < date("Y-m-d")) {
            $conn->rollBack();
            echo json_encode(["error" => true, "data" => "A valid, unexpired licence is required before approval.", "code" => null]);
            exit;
        }

        $actor_id = $my_details->id ?? null;

        $stmt = $conn->prepare("
            UPDATE gate_drivers
            SET status = 'Approved', approved_by = :actor_id, approved_at = NOW()
            WHERE id = :id AND organisation_id=:organisation_id
            LIMIT 1
        ");
        $stmt->execute([":actor_id" => $actor_id, ":id" => $id, ":organisation_id" => $organisation_id]);

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
            ":actor_id" => $actor_id,
            ":category" => "GATE",
            ":action" => "DRIVER_APPROVED",
            ":entity_type" => "DRIVER",
            ":entity_id" => $id,
            ":description" => "Driver approved after review.",
            ":old_values" => json_encode([
                "status" => "Pending review"
            ], JSON_THROW_ON_ERROR),
            ":new_values" => json_encode([
                "status" => "Approved"
            ], JSON_THROW_ON_ERROR),
            ":metadata" => json_encode([
                "source_table" => "gate_driver_action_logs",
                "driver_id" => $id
            ], JSON_THROW_ON_ERROR),
            ":severity" => "INFO"
        ]);

        $conn->commit();

        echo json_encode(["error" => false, "data" => "Driver approved successfully.", "code" => $id]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        echo json_encode(["error" => true, "data" => "Could not approve driver.", "code" => null]);
    }