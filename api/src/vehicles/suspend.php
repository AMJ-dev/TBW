<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $id = trim($_POST["id"] ?? "");
    $reason = trim($_POST["reason"] ?? "");

    if ($id === "" || mb_strlen($reason) < 5) {
        
        echo json_encode([
            "error" => true,
            "data" => "Vehicle ID and a reason of at least 5 characters are required.",
            "code" => null
        ]);
        exit;
    }

    try {
        $conn->beginTransaction();
        $organisation_id = $my_details->organisation_id ?? null;

        $stmt = $conn->prepare("
            SELECT id, status
            FROM gate_vehicles
            WHERE id = :id AND organisation_id = :organisation_id
            LIMIT 1
            FOR UPDATE
        ");
        $stmt->execute([":id" => $id, ":organisation_id" => $organisation_id]);
        $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$vehicle) {
            $conn->rollBack();
            
            echo json_encode([
                "error" => true,
                "data" => "Vehicle not found.",
                "code" => null
            ]);
            exit;
        }

        if (!in_array($vehicle["status"], ["Approved", "Pending review", "Inactive"], true)) {
            $conn->rollBack();
            
            echo json_encode([
                "error" => true,
                "data" => "Vehicle cannot be suspended from its current status.",
                "code" => $vehicle
            ]);
            exit;
        }

        $update = $conn->prepare("
            UPDATE gate_vehicles
            SET status = 'Suspended'
            WHERE id = :id AND organisation_id = :organisation_id
        ");
        $update->execute([":id" => $id, ":organisation_id" => $organisation_id]);

        $actorId = isset($my_details->id) ? $my_details->id : null;

        $log = $conn->prepare("
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

        $log->execute([
            ":id" => generateId(),
            ":actor_id" => $actorId,
            ":category" => "GATE",
            ":action" => "VEHICLE_SUSPENDED",
            ":entity_type" => "VEHICLE",
            ":entity_id" => $id,
            ":description" => "Vehicle suspended.",
            ":reason" => $reason,
            ":old_values" => null,
            ":new_values" => json_encode([
                "status" => "Suspended"
            ], JSON_THROW_ON_ERROR),
            ":metadata" => json_encode([
                "source_table" => "gate_vehicle_action_logs",
                "vehicle_id" => $id
            ], JSON_THROW_ON_ERROR),
            ":severity" => "WARNING"
        ]);

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Vehicle suspended successfully.",
            "code" => ["id" => $id, "status" => "Suspended"]
        ]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        
        echo json_encode([
            "error" => true,
            "data" => "Could not suspend vehicle.",
            "code" => null
        ]);
    }