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
            $identitySql = "p.id = :identity_value";
            $identityValue = $passId;
        } elseif ($passCode !== "") {
            $identitySql = "p.pass_code = :identity_value";
            $identityValue = $passCode;
        } elseif ($appointmentId !== "") {
            $identitySql = "a.id = :identity_value";
            $identityValue = $appointmentId;
        } else {
            $identitySql = "a.id = :identity_value";
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
        $stmt->bindValue(":identity_value", $identityValue, PDO::PARAM_STR);
        $stmt->execute();
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

        $appointmentDate = !empty($record["appointment_date"])
            ? date("Y-m-d", strtotime((string) $record["appointment_date"]))
            : null;

        $passEligible =
            $passStatus === "active" &&
            $appointmentDate === $today;

        $assignmentStmt = $conn->prepare("
            SELECT id
            FROM gate_driver_vehicle_assignments
            WHERE vehicle_id = :vehicle_id
            AND driver_id = :driver_id
            AND unassigned_at IS NULL
            LIMIT 1
            FOR UPDATE
        ");
        $assignmentStmt->bindValue(":vehicle_id", $record["vehicle_id"], PDO::PARAM_STR);
        $assignmentStmt->bindValue(":driver_id", $record["driver_id"], PDO::PARAM_STR);
        $assignmentStmt->execute();
        $assignmentEligible = (bool) $assignmentStmt->fetch(PDO::FETCH_ASSOC);

        $appointmentContainers = !empty($record["appointment_containers"])
            ? array_values(array_unique(explode(",", (string) $record["appointment_containers"])))
            : [];

        sort($appointmentContainers);

        $cargoEligible = count($appointmentContainers) > 0 && $appointmentContainers;

        $appointmentEligible =
            $appointmentDate === $today &&
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
            $holds[] = "Gate pass is not active or its appointment date is not today";
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
                WHERE appointment_id = :appointment_id
                AND direction = 'in'
                AND decision = 'ADMIT'
                LIMIT 1
                FOR UPDATE
            ");
            $duplicate->bindValue(":appointment_id", $record["appointment_id"], PDO::PARAM_STR);
            $duplicate->execute();

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
                WHERE appointment_id = :appointment_id
                AND direction = 'out'
                AND decision = 'ADMIT'
                LIMIT 1
                FOR UPDATE
            ");
            $duplicate->bindValue(":appointment_id", $record["appointment_id"], PDO::PARAM_STR);
            $duplicate->execute();

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
            ) VALUES (:id, :appointment_id, :gate_pass_id, :vehicle_id, :driver_id, :direction, :decision, :reason, :override_reason, :operator_id, NOW())
        ");

        $insert->bindValue(":id", $movementId, PDO::PARAM_STR);
        $insert->bindValue(":appointment_id", $record["appointment_id"], PDO::PARAM_STR);
        $insert->bindValue(":gate_pass_id", $record["gate_pass_id"], PDO::PARAM_STR);
        $insert->bindValue(":vehicle_id", $record["vehicle_id"], PDO::PARAM_STR);
        $insert->bindValue(":driver_id", $record["driver_id"], PDO::PARAM_STR);
        $insert->bindValue(":direction", $direction, PDO::PARAM_STR);
        $insert->bindValue(":decision", $decision, PDO::PARAM_STR);
        $insert->bindValue(":reason", $reason !== "" ? $reason : null, $reason !== "" ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $insert->bindValue(":override_reason", $overrideReason !== "" ? $overrideReason : null, $overrideReason !== "" ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $insert->bindValue(":operator_id", $operatorId, $operatorId !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $insert->execute();

        if ($direction === "in" && $decision === "ADMIT") {
            $updateAppointment = $conn->prepare("
                UPDATE gate_appointments
                SET status = 'In Terminal'
                WHERE id = :appointment_id
                AND status IN ('Confirmed', 'Arrived')
            ");
            $updateAppointment->bindValue(":appointment_id", $record["appointment_id"], PDO::PARAM_STR);
            $updateAppointment->execute();

            if ($updateAppointment->rowCount() !== 1) {
                throw new RuntimeException("Appointment status changed before admission.");
            }

            $updatePass = $conn->prepare("
                UPDATE gate_passes
                SET status = 'Redeemed'
                WHERE id = :gate_pass_id
                AND status = 'Active'
                AND EXISTS (
                    SELECT 1
                    FROM gate_appointments a
                    WHERE a.id = gate_passes.appointment_id
                    AND a.appointment_date = CURDATE()
                )
            ");
            $updatePass->bindValue(":gate_pass_id", $record["gate_pass_id"], PDO::PARAM_STR);
            $updatePass->execute();

            if ($updatePass->rowCount() !== 1) {
                throw new RuntimeException("Gate pass is no longer active.");
            }
            $shipmentStmt = $conn->prepare("
                SELECT DISTINCT psc.shipment_id
                FROM portal_shipment_containers psc
                INNER JOIN gate_appointment_containers gac
                    ON UPPER(TRIM(gac.container_no)) = UPPER(TRIM(psc.container_no))
                WHERE gac.appointment_id = :appointment_id
                AND psc.status IN ('EXPECTED', 'SCHEDULED')
                FOR UPDATE
            ");
            $shipmentStmt->bindValue(":appointment_id", $record["appointment_id"], PDO::PARAM_STR);
            $shipmentStmt->execute();
            $affectedShipmentIds = $shipmentStmt->fetchAll(PDO::FETCH_COLUMN);

            $updateContainerStatus = $conn->prepare("
                UPDATE portal_shipment_containers psc
                INNER JOIN gate_appointment_containers gac
                    ON UPPER(TRIM(gac.container_no)) = UPPER(TRIM(psc.container_no))
                SET psc.status = 'ENTERED',
                    psc.gate_in_at = COALESCE(psc.gate_in_at, NOW())
                WHERE gac.appointment_id = :appointment_id
                AND psc.status IN ('EXPECTED', 'SCHEDULED')
            ");

            $updateContainerStatus->bindValue(":appointment_id", $record["appointment_id"], PDO::PARAM_STR);
            $updateContainerStatus->execute();

            if ($updateContainerStatus->rowCount() === 0) {
                throw new RuntimeException(
                    "No eligible shipment containers were updated for this gate appointment."
                );
            }

            $shipmentProgressStmt = $conn->prepare("
                SELECT
                    COUNT(*) AS total_containers,
                    SUM(
                        CASE
                            WHEN status IN (
                                'ENTERED',
                                'RECEIVED',
                                'UNDER_EXAMINATION',
                                'EXAMINATION_COMPLETE',
                                'CHARGES_PENDING',
                                'CHARGES_SETTLED',
                                'RELEASE_AUTHORISED',
                                'GATE_OUT',
                                'TRANSFERRED_OUT',
                                'RETURNED_RE_EXPORTED'
                            ) THEN 1
                            ELSE 0
                        END
                    ) AS gated_in_containers
                FROM portal_shipment_containers
                WHERE shipment_id = :shipment_id
                AND status <> 'CANCELLED'
            ");

            $updateShipmentStatus = $conn->prepare("
                UPDATE portal_shipments
                SET status = :status
                WHERE id = :shipment_id
                AND status IN (
                    'EXPECTED',
                    'PARTIALLY_SCHEDULED',
                    'SCHEDULED',
                    'PARTIALLY_GATED_IN',
                    'GATED_IN'
                )
            ");

            foreach ($affectedShipmentIds as $affectedShipmentId) {
                $shipmentProgressStmt->execute([":shipment_id" => $affectedShipmentId]);
                $shipmentProgress = $shipmentProgressStmt->fetch(PDO::FETCH_ASSOC);

                $totalContainers = (int) ($shipmentProgress["total_containers"] ?? 0);
                $gatedInContainers = (int) ($shipmentProgress["gated_in_containers"] ?? 0);

                if ($totalContainers > 0 && $gatedInContainers >= $totalContainers) {
                    $shipmentStatus = "GATED_IN";
                } elseif ($gatedInContainers > 0) {
                    $shipmentStatus = "PARTIALLY_GATED_IN";
                } else {
                    continue;
                }

                $updateShipmentStatus->execute([
                    ":status" => $shipmentStatus,
                    ":shipment_id" => $affectedShipmentId
                ]);
            }
        }

        $audit = $conn->prepare("
            INSERT INTO gate_movement_audit (
                id, movement_id, appointment_id, gate_pass_id,
                operator_id, event_type, event_data
            ) VALUES (:id, :movement_id, :appointment_id, :gate_pass_id, :operator_id, :event_type, :event_data)
        ");

        $auditData = json_encode([
            "plate" => $record["plate"],
            "pass_code" => $record["pass_code"],
            "direction" => $direction,
            "decision" => $decision,
            "reason" => $reason,
            "holds" => $holds,
            "checks" => $checks
        ], JSON_UNESCAPED_SLASHES);

        $audit->bindValue(":id", generateId(), PDO::PARAM_STR);
        $audit->bindValue(":movement_id", $movementId, PDO::PARAM_STR);
        $audit->bindValue(":appointment_id", $record["appointment_id"], PDO::PARAM_STR);
        $audit->bindValue(":gate_pass_id", $record["gate_pass_id"], PDO::PARAM_STR);
        $audit->bindValue(":operator_id", $operatorId, $operatorId !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $audit->bindValue(":event_type", "GATE_" . strtoupper($direction) . "_" . $decision, PDO::PARAM_STR);
        $audit->bindValue(":event_data", $auditData, PDO::PARAM_STR);
        $audit->execute();

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
