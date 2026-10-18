<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json");

try {
    $stmt = $conn->query("
        SELECT
            d.*,
            NULL AS last_visit,
            CASE
                WHEN d.licence_expiry IS NOT NULL
                    AND d.licence_expiry < CURDATE()
                    AND d.status = 'Approved'
                THEN 'Expired documents'
                ELSE d.status
            END AS display_status
        FROM gate_drivers d
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