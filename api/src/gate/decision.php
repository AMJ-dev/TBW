
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

$recordId = trim((string)($_POST["record_id"] ?? ""));
$appointmentId = trim((string)($_POST["appointment_id"] ?? ""));
$passId = trim((string)($_POST["gate_pass_id"] ?? ""));
$passCode = trim((string)($_POST["pass_code"] ?? ""));
$direction = strtolower(trim((string)($_POST["direction"] ?? "")));
$decision = strtoupper(trim((string)($_POST["decision"] ?? "")));
$reason = trim((string)($_POST["reason"] ?? ""));
$overrideReason = trim((string)($_POST["override_reason"] ?? ""));

if ($passId === "" && $passCode === "" && $recordId === "" && $appointmentId === "") {
    http_response_code(422);
    echo json_encode([
        "error" => true,
        "data" => "A gate pass, pass code, appointment or movement record ID is required.",
        "code" => null
    ]);
    exit;
}

if (
    !in_array($direction, ["in", "out"], true) ||
    !in_array($decision, ["ADMIT", "REFER", "REJECT"], true)
) {
    http_response_code(422);
    echo json_encode([
        "error" => true,
        "data" => "Provide a valid direction and decision.",
        "code" => null
    ]);
    exit;
}

if (in_array($decision, ["REFER", "REJECT"], true) && strlen($reason) < 5) {
    http_response_code(422);
    echo json_encode([
        "error" => true,
        "data" => "Provide a reason of at least 5 characters for REFER or REJECT.",
        "code" => null
    ]);
    exit;
}

try {
    $conn->beginTransaction();

    $sql = "
        SELECT
            a.id AS appointment_id,
            a.appointment_date,
            a.slot_time,
            a.status AS appointment_status,
            a.vehicle_id,
            a.driver_id,
            v.plate,
            v.transporter,
            v.status AS vehicle_status,
            v.insurance_expiry,
            v.roadworthiness_expiry,
            d.name AS driver_name,
            d.phone AS driver_phone,
            d.status AS driver_status,
            d.licence_expiry,
            p.id AS gate_pass_id,
            p.pass_code,
            p.type AS pass_type,
            p.status AS pass_status,
            p.valid_until,
            p.issued_at,
            (
                SELECT GROUP_CONCAT(
                    UPPER(TRIM(pc.container_no))
                    ORDER BY UPPER(TRIM(pc.container_no))
                    SEPARATOR ','
                )
                FROM gate_pass_containers pc
                WHERE pc.gate_pass_id = p.id
            ) AS pass_containers,
            (
                SELECT GROUP_CONCAT(
                    UPPER(TRIM(ac.container_no))
                    ORDER BY UPPER(TRIM(ac.container_no))
                    SEPARATOR ','
                )
                FROM gate_appointment_containers ac
                WHERE ac.appointment_id = a.id
            ) AS appointment_containers
        FROM gate_passes p
        INNER JOIN gate_appointments a
            ON a.id = p.appointment_id
        INNER JOIN gate_vehicles v
            ON v.id = p.vehicle_id
        INNER JOIN gate_drivers d
            ON d.id = p.driver_id
        WHERE
            (? <> '' AND p.id = ?)
            OR (? <> '' AND p.pass_code = ?)
            OR (? <> '' AND a.id = ?)
            OR (? <> '' AND a.id = ?)
        LIMIT 1
        FOR UPDATE
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        $passId,
        $passId,
        $passCode,
        $passCode,
        $appointmentId,
        $appointmentId,
        $recordId,
        $recordId
    ]);

    $record = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$record) {
        $conn->rollBack();
        http_response_code(404);
        echo json_encode([
            "error" => true,
            "data" => "No matching appointment and gate pass were found.",
            "code" => null
        ]);
        exit;
    }

    if ($passId !== "" && $record["gate_pass_id"] !== $passId) {
        throw new InvalidArgumentException("The supplied gate pass does not match the appointment.");
    }

    if ($passCode !== "" && $record["pass_code"] !== $passCode) {
        throw new InvalidArgumentException("The supplied pass code does not match the appointment.");
    }

    if ($appointmentId !== "" && $record["appointment_id"] !== $appointmentId) {
        throw new InvalidArgumentException("The supplied appointment does not match the gate pass.");
    }

    if ($recordId !== "" && $record["appointment_id"] !== $recordId) {
        throw new InvalidArgumentException("The supplied record ID does not match the appointment.");
    }

    $today = date("Y-m-d");
    $now = time();

    $vehicleStatus = strtolower(trim((string)$record["vehicle_status"]));
    $driverStatus = strtolower(trim((string)$record["driver_status"]));
    $passStatus = strtolower(trim((string)$record["pass_status"]));
    $appointmentStatus = strtolower(trim((string)$record["appointment_status"]));

    $vehicleEligible =
        $vehicleStatus === "approved" &&
        !empty($record["insurance_expiry"]) &&
        $record["insurance_expiry"] >= $today &&
        !empty($record["roadworthiness_expiry"]) &&
        $record["roadworthiness_expiry"] >= $today;

    $driverEligible =
        $driverStatus === "approved" &&
        !empty($record["licence_expiry"]) &&
        $record["licence_expiry"] >= $today;

    $passExpiry = !empty($record["valid_until"])
        ? strtotime((string)$record["valid_until"])
        : false;

    $passEligible =
        $passStatus === "active" &&
        $passExpiry !== false &&
        $passExpiry > $now;

    $appointmentDate = (string)$record["appointment_date"];

    $appointmentEligible =
        $appointmentDate === $today &&
        (
            $direction === "in"
                ? in_array($appointmentStatus, ["confirmed", "arrived"], true)
                : $appointmentStatus === "in terminal"
        );

    $passContainers = !empty($record["pass_containers"])
        ? array_values(array_unique(array_filter(array_map(
            "trim",
            explode(",", strtoupper((string)$record["pass_containers"]))
        ))))
        : [];

    $appointmentContainers = !empty($record["appointment_containers"])
        ? array_values(array_unique(array_filter(array_map(
            "trim",
            explode(",", strtoupper((string)$record["appointment_containers"]))
        ))))
        : [];

    sort($passContainers);
    sort($appointmentContainers);

    $containerListsMatch =
        count($appointmentContainers) > 0 &&
        count($passContainers) > 0 &&
        $passContainers === $appointmentContainers;

    $cargoChecks = [];
    $cargoEligible = $containerListsMatch;

    if (!$containerListsMatch) {
        $cargoChecks[] = "Gate pass containers do not exactly match appointment containers";
    } else {
        $placeholders = implode(",", array_fill(0, count($appointmentContainers), "?"));

        $cargoSql = "
            SELECT
                UPPER(TRIM(pc.container_no)) AS container_no,
                UPPER(TRIM(pc.status)) AS container_status,
                LOWER(TRIM(ps.status)) AS shipment_status,
                pc.gate_in_at,
                pc.received_at
            FROM portal_shipment_containers pc
            INNER JOIN portal_shipments ps
                ON ps.id = pc.shipment_id
            WHERE UPPER(TRIM(pc.container_no)) IN ($placeholders)
            FOR UPDATE
        ";

        $cargoStmt = $conn->prepare($cargoSql);
        $cargoStmt->execute($appointmentContainers);
        $cargoRows = $cargoStmt->fetchAll(PDO::FETCH_ASSOC);

        $cargoByNumber = [];

        foreach ($cargoRows as $cargoRow) {
            $cargoByNumber[$cargoRow["container_no"]][] = $cargoRow;
        }

        foreach ($appointmentContainers as $containerNo) {
            if (!isset($cargoByNumber[$containerNo])) {
                $cargoEligible = false;
                $cargoChecks[] = "Container " . $containerNo . " is not registered against a shipment";
                continue;
            }

            if (count($cargoByNumber[$containerNo]) !== 1) {
                $cargoEligible = false;
                $cargoChecks[] = "Container " . $containerNo . " matches multiple shipment records";
                continue;
            }

            $cargo = $cargoByNumber[$containerNo][0];

            $eligibleContainerStatuses = [
                "EXPECTED",
                "IN_TRANSIT_TO_TERMINAL",
                "ARRIVED_AT_GATE"
            ];

            $eligibleShipmentStatuses = [
                "expected",
                "in_transit_to_terminal",
                "arrived_at_gate"
            ];

            if (!in_array($cargo["container_status"], $eligibleContainerStatuses, true)) {
                $cargoEligible = false;
                $cargoChecks[] = "Container " . $containerNo . " has an ineligible status: " . $cargo["container_status"];
            }

            if (!in_array($cargo["shipment_status"], $eligibleShipmentStatuses, true)) {
                $cargoEligible = false;
                $cargoChecks[] = "Shipment for container " . $containerNo . " is not eligible for gate-in";
            }

            if (
                $cargo["container_status"] === "ARRIVED_AT_GATE" &&
                !empty($cargo["gate_in_at"])
            ) {
                $cargoEligible = false;
                $cargoChecks[] = "Container " . $containerNo . " already has a gate-in timestamp";
            }

            if (
                $cargo["container_status"] === "RECEIVED" ||
                !empty($cargo["received_at"])
            ) {
                $cargoEligible = false;
                $cargoChecks[] = "Container " . $containerNo . " has already been received";
            }
        }
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
    $assignmentStmt->execute([
        $record["vehicle_id"],
        $record["driver_id"]
    ]);

    $assignmentEligible = (bool)$assignmentStmt->fetch(PDO::FETCH_ASSOC);

    $holds = [];

    if (!$vehicleEligible) {
        $holds[] = "Vehicle approval or required documents are invalid or expired";
    }

    if (!$driverEligible) {
        $holds[] = "Driver approval or driving licence is invalid or expired";
    }

    if (!$assignmentEligible) {
        $holds[] = "Driver is not currently assigned to this vehicle";
    }

    if (!$passEligible) {
        $holds[] = "Gate pass is expired, revoked, redeemed or otherwise inactive";
    }

    if (!$appointmentEligible) {
        $holds[] = "Appointment date or status does not permit this movement";
    }

    if (!$containerListsMatch) {
        $holds[] = "Gate pass containers do not match the appointment containers";
    }

    foreach ($cargoChecks as $cargoCheck) {
        $holds[] = $cargoCheck;
    }

    if ($direction === "in") {
        if (!in_array($record["pass_type"], ["Terminal Entry", "Collection"], true)) {
            $holds[] = "Pass type does not permit gate-in";
        }

        if (!in_array($appointmentStatus, ["confirmed", "arrived"], true)) {
            $holds[] = "Appointment status does not permit gate-in";
        }

        $duplicateStmt = $conn->prepare("
            SELECT id
            FROM gate_movement_records
            WHERE appointment_id = ?
              AND direction = 'in'
              AND decision = 'ADMIT'
            LIMIT 1
            FOR UPDATE
        ");
        $duplicateStmt->execute([$record["appointment_id"]]);

        if ($duplicateStmt->fetch(PDO::FETCH_ASSOC)) {
            $holds[] = "Appointment has already been admitted";
        }
    } else {
        if ($record["pass_type"] !== "Gate-Out Clearance") {
            $holds[] = "A Gate-Out Clearance pass is required for gate-out";
        }

        if ($appointmentStatus !== "in terminal") {
            $holds[] = "Appointment is not currently in the terminal";
        }

        $holds[] = "Financial clearance has not been verified against authoritative finance records";
        $holds[] = "Release authorisation has not been verified against authoritative release records";

        $duplicateStmt = $conn->prepare("
            SELECT id
            FROM gate_movement_records
            WHERE appointment_id = ?
              AND direction = 'out'
              AND decision = 'ADMIT'
            LIMIT 1
            FOR UPDATE
        ");
        $duplicateStmt->execute([$record["appointment_id"]]);

        if ($duplicateStmt->fetch(PDO::FETCH_ASSOC)) {
            $holds[] = "Appointment has already been cleared for gate-out";
        }
    }

    $holds = array_values(array_unique($holds));

    $checks = [
        "vehicle" => $vehicleEligible,
        "driver" => $driverEligible && $assignmentEligible,
        "appointment" => $appointmentEligible,
        "cargo" => $cargoEligible,
        "financial" => false,
        "release" => false
    ];

    if ($decision === "ADMIT" && count($holds) > 0) {
        $conn->rollBack();
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Admission blocked. Resolve the outstanding checks first.",
            "code" => [
                "holds" => $holds,
                "checks" => $checks
            ]
        ]);
        exit;
    }

    if ($decision === "ADMIT" && $direction === "out") {
        $conn->rollBack();
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Gate-out is blocked until financial clearance and release authorisation are verified by the server.",
            "code" => [
                "holds" => $holds,
                "checks" => $checks
            ]
        ]);
        exit;
    }

    if ($decision === "ADMIT" && $direction === "in" && $overrideReason !== "") {
        $conn->rollBack();
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "An override cannot bypass failed vehicle, driver, pass, appointment or cargo eligibility checks.",
            "code" => [
                "holds" => $holds,
                "checks" => $checks
            ]
        ]);
        exit;
    }

    $movementId = generateId();
    $operatorId = $my_details->id ?? null;

    $insert = $conn->prepare("
        INSERT INTO gate_movement_records (
            id,
            appointment_id,
            gate_pass_id,
            vehicle_id,
            driver_id,
            direction,
            decision,
            reason,
            override_reason,
            operator_id,
            movement_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    $insert->execute([
        $movementId,
        $record["appointment_id"],
        $record["gate_pass_id"],
        $record["vehicle_id"],
        $record["driver_id"],
        $direction,
        $decision,
        $reason !== "" ? $reason : null,
        $overrideReason !== "" ? $overrideReason : null,
        $operatorId
    ]);

    if ($direction === "in" && $decision === "ADMIT") {
        $updateAppointment = $conn->prepare("
            UPDATE gate_appointments
            SET status = 'In Terminal'
            WHERE id = ?
              AND status IN ('Confirmed', 'Arrived')
        ");
        $updateAppointment->execute([$record["appointment_id"]]);

        if ($updateAppointment->rowCount() !== 1) {
            throw new RuntimeException("Appointment status changed before admission could be completed.");
        }

        $updatePass = $conn->prepare("
            UPDATE gate_passes
            SET status = 'Redeemed'
            WHERE id = ?
              AND status = 'Active'
              AND valid_until > NOW()
        ");
        $updatePass->execute([$record["gate_pass_id"]]);

        if ($updatePass->rowCount() !== 1) {
            throw new RuntimeException("Gate pass is no longer active.");
        }

        $containerUpdate = $conn->prepare("
            UPDATE portal_shipment_containers
            SET status = 'ARRIVED_AT_GATE',
                gate_in_at = NOW()
            WHERE UPPER(TRIM(container_no)) = ?
              AND UPPER(TRIM(status)) IN (
                  'EXPECTED',
                  'IN_TRANSIT_TO_TERMINAL'
              )
              AND gate_in_at IS NULL
              AND received_at IS NULL
        ");

        foreach ($appointmentContainers as $containerNo) {
            $containerUpdate->execute([$containerNo]);

            if ($containerUpdate->rowCount() !== 1) {
                throw new RuntimeException(
                    "Container " . $containerNo . " could not be updated to ARRIVED_AT_GATE. The admission was rolled back."
                );
            }
        }
    }

    $audit = $conn->prepare("
        INSERT INTO gate_movement_audit (
            id,
            movement_id,
            appointment_id,
            gate_pass_id,
            operator_id,
            event_type,
            event_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $audit->execute([
        generateId(),
        $movementId,
        $record["appointment_id"],
        $record["gate_pass_id"],
        $operatorId,
        "GATE_" . strtoupper($direction) . "_" . $decision,
        json_encode([
            "plate" => $record["plate"],
            "pass_code" => $record["pass_code"],
            "direction" => $direction,
            "decision" => $decision,
            "reason" => $reason,
            "override_reason" => $overrideReason,
            "holds" => $holds,
            "checks" => $checks,
            "containers" => $appointmentContainers
        ], JSON_UNESCAPED_SLASHES)
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Gate decision recorded successfully.",
        "code" => [
            "id" => $movementId,
            "record_id" => $record["appointment_id"],
            "appointment_id" => $record["appointment_id"],
            "gate_pass_id" => $record["gate_pass_id"],
            "pass_code" => $record["pass_code"],
            "direction" => $direction,
            "decision" => $decision,
            "reason" => $reason,
            "recorded_at" => date("Y-m-d H:i:s")
        ]
    ]);
} catch (InvalidArgumentException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(422);
    echo json_encode([
        "error" => true,
        "data" => $e->getMessage(),
        "code" => null
    ]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not record gate decision.",
        "code" => $e->getMessage()
    ]);
}
