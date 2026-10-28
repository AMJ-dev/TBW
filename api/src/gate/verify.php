<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    header("Content-Type: application/json; charset=utf-8");

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
        exit;
    }

    $query = trim((string) ($_POST["q"] ?? ""));
    $passCode = trim((string) ($_POST["pass_code"] ?? ""));
    $plate = strtoupper(trim((string) ($_POST["plate"] ?? "")));
    $direction = strtolower(trim((string) ($_POST["direction"] ?? "in")));

    if (!in_array($direction, ["in", "out"], true)) {
        echo json_encode(["error" => true, "data" => "Direction must be in or out.", "code" => null]);
        exit;
    }

    if ($query !== "" && $passCode === "" && $plate === "") {
        $passCode = $query;
        $plate = strtoupper($query);
    }

    if ($passCode === "" && $plate === "") {
        echo json_encode(["error" => true, "data" => "Enter a pass code or vehicle plate.", "code" => null]);
        exit;
    }

    try {
        $sql = "
            SELECT
                p.id AS id,
                p.id AS gate_pass_id,
                p.pass_code,
                p.organisation_id,
                p.type AS pass_type,
                p.status AS pass_status,
                p.valid_until,
                p.issued_at,
                p.issued_by,
                p.updated_at AS pass_updated_at,
                p.appointment_id,

                a.booking_ref,
                a.appointment_date,
                a.slot_time,
                a.status AS appointment_status,
                a.created_by AS appointment_created_by,
                a.created_at AS appointment_created_at,
                a.updated_at AS appointment_updated_at,

                v.id AS vehicle_id,
                v.plate AS vehicle_plate,
                v.kind AS vehicle_kind,
                v.make AS vehicle_make,
                v.model AS vehicle_model,
                v.year AS vehicle_year,
                v.capacity AS vehicle_capacity,
                v.owner AS vehicle_owner,
                v.transporter,
                v.status AS vehicle_status,
                v.insurance_expiry,
                v.roadworthiness_expiry,
                v.notes AS vehicle_notes,

                d.id AS driver_id,
                d.name AS driver_name,
                d.phone AS driver_phone,
                d.licence_number AS driver_licence_number,
                d.licence_class AS driver_licence_class,
                d.licence_expiry,
                d.status AS driver_status,
                d.transporter AS driver_transporter,
                d.notes AS driver_notes,

                (
                    SELECT GROUP_CONCAT(
                        ac.container_no
                        ORDER BY ac.container_no
                        SEPARATOR ','
                    )
                    FROM gate_appointment_containers ac
                    WHERE ac.appointment_id = a.id
                ) AS appointment_container_nos,

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
                    AND UPPER(gm.decision) = 'ADMIT'
                ) AS used,

                EXISTS (
                    SELECT 1
                    FROM gate_driver_vehicle_assignments dva
                    WHERE dva.vehicle_id = a.vehicle_id
                    AND dva.driver_id = a.driver_id
                    AND dva.unassigned_at IS NULL
                ) AS assignment_eligible

            FROM gate_passes p

            INNER JOIN gate_appointments a
                ON a.id = p.appointment_id

            LEFT JOIN gate_vehicles v
                ON v.id = p.vehicle_id

            LEFT JOIN gate_drivers d
                ON d.id = p.driver_id

            WHERE (
                (? <> '' AND p.pass_code = ?)
                OR (? <> '' AND UPPER(v.plate) = ?)
            )

            ORDER BY
                CASE
                    WHEN ? <> '' AND p.pass_code = ? THEN 0
                    ELSE 1
                END,
                p.issued_at DESC

            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);

        $stmt->execute([
            $passCode,
            $passCode,
            $plate,
            $plate,
            $passCode,
            $passCode
        ]);

        $pass = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$pass) {
            echo json_encode(["error" => true, "data" => "No matching gate pass found.", "code" => null]);
            exit;
        }

        $organisationStmt = $conn->prepare("
            SELECT *
            FROM organisations
            WHERE id = ?
            LIMIT 1
        ");

        $organisationStmt->execute([
            $pass["organisation_id"]
        ]);

        $organisation = $organisationStmt->fetch(PDO::FETCH_ASSOC);

        if (!$organisation) {
            $organisation = null;
        }

        $pass["organisation"] = $organisation;

        $appointment_id = $pass["appointment_id"];

        $containerStmt = $conn->prepare("
            SELECT
                ac.id AS appointment_container_id,
                ac.appointment_id,
                ac.container_no,
                ac.container_no AS number,
                ac.created_at AS appointment_container_created_at,

                sc.id AS shipment_container_id,
                sc.shipment_id,
                sc.container_no AS shipment_container_no,
                sc.size,
                sc.seal_no,
                sc.hs_code,
                sc.package_count,
                sc.gross_weight,
                sc.status AS container_status,
                sc.gate_in_at,
                sc.received_at,
                sc.stored_at,
                sc.gate_out_at,
                sc.created_at AS container_created_at,
                sc.updated_at AS container_updated_at,

                s.shipment_reference,
                s.bill_of_lading,
                s.status AS shipment_status,
                s.organisation_id AS shipment_organisation_id

            FROM gate_appointment_containers ac

            LEFT JOIN portal_shipment_containers sc
                ON UPPER(TRIM(sc.container_no)) = UPPER(TRIM(ac.container_no))
                AND sc.id = (
                    SELECT sc2.id
                    FROM portal_shipment_containers sc2
                    WHERE UPPER(TRIM(sc2.container_no)) = UPPER(TRIM(ac.container_no))
                    ORDER BY sc2.updated_at DESC, sc2.created_at DESC, sc2.id DESC
                    LIMIT 1
                )

            LEFT JOIN portal_shipments s
                ON s.id = sc.shipment_id

            WHERE ac.appointment_id = :appointment_id

            ORDER BY ac.container_no ASC
        ");

        $containerStmt->execute([
            ":appointment_id" => $appointment_id
        ]);

        $containers = $containerStmt->fetchAll(PDO::FETCH_ASSOC);

        $today = date("Y-m-d");
        $now = time();

        $vehicleStatus = strtolower(trim((string) ($pass["vehicle_status"] ?? "")));
        $driverStatus = strtolower(trim((string) ($pass["driver_status"] ?? "")));
        $passStatus = strtolower(trim((string) ($pass["pass_status"] ?? "")));
        $appointmentStatus = strtolower(trim((string) ($pass["appointment_status"] ?? "")));

        $vehicleEligible =
            $vehicleStatus === "approved" &&
            !empty($pass["insurance_expiry"]) &&
            $pass["insurance_expiry"] >= $today &&
            !empty($pass["roadworthiness_expiry"]) &&
            $pass["roadworthiness_expiry"] >= $today;

        $driverEligible =
            $driverStatus === "approved" &&
            !empty($pass["licence_expiry"]) &&
            $pass["licence_expiry"] >= $today;

        $passExpiry = !empty($pass["valid_until"])
            ? strtotime((string) $pass["valid_until"])
            : false;

        $passExpired = $passExpiry === false || $passExpiry <= $now;
        $used = (bool) $pass["used"];

        $passEligible =
            $passStatus === "active" &&
            !$passExpired &&
            !$used;

        $appointmentDate = !empty($pass["appointment_date"])
            ? date("Y-m-d", strtotime((string) $pass["appointment_date"]))
            : null;

        $appointmentEligible =
            $appointmentDate === $today &&
            (
                $direction === "in"
                    ? in_array($appointmentStatus, ["confirmed", "arrived"], true)
                    : in_array($appointmentStatus, ["in terminal", "in_terminal"], true)
            );

        $appointmentContainers = !empty($pass["appointment_container_nos"])
            ? array_values(
                array_filter(
                    array_map(
                        "trim",
                        explode(",", (string) $pass["appointment_container_nos"])
                    )
                )
            )
            : [];

        $containerNos = array_values(array_map(
            static fn($container) => (string) ($container["container_no"] ?? ""),
            $containers
        ));

        $normalize = static function (array $values): array {
            $values = array_map(
                static fn($value) => strtoupper(trim((string) $value)),
                $values
            );

            $values = array_values(array_unique($values));
            sort($values);

            return $values;
        };

        $containerNumbersMatch =
            $normalize($containerNos) === $normalize($appointmentContainers);

        $cargoEligible =
            count($appointmentContainers) > 0 &&
            count($containers) > 0 &&
            $containerNumbersMatch;

        $assignmentEligible = (bool) $pass["assignment_eligible"];

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

        $holds = [];

        if (!$vehicleEligible) {
            if ($vehicleStatus !== "approved") {
                $holds[] = "Vehicle is not approved";
            }

            if (empty($pass["insurance_expiry"]) || $pass["insurance_expiry"] < $today) {
                $holds[] = "Vehicle insurance is missing or expired";
            }

            if (empty($pass["roadworthiness_expiry"]) || $pass["roadworthiness_expiry"] < $today) {
                $holds[] = "Vehicle roadworthiness is missing or expired";
            }
        }

        if (!$driverEligible) {
            if ($driverStatus !== "approved") {
                $holds[] = "Driver is not approved";
            }

            if (empty($pass["licence_expiry"]) || $pass["licence_expiry"] < $today) {
                $holds[] = "Driver licence is missing or expired";
            }
        }

        if (!$assignmentEligible) {
            $holds[] = "Driver is not assigned to this vehicle";
        }

        if (!$appointmentEligible) {
            if ($appointmentDate !== $today) {
                $holds[] = "Appointment is not scheduled for today";
            }

            if (
                $direction === "in" &&
                !in_array($appointmentStatus, ["confirmed", "arrived"], true)
            ) {
                $holds[] = "Appointment status does not permit gate-in";
            }

            if (
                $direction === "out" &&
                !in_array($appointmentStatus, ["in terminal", "in_terminal"], true)
            ) {
                $holds[] = "Appointment status does not permit gate-out";
            }
        }

        if (!$cargoEligible) {
            $holds[] = "Pass containers do not match appointment containers";
        }

        foreach ($containers as $container) {
            if (empty($container["shipment_container_id"])) {
                $holds[] = "Container " . ($container["container_no"] ?? "") . " has no linked shipment-container record";
            }

            if (empty($container["shipment_id"])) {
                $holds[] = "Container " . ($container["container_no"] ?? "") . " has no linked shipment";
            }
        }

        if ($used) {
            $holds[] = "Gate pass has already been used for a successful gate-in";
        } elseif ($passStatus === "redeemed") {
            $holds[] = "Gate pass status is redeemed";
        } elseif ($passStatus === "revoked") {
            $holds[] = "Gate pass has been revoked";
        } elseif ($passExpired) {
            $holds[] = "Gate pass has expired or has no valid expiry date";
        } elseif ($passStatus !== "active") {
            $holds[] = "Gate pass is not active";
        }

        if ($direction === "out") {
            $checks["financial"] = null;
            $checks["release"] = null;

            $holds[] = "Financial clearance must be verified by the gate-out API";
            $holds[] = "Release authorisation must be verified by the gate-out API";
        }

        $ready =
            $vehicleEligible &&
            $driverEligible &&
            $assignmentEligible &&
            $appointmentEligible &&
            $cargoEligible &&
            $passEligible &&
            $direction === "in";

        $latestDecision = strtoupper(trim((string) ($pass["latest_gate_in_decision"] ?? "")));

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

        $pass["containers"] = $containers;
        $pass["container_nos"] = $containerNos;
        $pass["appointment_container_nos"] = $appointmentContainers;
        $pass["container_count"] = count($containers);
        $pass["direction"] = $direction;
        $pass["used"] = $used;
        $pass["status_label"] = $statusLabel;
        $pass["latest_decision"] = $latestDecision;
        $pass["latest_gate_in_reason"] = $pass["latest_gate_in_reason"];
        $pass["latest_gate_in_at"] = $pass["latest_gate_in_at"];
        $pass["checks"] = $checks;
        $pass["holds"] = array_values(array_unique($holds));
        $pass["readiness"] = $ready ? "Ready" : $statusLabel;
        $pass["readiness_notes"] = implode("; ", array_unique($holds));
        $pass["can_admit"] = $ready;

        $pass["vehicle"] = [
            "id" => $pass["vehicle_id"],
            "plate" => $pass["vehicle_plate"],
            "kind" => $pass["vehicle_kind"],
            "make" => $pass["vehicle_make"],
            "model" => $pass["vehicle_model"],
            "year" => $pass["vehicle_year"],
            "capacity" => $pass["vehicle_capacity"],
            "owner" => $pass["vehicle_owner"],
            "transporter" => $pass["transporter"],
            "status" => $pass["vehicle_status"],
            "insurance_expiry" => $pass["insurance_expiry"],
            "roadworthiness_expiry" => $pass["roadworthiness_expiry"],
            "notes" => $pass["vehicle_notes"]
        ];

        $pass["driver"] = [
            "id" => $pass["driver_id"],
            "name" => $pass["driver_name"],
            "phone" => $pass["driver_phone"],
            "licence_number" => $pass["driver_licence_number"],
            "licence_class" => $pass["driver_licence_class"],
            "licence_expiry" => $pass["licence_expiry"],
            "status" => $pass["driver_status"],
            "transporter" => $pass["driver_transporter"],
            "notes" => $pass["driver_notes"]
        ];

        $pass["appointment"] = [
            "id" => $pass["appointment_id"],
            "booking_ref" => $pass["booking_ref"],
            "appointment_date" => $pass["appointment_date"],
            "slot_time" => $pass["slot_time"],
            "status" => $pass["appointment_status"],
            "created_by" => $pass["appointment_created_by"],
            "created_at" => $pass["appointment_created_at"],
            "updated_at" => $pass["appointment_updated_at"]
        ];

        unset(
            $pass["vehicle_id"],
            $pass["vehicle_plate"],
            $pass["vehicle_kind"],
            $pass["vehicle_make"],
            $pass["vehicle_model"],
            $pass["vehicle_year"],
            $pass["vehicle_capacity"],
            $pass["vehicle_owner"],
            $pass["transporter"],
            $pass["vehicle_status"],
            $pass["insurance_expiry"],
            $pass["roadworthiness_expiry"],
            $pass["vehicle_notes"],
            $pass["driver_id"],
            $pass["driver_name"],
            $pass["driver_phone"],
            $pass["driver_licence_number"],
            $pass["driver_licence_class"],
            $pass["licence_expiry"],
            $pass["driver_status"],
            $pass["driver_transporter"],
            $pass["driver_notes"],
            $pass["booking_ref"],
            $pass["appointment_date"],
            $pass["slot_time"],
            $pass["appointment_status"],
            $pass["appointment_created_by"],
            $pass["appointment_created_at"],
            $pass["appointment_updated_at"],
            $pass["appointment_container_nos"],
            $pass["latest_gate_in_decision"],
            $pass["latest_gate_in_reason"],
            $pass["latest_gate_in_at"],
            $pass["assignment_eligible"]
        );

        $conn->beginTransaction();

        $audit = $conn->prepare("
            INSERT INTO gate_movement_audit (
                id,
                appointment_id,
                gate_pass_id,
                operator_id,
                event_type,
                event_data
            ) VALUES (?, ?, ?, ?, ?, ?)
        ");

        $audit->execute([
            generateId(),
            $pass["appointment_id"],
            $pass["gate_pass_id"],
            $my_details->id ?? null,
            "PASS_VERIFIED",
            json_encode([
                "direction" => $direction,
                "pass_code" => $pass["pass_code"],
                "plate" => $pass["vehicle"]["plate"],
                "organisation_id" => $pass["organisation_id"],
                "used" => $used,
                "status_label" => $statusLabel,
                "checks" => $checks,
                "holds" => $holds
            ], JSON_UNESCAPED_SLASHES)
        ]);

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Pass verification completed.",
            "code" => $pass
        ], JSON_UNESCAPED_SLASHES);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log("Gate pass verification error: " . $e->getMessage());

        echo json_encode([
            "error" => true,
            "data" => "Could not verify gate pass.",
            "code" => null
        ]);
    }