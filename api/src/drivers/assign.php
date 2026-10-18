<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
    exit;
}

$driver_id = trim((string)($_POST["driver_id"] ?? ""));
$vehicle_id = trim((string)($_POST["vehicle_id"] ?? ""));
$actor_id = $my_details->id ?? null;

if ($driver_id === "" || $vehicle_id === "") {
    http_response_code(422);
    echo json_encode(["error" => true, "data" => "Driver and vehicle are required.", "code" => null]);
    exit;
}

try {
    $conn->beginTransaction();

    $stmt = $conn->prepare("
        SELECT id, status, licence_expiry
        FROM gate_drivers
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
    ");
    $stmt->execute([$driver_id]);
    $driver = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$driver) {
        $conn->rollBack();
        http_response_code(404);
        echo json_encode(["error" => true, "data" => "Driver not found.", "code" => null]);
        exit;
    }

    if (strtolower((string)$driver["status"]) !== "approved") {
        $conn->rollBack();
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "Only approved drivers can be assigned a vehicle.", "code" => null]);
        exit;
    }

    if (empty($driver["licence_expiry"]) || $driver["licence_expiry"] < date("Y-m-d")) {
        $conn->rollBack();
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "The driver's licence is expired or missing.", "code" => null]);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT id, plate, status, insurance_expiry, roadworthiness_expiry
        FROM gate_vehicles
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
    ");
    $stmt->execute([$vehicle_id]);
    $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$vehicle) {
        $conn->rollBack();
        http_response_code(404);
        echo json_encode(["error" => true, "data" => "Vehicle not found.", "code" => null]);
        exit;
    }

    if (strtolower((string)$vehicle["status"]) !== "approved") {
        $conn->rollBack();
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "Only approved vehicles can be assigned.", "code" => null]);
        exit;
    }

    $today = date("Y-m-d");

    if (
        empty($vehicle["insurance_expiry"]) ||
        $vehicle["insurance_expiry"] < $today ||
        empty($vehicle["roadworthiness_expiry"]) ||
        $vehicle["roadworthiness_expiry"] < $today
    ) {
        $conn->rollBack();
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "The vehicle's insurance or roadworthiness document is expired or missing.", "code" => null]);
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
    $current = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($current && $current["vehicle_id"] === $vehicle_id) {
        $conn->commit();
        echo json_encode(["error" => false, "data" => "This vehicle is already assigned to the driver.", "code" => ["id" => $current["id"]]]);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT id
        FROM gate_driver_vehicle_assignments
        WHERE vehicle_id = ?
        AND unassigned_at IS NULL
        LIMIT 1
        FOR UPDATE
    ");
    $stmt->execute([$vehicle_id]);

    if ($stmt->fetch(PDO::FETCH_ASSOC)) {
        $conn->rollBack();
        http_response_code(409);
        echo json_encode(["error" => true, "data" => "This vehicle is already assigned to another driver.", "code" => null]);
        exit;
    }

    if ($current) {
        $stmt = $conn->prepare("
            UPDATE gate_driver_vehicle_assignments
            SET unassigned_at = NOW(), unassigned_by = ?
            WHERE id = ? AND unassigned_at IS NULL
        ");
        $stmt->execute([$actor_id, $current["id"]]);

        $stmt = $conn->prepare("
            INSERT INTO gate_driver_assignment_logs
                (id, driver_id, vehicle_id, action, actor_id, details)
            VALUES (?, ?, ?, 'reassigned_from', ?, ?)
        ");
        $stmt->execute([
            generateId(),
            $driver_id,
            $current["vehicle_id"],
            $actor_id,
            json_encode(["new_vehicle_id" => $vehicle_id])
        ]);
    }

    $assignment_id = generateId();

    $stmt = $conn->prepare("
        INSERT INTO gate_driver_vehicle_assignments
            (id, driver_id, vehicle_id, assigned_by, assigned_at)
        VALUES (?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$assignment_id, $driver_id, $vehicle_id, $actor_id]);

    $stmt = $conn->prepare("
        INSERT INTO gate_driver_assignment_logs
            (id, driver_id, vehicle_id, action, actor_id, details)
        VALUES (?, ?, ?, 'assigned', ?, ?)
    ");
    $stmt->execute([
        generateId(),
        $driver_id,
        $vehicle_id,
        $actor_id,
        json_encode(["assignment_id" => $assignment_id, "plate" => $vehicle["plate"]])
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Vehicle assigned successfully.",
        "code" => ["id" => $assignment_id]
    ]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode(["error" => true, "data" => "Could not assign vehicle.", "code" => null]);
}