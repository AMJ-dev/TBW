<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $organisation_id = $my_details->organisation_id ?? null;

    $id = trim($_POST["id"] ?? "");
    $reason = trim($_POST["reason"] ?? "");

    if ($id === "" || mb_strlen($reason) < 5) {
        echo json_encode(["error" => true, "data" => "Driver ID and a reason of at least 5 characters are required.", "code" => null]);
        exit;
    }

    try {
        $conn->beginTransaction();

        $stmt = $conn->prepare("SELECT id, `status` FROM gate_drivers WHERE id = :id AND organisation_id=:organisation_id
            LIMIT 1
            FOR UPDATE");
        $stmt->execute([":id" => $id, ":organisation_id" => $organisation_id]);
        $driver = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$driver) {
            $conn->rollBack();
            echo json_encode(["error" => true, "data" => "Driver not found.", "code" => null]);
            exit;
        }

        $actor = $my_details->id ?? null;

        $stmt = $conn->prepare("
            INSERT INTO activity_logs (
                id,
                actor_id,
                category,
                action,
                entity_type,
                entity_id,
                description,
                reason,
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
                :reason,
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
            ":action" => "DRIVER_DELETED",
            ":entity_type" => "DRIVER",
            ":entity_id" => $id,
            ":description" => "Driver deleted.",
            ":reason" => $reason,
            ":old_values" => json_encode([
                "status" => $driver["status"]
            ], JSON_THROW_ON_ERROR),
            ":new_values" => json_encode([
                "status" => "Deleted"
            ], JSON_THROW_ON_ERROR),
            ":metadata" => json_encode([
                "source_table" => "gate_driver_action_logs",
                "driver_id" => $id
            ], JSON_THROW_ON_ERROR),
            ":severity" => "WARNING"
        ]);

        $stmt = $conn->prepare("DELETE FROM gate_drivers WHERE id = :id AND organisation_id=:organisation_id LIMIT 1");
        $stmt->execute([":id" => $id, ":organisation_id" => $organisation_id]);

        $conn->commit();

        echo json_encode(["error" => false, "data" => "Driver deleted successfully.", "code" => $id]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        echo json_encode(["error" => true, "data" => "Could not delete driver. Check whether other records depend on this driver.", "code" => null]);
    }