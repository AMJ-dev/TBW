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
    $type = trim((string)($_POST["type"] ?? "Terminal Entry"));
    $valid_until = trim((string)($_POST["valid_until"] ?? ""));
    $container_nos = $_POST["container_nos"] ?? [];

    if (
        $vehicle_id === "" ||
        $driver_id === "" ||
        $valid_until === "" ||
        !in_array($type, ["Terminal Entry", "Gate-Out Clearance", "Collection"], true) ||
        !is_array($container_nos)
    ) {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Provide a vehicle, assigned driver, pass type, validity date and container list.",
            "code" => null
        ]);
        exit;
    }

    $validDate = DateTime::createFromFormat("!Y-m-d H:i:s", $valid_until)
        ?: DateTime::createFromFormat("!Y-m-d\TH:i", $valid_until)
        ?: DateTime::createFromFormat("!Y-m-d\TH:i:s", $valid_until);

    if (!$validDate) {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Invalid validity date.",
            "code" => null
        ]);
        exit;
    }

    $validUntilValue = $validDate->format("Y-m-d H:i:s");

    if ($validDate->getTimestamp() <= time()) {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "The pass validity must be in the future.",
            "code" => null
        ]);
        exit;
    }

    $normalizedContainers = [];

    foreach ($container_nos as $container) {
        if (!is_string($container) && !is_numeric($container)) {
            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "Invalid container number.",
                "code" => null
            ]);
            exit;
        }

        $container = strtoupper(trim((string)$container));

        if ($container === "") {
            continue;
        }

        if (strlen($container) > 30) {
            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "A container number exceeds 30 characters.",
                "code" => null
            ]);
            exit;
        }

        $normalizedContainers[] = $container;
    }

    $normalizedContainers = array_values(array_unique($normalizedContainers));

    if (count($normalizedContainers) === 0) {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Add at least one container number.",
            "code" => null
        ]);
        exit;
    }

    if (count($normalizedContainers) > 100) {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "A maximum of 100 containers is allowed per pass.",
            "code" => null
        ]);
        exit;
    }

    try {
        $conn->beginTransaction();

        $vehicleStmt = $conn->prepare("
            SELECT id, plate, status, insurance_expiry, roadworthiness_expiry
            FROM gate_vehicles
            WHERE id = ?
            FOR UPDATE
        ");
        $vehicleStmt->execute([$vehicle_id]);
        $vehicle = $vehicleStmt->fetch(PDO::FETCH_ASSOC);

        if (!$vehicle) {
            $conn->rollBack();
            http_response_code(404);
            echo json_encode([
                "error" => true,
                "data" => "Vehicle not found.",
                "code" => null
            ]);
            exit;
        }

        if (strtolower((string)$vehicle["status"]) !== "approved") {
            $conn->rollBack();
            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "Only approved vehicles can be issued gate passes.",
                "code" => null
            ]);
            exit;
        }

        if (
            empty($vehicle["insurance_expiry"]) ||
            $vehicle["insurance_expiry"] < date("Y-m-d") ||
            empty($vehicle["roadworthiness_expiry"]) ||
            $vehicle["roadworthiness_expiry"] < date("Y-m-d")
        ) {
            $conn->rollBack();
            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "The vehicle insurance or roadworthiness certificate is expired or missing.",
                "code" => null
            ]);
            exit;
        }

        $driverStmt = $conn->prepare("
            SELECT id, name, phone, status, licence_expiry
            FROM gate_drivers
            WHERE id = ?
            FOR UPDATE
        ");
        $driverStmt->execute([$driver_id]);
        $driver = $driverStmt->fetch(PDO::FETCH_ASSOC);

        if (!$driver) {
            $conn->rollBack();
            http_response_code(404);
            echo json_encode([
                "error" => true,
                "data" => "Driver not found.",
                "code" => null
            ]);
            exit;
        }

        if (strtolower((string)$driver["status"]) !== "approved") {
            $conn->rollBack();
            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "Only approved drivers can be issued gate passes.",
                "code" => null
            ]);
            exit;
        }

        if (
            empty($driver["licence_expiry"]) ||
            $driver["licence_expiry"] < date("Y-m-d")
        ) {
            $conn->rollBack();
            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "The driver's licence is expired or missing.",
                "code" => null
            ]);
            exit;
        }

        $assignmentStmt = $conn->prepare("
            SELECT id
            FROM gate_driver_vehicle_assignments
            WHERE vehicle_id = ?
            AND driver_id = ?
            AND unassigned_at IS NULL
            LIMIT 1
            FOR UPDATE
        ");
        $assignmentStmt->execute([$vehicle_id, $driver_id]);

        if (!$assignmentStmt->fetch(PDO::FETCH_ASSOC)) {
            $conn->rollBack();
            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "The selected driver is not currently assigned to this vehicle.",
                "code" => null
            ]);
            exit;
        }

        $appointmentStmt = $conn->prepare("
            SELECT a.id, a.vehicle_id, a.driver_id, a.status, a.appointment_date
            FROM gate_appointments a
            WHERE a.vehicle_id = ?
            AND a.driver_id = ?
            AND a.status = 'Confirmed'
            AND a.appointment_date >= CURDATE()
            ORDER BY a.appointment_date ASC, a.created_at ASC
            FOR UPDATE
        ");
        $appointmentStmt->execute([$vehicle_id, $driver_id]);
        $appointments = $appointmentStmt->fetchAll(PDO::FETCH_ASSOC);

        $appointment = null;
        $matchedAppointmentContainers = [];

        $appointmentContainersStmt = $conn->prepare("
            SELECT container_no
            FROM gate_appointment_containers
            WHERE appointment_id = ?
        ");

        foreach ($appointments as $candidate) {
            $appointmentContainersStmt->execute([$candidate["id"]]);

            $candidateContainers = $appointmentContainersStmt->fetchAll(PDO::FETCH_COLUMN);

            $candidateContainers = array_values(array_unique(array_map(
                fn($container) => strtoupper(trim((string)$container)),
                $candidateContainers
            )));

            if (
                count(array_diff($normalizedContainers, $candidateContainers)) === 0
            ) {
                $appointment = $candidate;
                $matchedAppointmentContainers = $candidateContainers;
                break;
            }
        }

        if (!$appointment) {
            $conn->rollBack();
            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "No confirmed upcoming appointment matches this vehicle, driver and container list.",
                "code" => null
            ]);
            exit;
        }

        $existingPassStmt = $conn->prepare("
            SELECT id
            FROM gate_passes
            WHERE appointment_id = ?
            AND status = 'Active'
            AND valid_until > NOW()
            LIMIT 1
            FOR UPDATE
        ");
        $existingPassStmt->execute([$appointment["id"]]);

        if ($existingPassStmt->fetch(PDO::FETCH_ASSOC)) {
            $conn->rollBack();
            http_response_code(409);
            echo json_encode([
                "error" => true,
                "data" => "An active gate pass already exists for this appointment.",
                "code" => null
            ]);
            exit;
        }

        $passId = generateId();
        $passCode = "TRN-GP-" . date("Y") . "-" . strtoupper(bin2hex(random_bytes(6)));
        $createdBy = $my_details->id ?? null;

        $insertPass = $conn->prepare("
            INSERT INTO gate_passes (
                id,
                pass_code,
                appointment_id,
                vehicle_id,
                driver_id,
                type,
                valid_until,
                status,
                issued_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', ?)
        ");

        $insertPass->execute([
            $passId,
            $passCode,
            $appointment["id"],
            $vehicle_id,
            $driver_id,
            $type,
            $validUntilValue,
            $createdBy
        ]);

        $insertContainer = $conn->prepare("
            INSERT INTO gate_pass_containers (
                id,
                gate_pass_id,
                container_no
            ) VALUES (?, ?, ?)
        ");

        foreach ($normalizedContainers as $containerNo) {
            $insertContainer->execute([
                generateId(),
                $passId,
                $containerNo
            ]);
        }

        $conn->commit();

        http_response_code(201);
        echo json_encode([
            "error" => false,
            "data" => "Gate pass issued successfully.",
            "code" => [
                "id" => $passId,
                "pass_code" => $passCode,
                "appointment_id" => $appointment["id"],
                "appointment_date" => $appointment["appointment_date"],
                "vehicle_id" => $vehicle_id,
                "vehicle_plate" => $vehicle["plate"],
                "driver_id" => $driver_id,
                "driver_name" => $driver["name"],
                "driver_phone" => $driver["phone"],
                "type" => $type,
                "issued_at" => date("Y-m-d H:i:s"),
                "valid_until" => $validUntilValue,
                "status" => "Active",
                "container_nos" => $normalizedContainers
            ]
        ]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(500);
        echo json_encode([
            "error" => true,
            "data" => "Could not issue gate pass.",
            "code" => $e->getMessage()
        ]);
    }