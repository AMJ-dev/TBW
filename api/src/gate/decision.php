<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    
        echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
        exit;
    }

    $passId = trim((string) ($_POST["gate_pass_id"] ?? ""));
    $passCode = trim((string) ($_POST["pass_code"] ?? ""));
    $appointmentId = trim((string) ($_POST["appointment_id"] ?? ""));
    $recordId = trim((string) ($_POST["record_id"] ?? ""));
    $direction = strtolower(trim((string) ($_POST["direction"] ?? "")));
    $decision = strtoupper(trim((string) ($_POST["decision"] ?? "")));
    $reason = trim((string) ($_POST["reason"] ?? ""));
    $overrideReason = trim((string) ($_POST["override_reason"] ?? ""));

    if (!in_array($direction, ["in", "out"], true) ||
        !in_array($decision, ["ADMIT", "REFER", "REJECT"], true)) {
        
        echo json_encode(["error" => true, "data" => "Invalid direction or decision.", "code" => null]);
        exit;
    }

    if ($passId === "" && $passCode === "" && $appointmentId === "" && $recordId === "") {
        
        echo json_encode(["error" => true, "data" => "A gate pass or appointment ID is required.", "code" => null]);
        exit;
    }

    if (in_array($decision, ["REFER", "REJECT"], true) && strlen($reason) < 5) {
        
        echo json_encode(["error" => true, "data" => "Provide a reason of at least 5 characters.", "code" => null]);
        exit;
    }

    try {
        $conn->beginTransaction();

        if ($passId !== "") {
            $identitySql = "p.id = ?";
            $identityValue = $passId;
        } elseif ($passCode !== "") {
            $identitySql = "p.pass_code = ?";
            $identityValue = $passCode;
        } elseif ($appointmentId !== "") {
            $identitySql = "a.id = ?";
            $identityValue = $appointmentId;
        } else {
            $identitySql = "a.id = ?";
            $identityValue = $recordId;
        }

        $sql = "
            SELECT
                a.id AS appointment_id,
                a.appointment_date,
                a.status AS appointment_status,
                a.vehicle_id,
                a.driver_id,
                v.plate,
                v.transporter,
                v.status AS vehicle_status,
                v.insurance_expiry,
                v.roadworthiness_expiry,
                d.name AS driver_name,
                d.status AS driver_status,
                d.licence_expiry,
                p.id AS gate_pass_id,
                p.pass_code,
                p.type AS pass_type,
                p.status AS pass_status,
                p.valid_until,
                (
                    SELECT GROUP_CONCAT(UPPER(TRIM(ac.container_no)) ORDER BY UPPER(TRIM(ac.container_no)) SEPARATOR ',')
                    FROM gate_appointment_containers ac
                    WHERE ac.appointment_id = a.id
                ) AS appointment_containers
            FROM gate_passes p
            INNER JOIN gate_appointments a ON a.id = p.appointment_id
            INNER JOIN gate_vehicles v ON v.id = p.vehicle_id
            INNER JOIN gate_drivers d ON d.id = p.driver_id
            WHERE $identitySql
            LIMIT 1
            FOR UPDATE
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([$identityValue]);
        $record = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$record) {
            $conn->rollBack();
            
            echo json_encode(["error" => true, "data" => "Gate pass or appointment not found.", "code" => null]);
            exit;
        }

        if (($passId !== "" && $record["gate_pass_id"] !== $passId) ||
            ($passCode !== "" && $record["pass_code"] !== $passCode) ||
            ($appointmentId !== "" && $record["appointment_id"] !== $appointmentId)) {
            $conn->rollBack();
            
            echo json_encode(["error" => true, "data" => "Supplied identifiers do not match the gate pass.", "code" => null]);
            exit;
        }

        $today = date("Y-m-d");
        $now = time();

        $vehicleStatus = strtolower(trim((string) $record["vehicle_status"]));
        $driverStatus = strtolower(trim((string) $record["driver_status"]));
        $passStatus = strtolower(trim((string) $record["pass_status"]));
        $appointmentStatus = strtolower(trim((string) $record["appointment_status"]));
        $passType = trim((string) $record["pass_type"]);

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
            ? strtotime((string) $record["valid_until"])
            : false;

        $passEligible =
            $passStatus === "active" &&
            $passExpiry !== false &&
            $passExpiry > $now;

        $assignmentStmt = $conn->prepare("
            SELECT id
            FROM gate_driver_vehicle_assignments
            WHERE vehicle_id = ?
            AND driver_id = ?
            AND unassigned_at IS NULL
            LIMIT 1
            FOR UPDATE
        ");
        $assignmentStmt->execute([$record["vehicle_id"], $record["driver_id"]]);
        $assignmentEligible = (bool) $assignmentStmt->fetch(PDO::FETCH_ASSOC);

        $appointmentContainers = !empty($record["appointment_containers"])
            ? array_values(array_unique(explode(",", (string) $record["appointment_containers"])))
            : [];

        sort($appointmentContainers);

        $cargoEligible = count($appointmentContainers) > 0 && $appointmentContainers;

        $appointmentEligible =
            $record["appointment_date"] === $today &&
            (
                $direction === "in"
                    ? in_array($appointmentStatus, ["confirmed", "arrived"], true)
                    : $appointmentStatus === "in terminal"
            );

        $holds = [];

        if (!$vehicleEligible) {
            $holds[] = "Vehicle approval or required documents are invalid or expired";
        }
        if (!$driverEligible) {
            $holds[] = "Driver approval or licence is invalid or expired";
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
        if (!$cargoEligible) {
            $holds[] = "Pass containers do not match appointment containers";
        }

        if ($direction === "in") {
            if (!in_array($passType, ["Terminal Entry", "Collection"], true)) {
                $holds[] = "Pass type does not permit gate-in";
            }

            $duplicate = $conn->prepare("
                SELECT id
                FROM gate_movement_records
                WHERE appointment_id = ?
                AND direction = 'in'
                AND decision = 'ADMIT'
                LIMIT 1
                FOR UPDATE
            ");
            $duplicate->execute([$record["appointment_id"]]);

            if ($duplicate->fetch(PDO::FETCH_ASSOC)) {
                $holds[] = "Appointment already has a successful gate-in movement";
            }
        } else {
            if ($passType !== "Gate-Out Clearance") {
                $holds[] = "A Gate-Out Clearance pass is required";
            }

            $holds[] = "Financial clearance must be verified by the server";
            $holds[] = "Release authorisation must be verified by the server";

            $duplicate = $conn->prepare("
                SELECT id
                FROM gate_movement_records
                WHERE appointment_id = ?
                AND direction = 'out'
                AND decision = 'ADMIT'
                LIMIT 1
                FOR UPDATE
            ");
            $duplicate->execute([$record["appointment_id"]]);

            if ($duplicate->fetch(PDO::FETCH_ASSOC)) {
                $holds[] = "Appointment already has a successful gate-out movement";
            }
        }

        $holds = array_values(array_unique($holds));

        $checks = [
            "vehicle" => $vehicleEligible,
            "driver" => $driverEligible,
            "assignment" => $assignmentEligible,
            "appointment" => $appointmentEligible,
            "cargo" => $cargoEligible,
            "pass" => $passEligible,
            "financial" => null,
            "release" => null
        ];

        if ($decision === "ADMIT" && $direction === "out") {
            $conn->rollBack();
            
            echo json_encode([
                "error" => true,
                "data" => "Gate-out is blocked until financial clearance and release authorisation are verified by the server.",
                "code" => ["holds" => $holds, "checks" => $checks]
            ]);
            exit;
        }

        if ($decision === "ADMIT" && count($holds) > 0) {
            $conn->rollBack();
            
            echo json_encode([
                "error" => true,
                "data" => "Admission blocked. Resolve the outstanding checks first.",
                "code" => ["holds" => $holds, "checks" => $checks]
            ]);
            exit;
        }

        $movementId = generateId();
        $operatorId = $my_details->id ?? null;

        $insert = $conn->prepare("
            INSERT INTO gate_movement_records (
                id, appointment_id, gate_pass_id, vehicle_id, driver_id,
                direction, decision, reason, override_reason, operator_id, movement_at
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
                throw new RuntimeException("Appointment status changed before admission.");
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
            $updateContainerStatus = $conn->prepare("
                UPDATE portal_shipment_containers psc
                INNER JOIN gate_appointment_containers gac ON UPPER(TRIM(gac.container_no)) = UPPER(TRIM(psc.container_no))
                SET psc.status = 'ENTERED'
                WHERE gac.appointment_id = :appointment_id
                AND psc.status = 'EXPECTED'
            ");

            $updateContainerStatus->execute([
                ":appointment_id" => $record["appointment_id"]
            ]);

            if ($updateContainerStatus->rowCount() === 0) {
                throw new RuntimeException(
                    "No eligible shipment containers were updated for this gate appointment."
                );
            }
        }

        $audit = $conn->prepare("
            INSERT INTO gate_movement_audit (
                id, movement_id, appointment_id, gate_pass_id,
                operator_id, event_type, event_data
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
                "holds" => $holds,
                "checks" => $checks
            ], JSON_UNESCAPED_SLASHES)
        ]);

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Gate decision recorded successfully.",
            "code" => [
                "id" => $movementId,
                "appointment_id" => $record["appointment_id"],
                "gate_pass_id" => $record["gate_pass_id"],
                "pass_code" => $record["pass_code"],
                "direction" => $direction,
                "decision" => $decision,
                "reason" => $reason,
                "recorded_at" => date("Y-m-d H:i:s")
            ]
        ], JSON_UNESCAPED_SLASHES);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log("Gate decision error: " . $e->getMessage());
        
        echo json_encode([
            "error" => true,
            "data" => "Could not record gate decision.",
            "code" => $e->getMessage()
        ]);
    }
