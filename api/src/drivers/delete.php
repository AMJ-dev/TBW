<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $organisationId = $my_details->organisation_id ?? null;

    $id = trim($_POST["id"] ?? "");
    $reason = trim($_POST["reason"] ?? "");

    if ($id === "" || mb_strlen($reason) < 5) {
        echo json_encode(["error" => true, "data" => "Driver ID and a reason of at least 5 characters are required.", "code" => null]);
        exit;
    }

    try {
        $conn->beginTransaction();

        $stmt = $conn->prepare("SELECT id, status FROM gate_drivers WHERE id = ? FOR UPDATE");
        $stmt->execute([$id]);
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
            VALUES (?, ?, 'deleted', ?, ?, 'Deleted', ?)
        ");
        $stmt->execute([
            generateId(),
            $id,
            $reason,
            $driver["status"],
            $actor
        ]);

        $stmt = $conn->prepare("DELETE FROM gate_drivers WHERE id = ?");
        $stmt->execute([$id]);

        $conn->commit();

        echo json_encode(["error" => false, "data" => "Driver deleted successfully.", "code" => $id]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        echo json_encode(["error" => true, "data" => "Could not delete driver. Check whether other records depend on this driver.", "code" => null]);
    }