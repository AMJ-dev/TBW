<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json");

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

    if ($driver["status"] !== "Approved") {
        $conn->rollBack();
        echo json_encode(["error" => true, "data" => "Only approved drivers can be suspended.", "code" => null]);
        exit;
    }

    $actor = $my_details->id ?? null;

    $stmt = $conn->prepare("
        UPDATE gate_drivers
        SET status = 'Suspended', updated_by = ?
        WHERE id = ?
    ");
    $stmt->execute([$actor, $id]);

    $stmt = $conn->prepare("
        INSERT INTO gate_driver_action_logs
        (id, driver_id, action, reason, previous_status, new_status, actor_id)
        VALUES (?, ?, 'suspended', ?, 'Approved', 'Suspended', ?)
    ");
    $stmt->execute([generateId(), $id, $reason, $actor]);

    $conn->commit();

    echo json_encode(["error" => false, "data" => "Driver suspended successfully.", "code" => $id]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode(["error" => true, "data" => "Could not suspend driver.", "code" => null]);
}