
<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    
        echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
        exit;
    }

    try {
        $sql = "
            SELECT
                p.id AS id,
                p.id AS gate_pass_id,
                p.pass_code,
                p.type AS pass_type,
                p.status AS pass_status,
                p.valid_until,
                p.issued_at,
                a.id AS appointment_id,
                a.id AS appointment_reference,
                a.appointment_date,
                a.slot_time,
                a.status AS appointment_status,
                a.created_at,
                v.id AS vehicle_id,
                v.plate AS vehicle_plate,
                v.transporter,
                v.status AS vehicle_status,
                v.insurance_expiry,
                v.roadworthiness_expiry,
                d.id AS driver_id,
                d.name AS driver_name,
                d.phone AS driver_phone,
                d.status AS driver_status,
                d.licence_expiry,
                (
                    SELECT GROUP_CONCAT(
                        ac.container_no
                        ORDER BY ac.container_no
                        SEPARATOR ','
                    )
                    FROM gate_appointment_containers ac
                    WHERE ac.appointment_id = a.id
                ) AS container_nos,
                (
                    SELECT gm.decision
                    FROM gate_movement_records gm
                    WHERE gm.gate_pass_id = p.id
                    AND gm.direction = 'in'
                    ORDER BY gm.movement_at DESC, gm.created_at DESC
                    LIMIT 1
                ) AS latest_gate_in_decision,
                (
                    SELECT gm.reason
                    FROM gate_movement_records gm
                    WHERE gm.gate_pass_id = p.id
                    AND gm.direction = 'in'
                    ORDER BY gm.movement_at DESC, gm.created_at DESC
                    LIMIT 1
                ) AS latest_gate_in_reason,
                (
                    SELECT gm.movement_at
                    FROM gate_movement_records gm
                    WHERE gm.gate_pass_id = p.id
                    AND gm.direction = 'in'
                    ORDER BY gm.movement_at DESC, gm.created_at DESC
                    LIMIT 1
                ) AS latest_gate_in_at,
                EXISTS (
                    SELECT 1
                    FROM gate_movement_records gm
                    WHERE gm.gate_pass_id = p.id
                    AND gm.direction = 'in'
                    AND gm.decision = 'ADMIT'
                ) AS used,
                EXISTS (
                    SELECT 1
                    FROM gate_driver_vehicle_assignments dva
                    WHERE dva.driver_id = a.driver_id
                    AND dva.vehicle_id = a.vehicle_id
                    AND dva.unassigned_at IS NULL
                ) AS assignment_eligible
            FROM gate_passes p
            INNER JOIN gate_appointments a
                ON a.id = p.appointment_id
            LEFT JOIN gate_vehicles v
                ON v.id = p.vehicle_id
            LEFT JOIN gate_drivers d
                ON d.id = p.driver_id
            WHERE a.appointment_date = CURDATE()
            AND p.type IN ('Terminal Entry', 'Collection')
            ORDER BY a.slot_time ASC, p.issued_at DESC
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $today = date("Y-m-d");
        $now = time();
        $result = [];

        foreach ($rows as $row) {
            $passStatus = strtolower(trim((string) $row["pass_status"]));
            $appointmentStatus = strtolower(trim((string) $row["appointment_status"]));
            $vehicleStatus = strtolower(trim((string) ($row["vehicle_status"] ?? "")));
            $driverStatus = strtolower(trim((string) ($row["driver_status"] ?? "")));

            $used = (bool) $row["used"];
            $expiry = !empty($row["valid_until"])
                ? strtotime((string) $row["valid_until"])
                : false;

            $passExpired = $expiry === false || $expiry <= $now;

            $vehicleEligible =
                $vehicleStatus === "approved" &&
                !empty($row["insurance_expiry"]) &&
                $row["insurance_expiry"] >= $today &&
                !empty($row["roadworthiness_expiry"]) &&
                $row["roadworthiness_expiry"] >= $today;

            $driverEligible =
                $driverStatus === "approved" &&
                !empty($row["licence_expiry"]) &&
                $row["licence_expiry"] >= $today;

            $assignmentEligible = (bool) $row["assignment_eligible"];

            $appointmentEligible = in_array(
                $appointmentStatus,
                ["confirmed", "arrived"],
                true
            );

            $passEligible =
                $passStatus === "active" &&
                !$passExpired;

            $appointmentContainers = !empty($row["container_nos"])
                ? array_values(array_filter(array_map(
                    "trim",
                    explode(",", (string) $row["container_nos"])
                )))
                : [];


            $normalize = static function (array $values): array {
                $values = array_map(
                    static fn($value) => strtoupper(trim((string) $value)),
                    $values
                );
                $values = array_values(array_unique($values));
                sort($values);
                return $values;
            };

            $cargoEligible =
                count($appointmentContainers) > 0 &&
                $normalize($appointmentContainers) === $normalize($passContainers);

            $checks = [
                "vehicle" => $vehicleEligible,
                "driver" => $driverEligible,
                "assignment" => $assignmentEligible,
                "appointment" => $appointmentEligible,
                "cargo" => $cargoEligible,
                "pass" => $passEligible
            ];

            $holds = [];

            if (!$vehicleEligible) {
                if ($vehicleStatus !== "approved") {
                    $holds[] = "Vehicle is not approved";
                }
                if (empty($row["insurance_expiry"]) || $row["insurance_expiry"] < $today) {
                    $holds[] = "Vehicle insurance is missing or expired";
                }
                if (empty($row["roadworthiness_expiry"]) || $row["roadworthiness_expiry"] < $today) {
                    $holds[] = "Vehicle roadworthiness is missing or expired";
                }
            }

            if (!$driverEligible) {
                if ($driverStatus !== "approved") {
                    $holds[] = "Driver is not approved";
                }
                if (empty($row["licence_expiry"]) || $row["licence_expiry"] < $today) {
                    $holds[] = "Driver licence is missing or expired";
                }
            }

            if (!$assignmentEligible) {
                $holds[] = "Driver is not assigned to this vehicle";
            }

            if (!$appointmentEligible) {
                $holds[] = "Appointment status does not permit gate-in";
            }

            if (!$cargoEligible) {
                $holds[] = "Pass containers do not match appointment containers";
            }

            $latestDecision = strtoupper(trim((string) ($row["latest_gate_in_decision"] ?? "")));

            if ($passStatus === "redeemed") {
                $statusLabel = "Redeemed";
            } elseif ($passStatus === "revoked") {
                $statusLabel = "Revoked";
            } elseif ($passExpired) {
                $statusLabel = "Expired";
            } elseif ($used) {
                $statusLabel = "Used";
            } elseif ($latestDecision === "REJECT") {
                $statusLabel = "Rejected";
            } elseif ($latestDecision === "REFER") {
                $statusLabel = "Referred";
            } elseif ($passStatus !== "active") {
                $statusLabel = ucfirst($passStatus ?: "Unknown");
            } else {
                $statusLabel = "Active";
            }

            $readiness = "Ready";
            if (!$vehicleEligible || !$driverEligible || !$assignmentEligible || !$appointmentEligible || !$cargoEligible || !$passEligible) {
                $readiness = "Needs verification";
            }

            $row["container_nos"] = $appointmentContainers;
            $row["used"] = $used;
            $row["pass_expired"] = $passExpired;
            $row["assignment_eligible"] = $assignmentEligible;
            $row["checks"] = $checks;
            $row["holds"] = array_values(array_unique($holds));
            $row["readiness"] = $readiness;
            $row["status_label"] = $statusLabel;
            $row["latest_decision"] = $latestDecision;
            $row["can_admit"] =
                !$used &&
                $passEligible &&
                $vehicleEligible &&
                $driverEligible &&
                $assignmentEligible &&
                $appointmentEligible &&
                $cargoEligible;
            $row["purpose"] = $row["pass_type"];

            $result[] = $row;
        }

        echo json_encode([
            "error" => false,
            "data" => "Today's gate-in passes loaded successfully.",
            "code" => $result,
            "count" => count($result)
        ], JSON_UNESCAPED_SLASHES);
    } catch (Throwable $e) {
        error_log("Gate-in queue error: " . $e->getMessage());
        
        echo json_encode([
            "error" => true,
            "data" => "Could not load today's gate-in passes.",
            "code" => null
        ]);
    }

