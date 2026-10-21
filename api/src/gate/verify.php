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

    $query = trim((string)($_POST["q"] ?? ""));
    $passCode = trim((string)($_POST["pass_code"] ?? ""));
    $plate = strtoupper(trim((string)($_POST["plate"] ?? "")));
    $direction = strtolower(trim((string)($_POST["direction"] ?? "in")));

    if (!in_array($direction, ["in", "out"], true)) {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Direction must be in or out.",
            "code" => null
        ]);
        exit;
    }

    if ($query !== "") {
        if ($passCode === "" && $plate === "") {
            $passCode = $query;
            $plate = strtoupper($query);
        }
    }

    if ($passCode === "" && $plate === "") {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Enter a pass code or vehicle plate.",
            "code" => null
        ]);
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
                p.appointment_id,
                a.appointment_date,
                a.slot_time,
                a.status AS appointment_status,
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
                        c.container_no
                        ORDER BY c.container_no
                        SEPARATOR ','
                    )
                    FROM gate_pass_containers c
                    WHERE c.gate_pass_id = p.id
                ) AS pass_container_nos,
                (
                    SELECT GROUP_CONCAT(
                        ac.container_no
                        ORDER BY ac.container_no
                        SEPARATOR ','
                    )
                    FROM gate_appointment_containers ac
                    WHERE ac.appointment_id = a.id
                ) AS appointment_container_nos
            FROM gate_passes p
            INNER JOIN gate_appointments a
                ON a.id = p.appointment_id
            INNER JOIN gate_vehicles v
                ON v.id = p.vehicle_id
            INNER JOIN gate_drivers d
                ON d.id = p.driver_id
            WHERE (
                (? <> '' AND p.pass_code = ?)
                OR
                (? <> '' AND UPPER(v.plate) = ?)
            )
            ORDER BY
                CASE WHEN ? <> '' AND p.pass_code = ? THEN 0 ELSE 1 END,
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
            echo json_encode([
                "error" => true,
                "data" => "No matching gate pass found.",
                "code" => null
            ]);
            exit;
        }

        $today = date("Y-m-d");
        $now = time();

        $vehicleStatus = strtolower(trim((string)$pass["vehicle_status"]));
        $driverStatus = strtolower(trim((string)$pass["driver_status"]));
        $passStatus = strtolower(trim((string)$pass["pass_status"]));
        $appointmentStatus = strtolower(trim((string)$pass["appointment_status"]));

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

        $passEligible =
            $passStatus === "active" &&
            !empty($pass["valid_until"]) &&
            strtotime((string)$pass["valid_until"]) !== false &&
            strtotime((string)$pass["valid_until"]) > $now;

        $appointmentDate = (string)$pass["appointment_date"];

        $appointmentEligible =
            $appointmentDate === $today &&
            in_array(
                $appointmentStatus,
                ["confirmed", "arrived", "in terminal"],
                true
            );

        $containers = !empty($pass["pass_container_nos"])
            ? array_map("trim", explode(",", (string)$pass["pass_container_nos"]))
            : [];

        $appointmentContainers = !empty($pass["appointment_container_nos"])
            ? array_map("trim", explode(",", (string)$pass["appointment_container_nos"]))
            : [];

        $containers = array_values(array_unique(array_map(
            "strtoupper",
            array_filter($containers, fn($value) => $value !== "")
        )));

        $appointmentContainers = array_values(array_unique(array_map(
            "strtoupper",
            array_filter($appointmentContainers, fn($value) => $value !== "")
        )));

        sort($containers);
        sort($appointmentContainers);

        $cargoEligible =
            count($containers) > 0 &&
            $containers === $appointmentContainers;

        $checks = [
            "vehicle" => $vehicleEligible,
            "driver" => $driverEligible,
            "appointment" => $appointmentEligible,
            "cargo" => $cargoEligible,
            "financial" => false,
            "release" => false
        ];

        $holds = [];

        if (!$vehicleEligible) {
            $holds[] = "Vehicle approval or required documents are invalid or expired";
        }

        if (!$driverEligible) {
            $holds[] = "Driver approval or driving licence is invalid or expired";
        }

        if (!$passEligible) {
            $holds[] = "Pass is expired, revoked or already redeemed";
        }

        if (!$appointmentEligible) {
            $holds[] = "Appointment is not scheduled for today or its status does not permit movement";
        }

        if (!$cargoEligible) {
            $holds[] = "Pass containers do not match the appointment containers";
        }

        if ($direction === "out") {
            $holds[] = "Financial clearance must be verified against the applicable finance records";
            $holds[] = "Release authorisation must be verified against the applicable release records";
        }

        $requiredChecks = $direction === "in"
            ? ["vehicle", "driver", "appointment", "cargo"]
            : ["vehicle", "driver", "appointment", "cargo", "financial", "release"];

        $checksPassed = true;

        foreach ($requiredChecks as $check) {
            if (!$checks[$check]) {
                $checksPassed = false;
                break;
            }
        }

        $readiness = $checksPassed && $passEligible
            ? "Ready"
            : "Not ready";

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
                "plate" => $pass["vehicle_plate"],
                "checks" => $checks,
                "holds" => $holds,
                "readiness" => $readiness
            ], JSON_UNESCAPED_SLASHES)
        ]);

        $conn->commit();

        $pass["container_nos"] = $containers;
        $pass["appointment_container_nos"] = $appointmentContainers;
        $pass["direction"] = $direction;
        $pass["checks"] = $checks;
        $pass["holds"] = $holds;
        $pass["readiness"] = $readiness;
        $pass["readiness_notes"] = implode("; ", $holds);

        echo json_encode([
            "error" => false,
            "data" => "Pass verification completed.",
            "code" => $pass
        ]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(500);
        echo json_encode([
            "error" => true,
            "data" => "Could not verify gate pass.",
            "code" => $e->getMessage()
        ]);
    }