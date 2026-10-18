<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed.",
        "code" => null
    ]);
    exit;
}

$vehicle_id = trim((string)($_POST["vehicle_id"] ?? ""));
$driver_id = trim((string)($_POST["driver_id"] ?? ""));
$appointment_date = trim((string)($_POST["appointment_date"] ?? ""));
$slot_time = trim((string)($_POST["slot_time"] ?? ""));
$container_nos = $_POST["container_nos"] ?? [];

if (!is_array($container_nos)) {
    echo json_encode([
        "error" => true,
        "data" => "Container numbers must be submitted as an array.",
        "code" => null
    ]);
    exit;
}

$container_nos = array_map(
    static fn($container) => strtoupper(trim((string)$container)),
    $container_nos
);

$container_nos = array_values(array_filter(
    $container_nos,
    static fn($container) => $container !== ""
));

$container_nos = array_values(array_unique($container_nos));

if (
    $vehicle_id === "" ||
    $driver_id === "" ||
    $appointment_date === "" ||
    $slot_time === "" ||
    count($container_nos) === 0
) {
    echo json_encode([
        "error" => true,
        "data" => "Vehicle, driver, date, time slot, and at least one container are required.",
        "code" => null
    ]);
    exit;
}

if (
    count($container_nos) !== count($_POST["container_nos"]) ||
    count($container_nos) > 100
) {
    echo json_encode([
        "error" => true,
        "data" => "Remove empty or duplicate containers. A maximum of 100 containers is allowed.",
        "code" => null
    ]);
    exit;
}

$date = DateTimeImmutable::createFromFormat("!Y-m-d", $appointment_date);
$date_errors = DateTimeImmutable::getLastErrors();

if (
    !$date ||
    ($date_errors !== false &&
        ($date_errors["warning_count"] > 0 || $date_errors["error_count"] > 0)) ||
    $date->format("Y-m-d") !== $appointment_date
) {
    echo json_encode([
        "error" => true,
        "data" => "Invalid appointment date.",
        "code" => null
    ]);
    exit;
}

if ($appointment_date < date("Y-m-d")) {
    echo json_encode([
        "error" => true,
        "data" => "Appointment date cannot be in the past.",
        "code" => null
    ]);
    exit;
}

$allowed_slots = [
    "08:00 – 09:00",
    "09:00 – 10:00",
    "10:00 – 11:00",
    "11:00 – 12:00",
    "12:00 – 13:00",
    "13:00 – 14:00",
    "14:00 – 15:00",
    "15:00 – 16:00"
];

if (!in_array($slot_time, $allowed_slots, true)) {
    echo json_encode([
        "error" => true,
        "data" => "Invalid appointment time slot.",
        "code" => null
    ]);
    exit;
}

foreach ($container_nos as $container_no) {
    if (mb_strlen($container_no) > 30) {
        echo json_encode([
            "error" => true,
            "data" => "A container number exceeds the allowed length.",
            "code" => null
        ]);
        exit;
    }
}

try {
    $conn->beginTransaction();

    $vehicle_stmt = $conn->prepare("
        SELECT
            id,
            plate,
            status,
            insurance_expiry,
            roadworthiness_expiry
        FROM gate_vehicles
        WHERE id = ?
        FOR UPDATE
    ");
    $vehicle_stmt->execute([$vehicle_id]);
    $vehicle = $vehicle_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$vehicle) {
        $conn->rollBack();
        echo json_encode([
            "error" => true,
            "data" => "Selected vehicle was not found.",
            "code" => null
        ]);
        exit;
    }

    if (
        $vehicle["status"] !== "Approved" ||
        empty($vehicle["insurance_expiry"]) ||
        $vehicle["insurance_expiry"] < date("Y-m-d") ||
        empty($vehicle["roadworthiness_expiry"]) ||
        $vehicle["roadworthiness_expiry"] < date("Y-m-d")
    ) {
        $conn->rollBack();
        echo json_encode([
            "error" => true,
            "data" => "Vehicle approval, insurance, or roadworthiness is invalid or expired.",
            "code" => null
        ]);
        exit;
    }

    $driver_stmt = $conn->prepare("
        SELECT
            id,
            name,
            phone,
            status,
            licence_expiry
        FROM gate_drivers
        WHERE id = ?
        FOR UPDATE
    ");
    $driver_stmt->execute([$driver_id]);
    $driver = $driver_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$driver) {
        $conn->rollBack();
        echo json_encode([
            "error" => true,
            "data" => "Selected driver was not found.",
            "code" => null
        ]);
        exit;
    }

    if (
        $driver["status"] !== "Approved" ||
        empty($driver["licence_expiry"]) ||
        $driver["licence_expiry"] < date("Y-m-d")
    ) {
        $conn->rollBack();
        echo json_encode([
            "error" => true,
            "data" => "Driver approval or licence validity is invalid or expired.",
            "code" => null
        ]);
        exit;
    }

    $assignment_stmt = $conn->prepare("
        SELECT id
        FROM gate_driver_vehicle_assignments
        WHERE driver_id = ?
          AND vehicle_id = ?
          AND unassigned_at IS NULL
        LIMIT 1
        FOR UPDATE
    ");
    $assignment_stmt->execute([$driver_id, $vehicle_id]);

    if (!$assignment_stmt->fetch(PDO::FETCH_ASSOC)) {
        $conn->rollBack();
        echo json_encode([
            "error" => true,
            "data" => "The selected driver is not actively assigned to this vehicle.",
            "code" => null
        ]);
        exit;
    }

    $conflict_stmt = $conn->prepare("
        SELECT id
        FROM gate_appointments
        WHERE appointment_date = ?
          AND slot_time = ?
          AND status IN ('Confirmed', 'Arrived', 'In Terminal')
          AND (vehicle_id = ? OR driver_id = ?)
        LIMIT 1
        FOR UPDATE
    ");
    $conflict_stmt->execute([
        $appointment_date,
        $slot_time,
        $vehicle_id,
        $driver_id
    ]);

    if ($conflict_stmt->fetch(PDO::FETCH_ASSOC)) {
        $conn->rollBack();
        echo json_encode([
            "error" => true,
            "data" => "This vehicle or driver already has an active appointment for that time slot.",
            "code" => null
        ]);
        exit;
    }

    $placeholders = implode(
        ",",
        array_fill(0, count($container_nos), "?")
    );

    $container_conflict_stmt = $conn->prepare("
        SELECT ac.container_no
        FROM gate_appointment_containers ac
        INNER JOIN gate_appointments a
            ON a.id = ac.appointment_id
        WHERE a.appointment_date = ?
          AND a.status IN ('Confirmed', 'Arrived', 'In Terminal')
          AND ac.container_no IN ($placeholders)
        LIMIT 1
        FOR UPDATE
    ");

    $container_conflict_stmt->execute(array_merge(
        [$appointment_date],
        $container_nos
    ));

    $container_conflict = $container_conflict_stmt->fetch(PDO::FETCH_ASSOC);

    if ($container_conflict) {
        $conn->rollBack();
        echo json_encode([
            "error" => true,
            "data" => "Container " . $container_conflict["container_no"] .
                " already has an active appointment on this date.",
            "code" => null
        ]);
        exit;
    }

    $appointment_id = generateId();
    $created_by = $my_details->id ?? null;

    $insert_appointment = $conn->prepare("
        INSERT INTO gate_appointments (
            id,
            vehicle_id,
            driver_id,
            appointment_date,
            slot_time,
            status,
            created_by
        ) VALUES (?, ?, ?, ?, ?, 'Confirmed', ?)
    ");

    $insert_appointment->execute([
        $appointment_id,
        $vehicle_id,
        $driver_id,
        $appointment_date,
        $slot_time,
        $created_by
    ]);

    $insert_container = $conn->prepare("
        INSERT INTO gate_appointment_containers (
            id,
            appointment_id,
            container_no
        ) VALUES (?, ?, ?)
    ");

    foreach ($container_nos as $container_no) {
        $insert_container->execute([
            generateId(),
            $appointment_id,
            $container_no
        ]);
    }

    $conn->commit();

    http_response_code(201);

    echo json_encode([
        "error" => false,
        "data" => "Appointment booked successfully.",
        "code" => [
            "id" => $appointment_id,
            "vehicle_id" => $vehicle_id,
            "vehicle_plate" => $vehicle["plate"],
            "driver_id" => $driver_id,
            "driver_name" => $driver["name"],
            "appointment_date" => $appointment_date,
            "slot_time" => $slot_time,
            "status" => "Confirmed",
            "container_nos" => $container_nos,
            "container_count" => count($container_nos)
        ]
    ]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Could not create appointment.",
        "code" => null
    ]);
}
