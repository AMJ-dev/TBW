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
            INSERT INTO gate_driver_action_logs
            (id, driver_id, action, reason, previous_status, new_status, actor_id)
            VALUES (:id, :driver_id, 'deleted', :reason, :previous_status, 'Deleted', :actor_id)
        ");
        $stmt->execute([
            ":id" => generateId(),
            ":driver_id" => $id,
            ":reason" => $reason,
            ":previous_status" => $driver["status"],
            ":actor_id" => $actor
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