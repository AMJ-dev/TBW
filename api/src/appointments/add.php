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

    $container_nos = array_map(
        static fn($c) => strtoupper(trim((string)$c)),
        $container_nos
    );
    $container_nos = array_values(array_unique(array_filter($container_nos)));

    if (empty($vehicle_id) || empty($driver_id) || empty($raw_date) || empty($slot_time) || empty($container_nos)) {
        
        echo json_encode(["error" => true, "data" => "Vehicle, driver, date, time slot, and at least one container are required.", "code" => null]);
        exit;
    }

    if (count($container_nos) !== count($_POST["container_nos"]) || count($container_nos) > 100) {
        
        echo json_encode(["error" => true, "data" => "Remove empty or duplicate containers. Maximum 100 allowed.", "code" => null]);
        exit;
    }

    foreach ($container_nos as $c_no) {
        if (mb_strlen($c_no) > 30) {
            
            echo json_encode(["error" => true, "data" => "A container number exceeds the allowed length.", "code" => null]);
            exit;
        }
    }

    $appointment_dt = DateTime::createFromFormat("!Y-m-d", $raw_date);
    if (!$appointment_dt || $appointment_dt->format("Y-m-d") !== $raw_date) {
        
        echo json_encode(["error" => true, "data" => "Invalid appointment date format (YYYY-MM-DD).", "code" => null]);
        exit;
    }

    $appointment_date = $appointment_dt->format("Y-m-d 00:00:00");

    if ($appointment_dt->format("Y-m-d") < date("Y-m-d")) {
        
        echo json_encode(["error" => true, "data" => "Appointment date cannot be in the past.", "code" => null]);
        exit;
    }

    $allowed_slots = [
        "08:00 – 09:00", "09:00 – 10:00", "10:00 – 11:00", "11:00 – 12:00",
        "12:00 – 13:00", "13:00 – 14:00", "14:00 – 15:00", "15:00 – 16:00"
    ];

    if (!in_array($slot_time, $allowed_slots, true)) {
        
        echo json_encode(["error" => true, "data" => "Invalid appointment time slot.", "code" => null]);
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
            
            echo json_encode(["error" => true, "data" => "Selected vehicle was not found.", "code" => null]);
            exit;
        }

        if (
            $vehicle["status"] !== "Approved" ||
            empty($vehicle["insurance_expiry"]) || $vehicle["insurance_expiry"] < date("Y-m-d") ||
            empty($vehicle["roadworthiness_expiry"]) || $vehicle["roadworthiness_expiry"] < date("Y-m-d")
        ) {
            
            echo json_encode(["error" => true, "data" => "Vehicle approval, insurance, or roadworthiness is invalid or expired.", "code" => null]);
            exit;
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
            
            echo json_encode(["error" => true, "data" => "Selected driver was not found.", "code" => null]);
            exit;
        }

        if ($driver["status"] !== "Approved" || empty($driver["licence_expiry"]) || $driver["licence_expiry"] < date("Y-m-d")) {
            
            echo json_encode(["error" => true, "data" => "Driver approval or licence validity is invalid or expired.", "code" => null]);
            exit;
        }

        $assignment_stmt = $conn->prepare("
            SELECT id
            FROM gate_driver_vehicle_assignments
            WHERE driver_id = :driver_id AND vehicle_id = :vehicle_id AND unassigned_at IS NULL
            LIMIT 1
            FOR UPDATE
        ");
        $assignment_stmt->execute([":driver_id" => $driver_id, ":vehicle_id" => $vehicle_id]);

        if (!$assignment_stmt->fetch(PDO::FETCH_ASSOC)) {
            
            echo json_encode(["error" => true, "data" => "The selected driver is not actively assigned to this vehicle.", "code" => null]);
            exit;
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
            
            echo json_encode(["error" => true, "data" => "This vehicle or driver already has an active appointment for that time slot.", "code" => null]);
            exit;
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
            INNER JOIN gate_appointments a ON a.id = ac.appointment_id
            WHERE a.appointment_date = :date
            AND a.status IN ('Confirmed', 'Arrived', 'In Terminal')
            AND ac.container_no IN ($in_clause)
            LIMIT 1
            FOR UPDATE
        ");

        $container_conflict_stmt->execute($container_params);
        $container_conflict = $container_conflict_stmt->fetch(PDO::FETCH_ASSOC);

        if ($container_conflict) {
            
            echo json_encode([
                "error" => true,
                "data" => "Container {$container_conflict['container_no']} already has an active appointment on this date.",
                "code" => null
            ]);
            exit;
        }

        $appointment_id = generateId();
        $organisation_id = $my_details->organisation_id ?? null;
        $booking_ref = "TRN-AP-" . date("Y") . "-" . strtoupper(bin2hex(random_bytes(6)));
        
        $insert_appointment = $conn->prepare("
            INSERT INTO gate_appointments (
                id, booking_ref, organisation_id, vehicle_id, driver_id, 
                appointment_date, slot_time, status, created_by
            ) VALUES (
                :id, :booking_ref, :org_id, :vehicle_id, :driver_id, 
                :date, :slot, 'Confirmed', :created_by
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
            INSERT INTO gate_appointment_containers (id, appointment_id, container_no)
            VALUES (:id, :appointment_id, :container_no)
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
                id, organisation_id, pass_code, appointment_id, vehicle_id, driver_id, 
                type, valid_until, status, issued_by
            ) VALUES (
                :id, :organisation_id, :pass_code, :appointment_id, :vehicle_id, :driver_id, 
                :type, :valid_until, 'Active', :issued_by
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
            ":valid_until" => $appointment_date,
            ":issued_by" => $my_details->id
        ]);

        $conn->commit();

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
        
        error_log("Appointment Booking Error: " . $e->getMessage());

        
        echo json_encode([
            "error" => true,
            "data" => "Could not create appointment.",
            "code" => null
        ]);
    }