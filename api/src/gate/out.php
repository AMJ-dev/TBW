
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
   
    echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
    exit;
}

try {
    $sql = "
        SELECT
            m.appointment_id AS id,
            m.appointment_id,
            a.appointment_date,
            a.slot_time,
            v.id AS vehicle_id,
            v.plate AS vehicle_plate,
            v.transporter,
            d.id AS driver_id,
            d.name AS driver_name,
            d.phone AS driver_phone,
            p.id AS gate_pass_id,
            p.pass_code,
            p.status AS pass_status,
            p.valid_until,
            p.type AS pass_type,
            MAX(m.movement_at) AS gate_in_at,
            (
                SELECT GROUP_CONCAT(c.container_no ORDER BY c.container_no SEPARATOR ',')
                FROM gate_appointment_containers c
                WHERE c.appointment_id = a.id
            ) AS container_nos
        FROM gate_movement_records m
        INNER JOIN gate_appointments a ON a.id = m.appointment_id
        INNER JOIN gate_vehicles v ON v.id = m.vehicle_id
        INNER JOIN gate_drivers d ON d.id = m.driver_id
        LEFT JOIN gate_passes p ON p.id = m.gate_pass_id
        WHERE m.direction = 'in'
          AND m.decision = 'ADMIT'
          AND NOT EXISTS (
              SELECT 1
              FROM gate_movement_records outm
              WHERE outm.appointment_id = m.appointment_id
                AND outm.direction = 'out'
                AND outm.decision = 'ADMIT'
          )
        GROUP BY
            m.appointment_id, a.appointment_date, a.slot_time,
            v.id, v.plate, v.transporter, d.id, d.name, d.phone,
            p.id, p.pass_code, p.status, p.valid_until, p.type
        ORDER BY gate_in_at ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$row) {
        $row["container_nos"] = !empty($row["container_nos"])
            ? explode(",", $row["container_nos"])
            : [];

        $row["checks"] = [
            "vehicle" => true,
            "driver" => true,
            "appointment" => true,
            "cargo" => false,
            "financial" => false,
            "release" => false,
            "pass" => !empty($row["gate_pass_id"])
                && $row["pass_status"] === "Active"
                && strtotime($row["valid_until"]) >= time()
                && $row["pass_type"] === "Gate-Out Clearance"
        ];

        $row["readiness"] = "Needs verification";
        $row["holds"] = ["Release authorisation and financial clearance are not connected"];
    }
    unset($row);

    echo json_encode(["error" => false, "data" => "Gate-out queue loaded successfully.", "code" => $rows]);
} catch (Throwable $e) {
    
    echo json_encode(["error" => true, "data" => "Could not load gate-out queue.", "code" => null]);
}
