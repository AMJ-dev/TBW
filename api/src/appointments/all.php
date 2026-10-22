
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
   
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed.",
        "code" => null
    ]);
    exit;
}

try {
    $sql = "
        SELECT
            a.id,
            a.booking_ref,
            a.appointment_date,
            a.slot_time,
            a.status,
            v.plate AS vehicle_plate,
            d.name AS driver_name,
            d.phone AS driver_phone,
            (
                SELECT GROUP_CONCAT(
                    c.container_no
                    ORDER BY c.container_no
                    SEPARATOR ','
                )
                FROM gate_appointment_containers c
                WHERE c.appointment_id = a.id
            ) AS container_nos
        FROM gate_appointments a
        INNER JOIN gate_vehicles v ON v.id = a.vehicle_id
        INNER JOIN gate_drivers d ON d.id = a.driver_id
        WHERE a.organisation_id = :organisation_id
        ORDER BY
            a.appointment_date DESC,
            a.slot_time ASC,
            a.created_at DESC
    ";
    // gate_passes gp gate_appointments
    $stmt = $conn->prepare($sql);
    $stmt->execute([":organisation_id" => $my_details->organisation_id]);

    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($appointments as &$appointment) {
        $appointment["container_nos"] = !empty($appointment["container_nos"])
            ? explode(",", $appointment["container_nos"])
            : [];

        $appointment["cargo_ref"] = null;
        $appointment["assigned_lane"] = null;
    }
    unset($appointment);

    echo json_encode([
        "error" => false,
        "data" => "Appointments loaded successfully.",
        "code" => $appointments
    ]);
} catch (Throwable $e) {
    
    echo json_encode([
        "error" => true,
        "data" => "Could not load appointments.",
        "code" => null
    ]);
}
