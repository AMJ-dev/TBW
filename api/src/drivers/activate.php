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

    $stmt = $conn->prepare("
        SELECT id, status, licence_expiry
        FROM gate_drivers
        WHERE id = ?
        FOR UPDATE
    ");
    $stmt->execute([$id]);
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
        SET status = 'Approved', updated_by = ?
        WHERE id = ?
    ");
    $stmt->execute([$actor, $id]);

    $stmt = $conn->prepare("
        INSERT INTO gate_driver_action_logs
        (id, driver_id, action, previous_status, new_status, actor_id)
        VALUES (?, ?, 'activated', 'Suspended', 'Approved', ?)
    ");
    $stmt->execute([generateId(), $id, $actor]);

    $conn->commit();

    echo json_encode(["error" => false, "data" => "Driver activated successfully.", "code" => $id]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode(["error" => true, "data" => "Could not activate driver.", "code" => null]);
}