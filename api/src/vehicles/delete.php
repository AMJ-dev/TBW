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
        $actorId = isset($my_details->id) ? $my_details->id : null;

        $stmt = $conn->prepare("
            SELECT id
            FROM gate_vehicles
            WHERE id = :id AND organisation_id = :organisation_id
            LIMIT 1
            FOR UPDATE
        ");
        $stmt->execute([
            ":id" => $id,
            ":organisation_id" => $organisation_id
        ]);
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


        $log = $conn->prepare("
            INSERT INTO gate_vehicle_action_logs (
                id,
                vehicle_id,
                action,
                reason,
                actor_id
            ) VALUES (:id, :vehicle_id, 'deleted', :reason, :actor_id)
        ");
        $log->execute([
            ":id" => generateId(),
            ":vehicle_id" => $id,
            ":reason" => $reason,
            ":actor_id" => $actorId
        ]);

        $delete = $conn->prepare("DELETE FROM gate_vehicles WHERE id = :id AND organisation_id = :organisation_id");
        $delete->execute([
            ":id" => $id,
            ":organisation_id" => $organisation_id
        ]);

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Vehicle removed from the registry.",
            "code" => ["id" => $id]
        ]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "Could not remove vehicle.",
            "code" => $e->getMessage()
        ]);
    }