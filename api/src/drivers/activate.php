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

        if ($driver["status"] !== "Suspended") {
            $conn->rollBack();
            echo json_encode(["error" => true, "data" => "Only suspended drivers can be activated.", "code" => null]);
            exit;
        }

        if (empty($driver["licence_expiry"]) || $driver["licence_expiry"] < date("Y-m-d")) {
            $conn->rollBack();
            echo json_encode(["error" => true, "data" => "Renew the driver's licence before activation.", "code" => null]);
            exit;
        }

        $actor = $my_details->id ?? null;

        $stmt = $conn->prepare("
            UPDATE gate_drivers
            SET status = 'Approved', updated_by = :actor
            WHERE id = :id AND organisation_id=:organisation_id
        ");
        $stmt->execute([":actor" => $actor, ":id" => $id, ":organisation_id" => $organisation_id]);

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
            ":actor_id" => $actor,
            ":category" => "GATE",
            ":action" => "DRIVER_ACTIVATED",
            ":entity_type" => "DRIVER",
            ":entity_id" => $id,
            ":description" => "Driver activated and approved.",
            ":old_values" => json_encode([
                "status" => "Suspended"
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

        echo json_encode(["error" => false, "data" => "Driver activated successfully.", "code" => $id]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        echo json_encode(["error" => true, "data" => "Could not activate driver.", "code" => null]);
    }