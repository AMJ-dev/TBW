<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

try {
    $stmt = $conn->prepare("
        SELECT
            id,
            plate,
            kind,
            make,
            model,
            year,
            capacity,
            owner,
            transporter,
            insurance_expiry,
            roadworthiness_expiry,
            notes,
            status,
            NULL AS last_visit,
            created_at,
            updated_at
        FROM gate_vehicles
        ORDER BY created_at DESC
    ");
    $stmt->execute();

    $vehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($vehicles as &$vehicle) {
        if (
            $vehicle["status"] === "Approved" &&
            (
                (!empty($vehicle["insurance_expiry"]) &&
                    $vehicle["insurance_expiry"] < date("Y-m-d")) ||
                (!empty($vehicle["roadworthiness_expiry"]) &&
                    $vehicle["roadworthiness_expiry"] < date("Y-m-d"))
            )
        ) {
            $vehicle["status"] = "Expired documents";
        }
    }
    unset($vehicle);

    echo json_encode([
        "error" => false,
        "data" => "Vehicles loaded successfully.",
        "code" => $vehicles
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not load vehicles.",
        "code" => null
    ]);
}