<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
    exit;
}

$vehicle_id = trim((string)($_POST["vehicle_id"] ?? ""));
$driver_id = trim((string)($_POST["driver_id"] ?? ""));
$raw_date = trim((string)($_POST["appointment_date"] ?? ""));
$slot_time = trim((string)($_POST["slot_time"] ?? ""));
$container_nos = $_POST["container_nos"] ?? [];
$type = trim((string)($_POST["type"] ?? "Terminal Entry"));

if (!is_array($container_nos)) {
    echo json_encode(["error" => true, "data" => "Container numbers must be an array.", "code" => null]);
    exit;
}

$original_container_count = count($container_nos);

$container_nos = array_map(
    static fn($c) => strtoupper(trim((string)$c)),
    $container_nos
);

$container_nos = array_values(array_unique(array_filter(
    $container_nos,
    static fn($c) => $c !== ""
)));

if (
    empty($vehicle_id) ||
    empty($driver_id) ||
    empty($raw_date) ||
    empty($slot_time) ||
    empty($container_nos)
) {
    echo json_encode([
        "error" => true,
        "data" => "Vehicle, driver, date, time slot, and at least one container are required.",
        "code" => null
    ]);
    exit;
}

if (count($container_nos) !== $original_container_count || count($container_nos) > 100) {
    echo json_encode([
        "error" => true,
        "data" => "Remove empty or duplicate containers. Maximum 100 allowed.",
        "code" => null
    ]);
    exit;
}

foreach ($container_nos as $c_no) {
    if (mb_strlen($c_no) > 30) {
        echo json_encode([
            "error" => true,
            "data" => "A container number exceeds the allowed length.",
            "code" => null
        ]);
        exit;
    }
}

$appointment_dt = DateTime::createFromFormat("!Y-m-d", $raw_date);

if (!$appointment_dt || $appointment_dt->format("Y-m-d") !== $raw_date) {
    echo json_encode([
        "error" => true,
        "data" => "Invalid appointment date format (YYYY-MM-DD).",
        "code" => null
    ]);
    exit;
}

$appointment_date = $appointment_dt->format("Y-m-d 00:00:00");

if ($appointment_dt->format("Y-m-d") < date("Y-m-d")) {
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

try {
    $conn->beginTransaction();

    $vehicle_stmt = $conn->prepare("
        SELECT id, plate, status, insurance_expiry, roadworthiness_expiry
        FROM gate_vehicles
        WHERE id = :id
        FOR UPDATE
    ");

    $vehicle_stmt->execute([":id" => $vehicle_id]);
    $vehicle = $vehicle_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$vehicle) {
        throw new RuntimeException("Selected vehicle was not found.");
    }

    if (
        $vehicle["status"] !== "Approved" ||
        empty($vehicle["insurance_expiry"]) ||
        $vehicle["insurance_expiry"] < date("Y-m-d") ||
        empty($vehicle["roadworthiness_expiry"]) ||
        $vehicle["roadworthiness_expiry"] < date("Y-m-d")
    ) {
        throw new RuntimeException(
            "Vehicle approval, insurance, or roadworthiness is invalid or expired."
        );
    }

    $driver_stmt = $conn->prepare("
        SELECT id, name, status, licence_expiry
        FROM gate_drivers
        WHERE id = :id
        FOR UPDATE
    ");

    $driver_stmt->execute([":id" => $driver_id]);
    $driver = $driver_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$driver) {
        throw new RuntimeException("Selected driver was not found.");
    }

    if (
        $driver["status"] !== "Approved" ||
        empty($driver["licence_expiry"]) ||
        $driver["licence_expiry"] < date("Y-m-d")
    ) {
        throw new RuntimeException(
            "Driver approval or licence validity is invalid or expired."
        );
    }

    $assignment_stmt = $conn->prepare("
        SELECT id
        FROM gate_driver_vehicle_assignments
        WHERE driver_id = :driver_id
        AND vehicle_id = :vehicle_id
        AND unassigned_at IS NULL
        LIMIT 1
        FOR UPDATE
    ");

    $assignment_stmt->execute([
        ":driver_id" => $driver_id,
        ":vehicle_id" => $vehicle_id
    ]);

    if (!$assignment_stmt->fetch(PDO::FETCH_ASSOC)) {
        throw new RuntimeException(
            "The selected driver is not actively assigned to this vehicle."
        );
    }

    $conflict_stmt = $conn->prepare("
        SELECT id
        FROM gate_appointments
        WHERE appointment_date = :date
        AND slot_time = :slot
        AND status IN ('Confirmed', 'Arrived', 'In Terminal')
        AND (vehicle_id = :vehicle_id OR driver_id = :driver_id)
        LIMIT 1
        FOR UPDATE
    ");

    $conflict_stmt->execute([
        ":date" => $appointment_date,
        ":slot" => $slot_time,
        ":vehicle_id" => $vehicle_id,
        ":driver_id" => $driver_id
    ]);

    if ($conflict_stmt->fetch(PDO::FETCH_ASSOC)) {
        throw new RuntimeException(
            "This vehicle or driver already has an active appointment for that time slot."
        );
    }

    $container_placeholders = [];
    $container_params = [":date" => $appointment_date];

    foreach ($container_nos as $index => $c_no) {
        $placeholder = ":c_" . $index;
        $container_placeholders[] = $placeholder;
        $container_params[$placeholder] = $c_no;
    }

    $in_clause = implode(", ", $container_placeholders);

    $container_conflict_stmt = $conn->prepare("
        SELECT ac.container_no
        FROM gate_appointment_containers ac
        INNER JOIN gate_appointments a
            ON a.id = ac.appointment_id
        WHERE a.appointment_date = :date
        AND a.status IN ('Confirmed', 'Arrived', 'In Terminal')
        AND ac.container_no IN ($in_clause)
        LIMIT 1
        FOR UPDATE
    ");

    $container_conflict_stmt->execute($container_params);
    $container_conflict = $container_conflict_stmt->fetch(PDO::FETCH_ASSOC);

    if ($container_conflict) {
        throw new RuntimeException(
            "Container {$container_conflict['container_no']} already has an active appointment on this date."
        );
    }

    $appointment_id = generateId();
    $organisation_id = $my_details->organisation_id ?? null;
    $booking_ref = "TRN-AP-" . date("Y") . "-" . strtoupper(bin2hex(random_bytes(6)));

    $insert_appointment = $conn->prepare("
        INSERT INTO gate_appointments (
            id,
            booking_ref,
            organisation_id,
            vehicle_id,
            driver_id,
            appointment_date,
            slot_time,
            status,
            created_by
        ) VALUES (
            :id,
            :booking_ref,
            :org_id,
            :vehicle_id,
            :driver_id,
            :date,
            :slot,
            'Confirmed',
            :created_by
        )
    ");

    $insert_appointment->execute([
        ":id" => $appointment_id,
        ":booking_ref" => $booking_ref,
        ":org_id" => $organisation_id,
        ":vehicle_id" => $vehicle_id,
        ":driver_id" => $driver_id,
        ":date" => $appointment_date,
        ":slot" => $slot_time,
        ":created_by" => $my_details->id
    ]);

    $insert_container = $conn->prepare("
        INSERT INTO gate_appointment_containers (
            id,
            appointment_id,
            container_no
        ) VALUES (
            :id,
            :appointment_id,
            :container_no
        )
    ");

    foreach ($container_nos as $c_no) {
        $insert_container->execute([
            ":id" => generateId(),
            ":appointment_id" => $appointment_id,
            ":container_no" => $c_no
        ]);
    }

    $pass_id = generateId();
    $pass_code = "TRN-GP-" . date("Y") . "-" . strtoupper(bin2hex(random_bytes(6)));

    $insert_pass = $conn->prepare("
        INSERT INTO gate_passes (
            id,
            organisation_id,
            pass_code,
            appointment_id,
            vehicle_id,
            driver_id,
            type,
            status,
            issued_by
        ) VALUES (
            :id,
            :organisation_id,
            :pass_code,
            :appointment_id,
            :vehicle_id,
            :driver_id,
            :type,
            'Active',
            :issued_by
        )
    ");

    $insert_pass->execute([
        ":id" => $pass_id,
        ":organisation_id" => $organisation_id,
        ":pass_code" => $pass_code,
        ":appointment_id" => $appointment_id,
        ":vehicle_id" => $vehicle_id,
        ":driver_id" => $driver_id,
        ":type" => $type,
        ":issued_by" => $my_details->id
    ]);

    $shipment_status_updates = [];

    $shipment_lookup_stmt = $conn->prepare("
        SELECT DISTINCT psc.shipment_id
        FROM portal_shipment_containers psc
        INNER JOIN portal_shipments ps
            ON ps.id = psc.shipment_id
        WHERE UPPER(TRIM(psc.container_no)) IN ($in_clause)
        AND ps.organisation_id = :organisation_id
    ");

    $shipment_lookup_params = [];

    foreach ($container_nos as $index => $c_no) {
        $shipment_lookup_params[":c_" . $index] = $c_no;
    }

    $shipment_lookup_params[":organisation_id"] = $organisation_id;

    $shipment_lookup_stmt->execute($shipment_lookup_params);
    $shipment_ids = $shipment_lookup_stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($shipment_ids as $shipment_id) {
        $shipment_stmt = $conn->prepare("
            SELECT id, status
            FROM portal_shipments
            WHERE id = :shipment_id
            FOR UPDATE
        ");

        $shipment_stmt->execute([
            ":shipment_id" => $shipment_id
        ]);

        $shipment = $shipment_stmt->fetch(PDO::FETCH_ASSOC);

        if (!$shipment) {
            continue;
        }

        $shipment_progress_stmt = $conn->prepare("
            SELECT
                COUNT(DISTINCT psc.id) AS total_containers,
                COUNT(DISTINCT CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM gate_appointment_containers gac
                        INNER JOIN gate_appointments ga
                            ON ga.id = gac.appointment_id
                        WHERE UPPER(TRIM(gac.container_no)) = UPPER(TRIM(psc.container_no))
                        AND ga.status IN ('Confirmed', 'Arrived', 'In Terminal')
                    )
                    THEN psc.id
                END) AS scheduled_containers
            FROM portal_shipment_containers psc
            WHERE psc.shipment_id = :shipment_id
        ");

        $shipment_progress_stmt->execute([
            ":shipment_id" => $shipment_id
        ]);

        $shipment_progress = $shipment_progress_stmt->fetch(PDO::FETCH_ASSOC);

        $total_containers = (int)($shipment_progress["total_containers"] ?? 0);
        $scheduled_containers = (int)($shipment_progress["scheduled_containers"] ?? 0);
        $current_status = strtoupper(trim((string)$shipment["status"]));

        if ($total_containers < 1 || $scheduled_containers < 1) {
            continue;
        }

        $next_shipment_status = $scheduled_containers >= $total_containers
            ? "SCHEDULED"
            : "PARTIALLY_SCHEDULED";

        $scheduling_statuses = [
            "EXPECTED",
            "PARTIALLY_SCHEDULED",
            "SCHEDULED"
        ];

        if (!in_array($current_status, $scheduling_statuses, true)) {
            $shipment_status_updates[] = [
                "shipment_id" => $shipment_id,
                "total_containers" => $total_containers,
                "scheduled_containers" => $scheduled_containers,
                "previous_status" => $shipment["status"],
                "status" => $shipment["status"],
                "updated" => false,
                "reason" => "Shipment has already progressed beyond appointment scheduling."
            ];

            continue;
        }

        $status_rank = [
            "EXPECTED" => 0,
            "PARTIALLY_SCHEDULED" => 1,
            "SCHEDULED" => 2
        ];

        if ($status_rank[$next_shipment_status] < $status_rank[$current_status]) {
            $next_shipment_status = $current_status;
        }

        $update_shipment_status = $conn->prepare("
            UPDATE portal_shipments
            SET status = :status
            WHERE id = :shipment_id
            AND status = :current_status
            AND status IN ('EXPECTED', 'SCHEDULED', 'PARTIALLY_SCHEDULED')
        ");

        $update_shipment_status->execute([
            ":status" => $next_shipment_status,
            ":shipment_id" => $shipment_id,
            ":current_status" => $shipment["status"]
        ]);

        $updated = $update_shipment_status->rowCount() > 0;

        $shipment_status_updates[] = [
            "shipment_id" => $shipment_id,
            "total_containers" => $total_containers,
            "scheduled_containers" => $scheduled_containers,
            "previous_status" => $shipment["status"],
            "status" => $updated ? $next_shipment_status : $shipment["status"],
            "updated" => $updated
        ];
    }

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Appointment booked successfully.",
        "code" => [
            "id" => $appointment_id,
            "booking_ref" => $booking_ref,
            "gate_pass_id" => $pass_id,
            "pass_code" => $pass_code,
            "vehicle_id" => $vehicle_id,
            "vehicle_plate" => $vehicle["plate"],
            "driver_id" => $driver_id,
            "driver_name" => $driver["name"],
            "appointment_date" => $appointment_date,
            "slot_time" => $slot_time,
            "status" => "Confirmed",
            "container_nos" => $container_nos,
            "container_count" => count($container_nos),
            "shipment_statuses" => $shipment_status_updates
        ]
    ]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log("Appointment Booking Error: " . $e->getMessage());

    $message = $e instanceof RuntimeException
        ? $e->getMessage()
        : "Could not create appointment.";

    echo json_encode([
        "error" => true,
        "data" => $message,
        "code" => null
    ]);
}