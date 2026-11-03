<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $id = trim($_POST["id"] ?? "");

    if ($id === "") {
        echo json_encode([
            "error" => true,
            "data" => "Vehicle ID is required.",
            "code" => null
        ]);
        exit;
    }

    $organisation_id = $my_details->organisation_id ?? null;

    try {
        $conn->beginTransaction();

        $check = $conn->prepare("
            SELECT `status`
            FROM gate_vehicles
            WHERE id = :id AND organisation_id=:organisation_id
            LIMIT 1
        ");
        $check->execute([":id" => $id, ":organisation_id" => $organisation_id]);
        $vehicle = $check->fetch(PDO::FETCH_ASSOC);

        if (!$vehicle) {
            echo json_encode([
                "error" => true,
                "data" => "Vehicle not found.",
                "code" => null
            ]);
            exit;
        }
        if ($vehicle["status"] !== "Pending review") {
            echo json_encode([
                "error" => true,
                "data" => "Only vehicles pending review can be approved.",
                "code" => ["status" => $vehicle["status"]]
            ]);
            exit;
        }
        $actor_id = isset($my_details->id) ? $my_details->id : null;

        $stmt = $conn->prepare("UPDATE gate_vehicles SET `status` = 'Approved', approved_by = :actor_id, approved_at = NOW() WHERE id = :id AND organisation_id=:organisation_id");
        if ($stmt->execute([":id" => $id, ":actor_id" => $actor_id, ":organisation_id" => $organisation_id])) {
            $log = $conn->prepare("
                INSERT INTO gate_vehicle_action_logs (
                    id, vehicle_id, action, previous_status, new_status, actor_id
                ) VALUES (:id, :vehicle_id, 'approved', 'Pending review', 'Approved', :actor_id)
            ");
            $log->execute([":id" => generateId(), ":vehicle_id" => $id, ":actor_id" => $actor_id]);
            
            echo json_encode([
                "error" => false,
                "data" => "Vehicle approved successfully.",
                "code" => ["id" => $id, "status" => "Approved"]
            ]);
            $conn->commit();
        } else {
            $conn->rollBack();
            echo json_encode([
                "error" => true,
                "data" => "Could not approve vehicle.",
                "code" => ["status" => $vehicle["status"]]
            ]);
            exit;
        }

    } catch (PDOException $e) {
        echo json_encode([
            "error" => true,
            "data" => "Could not approve vehicle.",
            "code" => $e->getMessage(),
        ]);
    }