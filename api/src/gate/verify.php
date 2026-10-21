
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
    exit;
}

$query = trim((string) ($_POST["q"] ?? ""));
$passCode = trim((string) ($_POST["pass_code"] ?? ""));
$plate = strtoupper(trim((string) ($_POST["plate"] ?? "")));
$direction = strtolower(trim((string) ($_POST["direction"] ?? "in")));

if (!in_array($direction, ["in", "out"], true)) {
    http_response_code(422);
    echo json_encode(["error" => true, "data" => "Direction must be in or out.", "code" => null]);
    exit;
}

if ($query !== "" && $passCode === "" && $plate === "") {
    $passCode = $query;
    $plate = strtoupper($query);
}

if ($passCode === "" && $plate === "") {
    http_response_code(422);
    echo json_encode(["error" => true, "data" => "Enter a pass code or vehicle plate.", "code" => null]);
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
                SELECT GROUP_CONCAT(c.container_no ORDER BY c.container_no SEPARATOR ',')
                FROM gate_pass_containers c
                WHERE c.gate_pass_id = p.id
            ) AS pass_container_nos,
            (
                SELECT GROUP_CONCAT(ac.container_no ORDER BY ac.container_no SEPARATOR ',')
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
                  AND gm.decision = 'ADMIT'
            ) AS used,
            EXISTS (
                SELECT 1
                FROM gate_driver_vehicle_assignments dva
                WHERE dva.vehicle_id = a.vehicle_id
                  AND dva.driver_id = a.driver_id
                  AND dva.unassigned_at IS NULL
            ) AS assignment_eligible
        FROM gate_passes p
        INNER JOIN gate_appointments a ON a.id = p.appointment_id
        LEFT JOIN gate_vehicles v ON v.id = p.vehicle_id
        LEFT JOIN gate_drivers d ON d.id = p.driver_id
        WHERE (
            (? <> '' AND p.pass_code = ?)
            OR (? <> '' AND UPPER(v.plate) = ?)
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
        http_response_code(404);
        echo json_encode(["error" => true, "data" => "No matching gate pass found.", "code" => null]);
        exit;
    }

    $today = date("Y-m-d");
    $now = time();

    $vehicleStatus = strtolower(trim((string) ($pass["vehicle_status"] ?? "")));
    $driverStatus = strtolower(trim((string) ($pass["driver_status"] ?? "")));
    $passStatus = strtolower(trim((string) $pass["pass_status"]));
    $appointmentStatus = strtolower(trim((string) $pass["appointment_status"]));

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

    $appointmentEligible =
        $pass["appointment_date"] === $today &&
        (
            $direction === "in"
                ? in_array($appointmentStatus, ["confirmed", "arrived"], true)
                : $appointmentStatus === "in terminal"
        );

    $containers = !empty($pass["pass_container_nos"])
        ? array_values(array_filter(array_map("trim", explode(",", (string) $pass["pass_container_nos"]))))
        : [];

    $appointmentContainers = !empty($pass["appointment_container_nos"])
        ? array_values(array_filter(array_map("trim", explode(",", (string) $pass["appointment_container_nos"]))))
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
        count($containers) > 0 &&
        $normalize($containers) === $normalize($appointmentContainers);

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
        $holds[] = "Appointment date or status does not permit this movement";
    }

    if (!$cargoEligible) {
        $holds[] = "Pass containers do not match appointment containers";
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

    $pass["container_nos"] = $containers;
    $pass["appointment_container_nos"] = $appointmentContainers;
    $pass["direction"] = $direction;
    $pass["used"] = $used;
    $pass["status_label"] = $statusLabel;
    $pass["latest_decision"] = $latestDecision;
    $pass["checks"] = $checks;
    $pass["holds"] = array_values(array_unique($holds));
    $pass["readiness"] = $ready ? "Ready" : $statusLabel;
    $pass["readiness_notes"] = implode("; ", array_unique($holds));
    $pass["can_admit"] = $ready;

    $conn->beginTransaction();

    $audit = $conn->prepare("
        INSERT INTO gate_movement_audit (
            id, appointment_id, gate_pass_id, operator_id, event_type, event_data
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
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not verify gate pass.",
        "code" => null
    ]);
}
