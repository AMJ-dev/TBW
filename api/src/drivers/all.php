
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json");

try {
    $stmt = $conn->query("
        SELECT
            d.*,
            NULL AS last_visit,
            v.id AS vehicle_id,
            v.plate AS vehicle_plate,
            v.kind AS vehicle_kind,
            v.make AS vehicle_make,
            v.model AS vehicle_model,
            v.year AS vehicle_year,
            v.capacity AS vehicle_capacity,
            v.transporter AS vehicle_transporter,
            v.status AS vehicle_status,
            CASE
                WHEN d.licence_expiry IS NOT NULL
                    AND d.licence_expiry < CURDATE()
                    AND d.status = 'Approved'
                THEN 'Expired documents'
                ELSE d.status
            END AS display_status
        FROM gate_drivers d
        LEFT JOIN gate_driver_vehicle_assignments dva
            ON dva.driver_id = d.id
            AND dva.unassigned_at IS NULL
        LEFT JOIN gate_vehicles v
            ON v.id = dva.vehicle_id
        ORDER BY d.created_at DESC
    ");

    $drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($drivers as &$driver) {
        $driver["status"] = $driver["display_status"];
        unset($driver["display_status"]);
    }
    unset($driver);

    echo json_encode([
        "error" => false,
        "data" => "Drivers loaded successfully.",
        "code" => $drivers
    ]);
} catch (Throwable $e) {
    echo json_encode([
        "error" => true,
        "data" => "Could not load drivers.",
        "code" => null
    ]);
}
