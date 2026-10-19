
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
    exit;
}

$passCode = trim((string)($_POST["pass_code"] ?? ""));
$plate = strtoupper(trim((string)($_POST["plate"] ?? "")));

if ($passCode === "" && $plate === "") {
    http_response_code(422);
    echo json_encode(["error" => true, "data" => "Enter a pass code or vehicle plate.", "code" => null]);
    exit;
}

try {
    $sql = "
        SELECT
            p.id AS gate_pass_id,
            p.pass_code,
            p.type AS pass_type,
            p.status AS pass_status,
            p.valid_until,
            a.id AS appointment_id,
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
            ) AS appointment_container_nos
        FROM gate_passes p
        INNER JOIN gate_appointments a ON a.id = p.appointment_id
        INNER JOIN gate_vehicles v ON v.id = p.vehicle_id
        INNER JOIN gate_drivers d ON d.id = p.driver_id
        WHERE " . ($passCode !== "" ? "p.pass_code = ?" : "v.plate = ?") . "
        ORDER BY p.issued_at DESC
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$passCode !== "" ? $passCode : $plate]);
    $pass = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$pass) {
        http_response_code(404);
        echo json_encode(["error" => true, "data" => "No matching gate pass found.", "code" => null]);
        exit;
    }

    $today = date("Y-m-d");

    $vehicleEligible =
        $pass["vehicle_status"] === "Approved" &&
        !empty($pass["insurance_expiry"]) &&
        $pass["insurance_expiry"] >= $today &&
        !empty($pass["roadworthiness_expiry"]) &&
        $pass["roadworthiness_expiry"] >= $today;

    $driverEligible =
        $pass["driver_status"] === "Approved" &&
        !empty($pass["licence_expiry"]) &&
        $pass["licence_expiry"] >= $today;

    $passEligible =
        $pass["pass_status"] === "Active" &&
        strtotime($pass["valid_until"]) >= time();

    $containers = !empty($pass["pass_container_nos"])
        ? explode(",", $pass["pass_container_nos"])
        : [];

    $appointmentContainers = !empty($pass["appointment_container_nos"])
        ? explode(",", $pass["appointment_container_nos"])
        : [];

    $holds = [];

    if (!$vehicleEligible) $holds[] = "Vehicle approval or documents are invalid";
    if (!$driverEligible) $holds[] = "Driver approval or licence is invalid";
    if (!$passEligible) $holds[] = "Pass is expired, revoked or already redeemed";
    if ($pass["appointment_date"] !== $today) $holds[] = "Appointment is not scheduled for today";
    if (!in_array($pass["appointment_status"], ["Confirmed", "Arrived", "In Terminal"], true)) {
        $holds[] = "Appointment status does not permit movement";
    }
    if ($containers !== $appointmentContainers) $holds[] = "Pass containers do not match appointment containers";

    $pass["container_nos"] = $containers;
    $pass["checks"] = [
        "vehicle" => $vehicleEligible,
        "driver" => $driverEligible,
        "appointment" => $pass["appointment_date"] === $today
            && in_array($pass["appointment_status"], ["Confirmed", "Arrived", "In Terminal"], true),
        "pass" => $passEligible,
        "cargo" => false,
        "financial" => false,
        "release" => false
    ];
    $pass["holds"] = $holds;
    $pass["readiness"] = count($holds) === 0 ? "Needs verification" : "Not ready";

    $conn->beginTransaction();

    $audit = $conn->prepare("
        INSERT INTO gate_movement_audit
            (id, appointment_id, gate_pass_id, operator_id, event_type, event_data)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    $audit->execute([
        generateId(),
        $pass["appointment_id"],
        $pass["gate_pass_id"],
        $my_details->id ?? null,
        "PASS_VERIFIED",
        json_encode([
            "pass_code" => $pass["pass_code"],
            "plate" => $pass["vehicle_plate"],
            "holds" => $holds
        ])
    ]);

    $conn->commit();

    echo json_encode(["error" => false, "data" => "Pass verification completed.", "code" => $pass]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    http_response_code(500);
    echo json_encode(["error" => true, "data" => "Could not verify gate pass.", "code" => null]);
}
