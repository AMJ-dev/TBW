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
            INSERT INTO gate_driver_action_logs
            (id, driver_id, action, previous_status, new_status, actor_id)
            VALUES (:id, :driver_id, 'approved', 'Pending review', 'Approved', :actor_id)
        ");
        $stmt->execute([":id" => generateId(), ":driver_id" => $id, ":actor_id" => $actor_id]);

        $conn->commit();

        echo json_encode(["error" => false, "data" => "Driver approved successfully.", "code" => $id]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        echo json_encode(["error" => true, "data" => "Could not approve driver.", "code" => null]);
    }