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
    $organisation_id = $my_details->organisation_id ?? null;

    $stmt = $conn->prepare("SELECT id, `status` FROM gate_drivers WHERE id = :id AND organisation_id=:organisation_id LIMIT 1 FOR UPDATE");
    $stmt->execute([":id" => $id, ":organisation_id" => $organisation_id]);
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
        SET status = 'Suspended', updated_by = :actor
        WHERE id = :id AND organisation_id=:organisation_id LIMIT 1
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
        ":action" => "DRIVER_SUSPENDED",
        ":entity_type" => "DRIVER",
        ":entity_id" => $id,
        ":description" => "Driver suspended.",
        ":reason" => $reason,
        ":old_values" => json_encode([
            "status" => "Approved"
        ], JSON_THROW_ON_ERROR),
        ":new_values" => json_encode([
            "status" => "Suspended"
        ], JSON_THROW_ON_ERROR),
        ":metadata" => json_encode([
            "source_table" => "gate_driver_action_logs",
            "driver_id" => $id
        ], JSON_THROW_ON_ERROR),
        ":severity" => "WARNING"
    ]);

    $conn->commit();

    echo json_encode(["error" => false, "data" => "Driver suspended successfully.", "code" => $id]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode(["error" => true, "data" => "Could not suspend driver.", "code" => null]);
}