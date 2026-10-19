
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
    exit;
}

try {
    $sql = "
        SELECT
            a.id AS appointment_id,
            a.id,
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
            p.id AS gate_pass_id,
            p.pass_code,
            p.status AS pass_status,
            p.valid_until,
            p.type AS pass_type,
            (
                SELECT GROUP_CONCAT(c.container_no ORDER BY c.container_no SEPARATOR ',')
                FROM gate_appointment_containers c
                WHERE c.appointment_id = a.id
            ) AS container_nos,
            (
                SELECT COUNT(*)
                FROM gate_movement_records m
                WHERE m.appointment_id = a.id
                  AND m.direction = 'in'
                  AND m.decision = 'ADMIT'
            ) AS admitted_count
        FROM gate_appointments a
        INNER JOIN gate_vehicles v ON v.id = a.vehicle_id
        INNER JOIN gate_drivers d ON d.id = a.driver_id
        LEFT JOIN gate_passes p ON p.appointment_id = a.id
        WHERE a.appointment_date = CURDATE()
          AND a.status IN ('Confirmed', 'Arrived')
          AND NOT EXISTS (
              SELECT 1
              FROM gate_movement_records m
              WHERE m.appointment_id = a.id
                AND m.direction = 'in'
                AND m.decision = 'ADMIT'
          )
        ORDER BY a.slot_time ASC, a.created_at ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$row) {
        $row["container_nos"] = !empty($row["container_nos"])
            ? explode(",", $row["container_nos"])
            : [];

        $vehicleEligible =
            $row["vehicle_status"] === "Approved" &&
            !empty($row["insurance_expiry"]) &&
            $row["insurance_expiry"] >= date("Y-m-d") &&
            !empty($row["roadworthiness_expiry"]) &&
            $row["roadworthiness_expiry"] >= date("Y-m-d");

        $driverEligible =
            $row["driver_status"] === "Approved" &&
            !empty($row["licence_expiry"]) &&
            $row["licence_expiry"] >= date("Y-m-d");

        $passEligible =
            !empty($row["gate_pass_id"]) &&
            $row["pass_status"] === "Active" &&
            strtotime($row["valid_until"]) >= time() &&
            in_array($row["pass_type"], ["Terminal Entry", "Collection"], true);

        $row["checks"] = [
            "vehicle" => $vehicleEligible,
            "driver" => $driverEligible,
            "appointment" => true,
            "cargo" => false,
            "financial" => false,
            "release" => false,
            "pass" => $passEligible
        ];

        $row["readiness"] = "Needs verification";
        $row["holds"] = [];

        if (!$vehicleEligible) $row["holds"][] = "Vehicle approval or documents are invalid";
        if (!$driverEligible) $row["holds"][] = "Driver approval or licence is invalid";
        if (!$passEligible) $row["holds"][] = "Valid terminal-entry pass required";
        $row["holds"][] = "Cargo readiness must be verified";
    }
    unset($row);

    echo json_encode(["error" => false, "data" => "Gate-in queue loaded successfully.", "code" => $rows]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => true, "data" => "Could not load gate-in queue.", "code" => null]);
}
