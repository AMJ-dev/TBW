<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
    exit;
}

$driver_id = trim((string)($_POST["driver_id"] ?? ""));
$actor_id = $my_details->id ?? null;

if ($driver_id === "") {
    http_response_code(422);
    echo json_encode(["error" => true, "data" => "Driver ID is required.", "code" => null]);
    exit;
}

try {
    $conn->beginTransaction();

    $stmt = $conn->prepare("
        SELECT id
        FROM gate_drivers
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
    ");
    $stmt->execute([$driver_id]);

    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        $conn->rollBack();
        http_response_code(404);
        echo json_encode(["error" => true, "data" => "Driver not found.", "code" => null]);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT id, vehicle_id
        FROM gate_driver_vehicle_assignments
        WHERE driver_id = ?
        AND unassigned_at IS NULL
        LIMIT 1
        FOR UPDATE
    ");
    $stmt->execute([$driver_id]);
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$assignment) {
        $conn->rollBack();
        http_response_code(404);
        echo json_encode(["error" => true, "data" => "This driver has no active vehicle assignment.", "code" => null]);
        exit;
    }

    $stmt = $conn->prepare("
        UPDATE gate_driver_vehicle_assignments
        SET unassigned_at = NOW(), unassigned_by = ?
        WHERE id = ? AND unassigned_at IS NULL
    ");
    $stmt->execute([$actor_id, $assignment["id"]]);

    $stmt = $conn->prepare("
        INSERT INTO gate_driver_assignment_logs
            (id, driver_id, vehicle_id, action, actor_id, details)
        VALUES (?, ?, ?, 'unassigned', ?, ?)
    ");
    $stmt->execute([
        generateId(),
        $driver_id,
        $assignment["vehicle_id"],
        $actor_id,
        json_encode(["assignment_id" => $assignment["id"]])
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Vehicle unassigned successfully.",
        "code" => ["id" => $assignment["id"]]
    ]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode(["error" => true, "data" => "Could not unassign vehicle.", "code" => null]);
}