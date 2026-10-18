<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

$id = trim($_POST["id"] ?? "");

if ($id === "") {
    http_response_code(400);
    echo json_encode([
        "error" => true,
        "data" => "Vehicle ID is required.",
        "code" => null
    ]);
    exit;
}

try {
    $stmt = $conn->prepare("
        UPDATE gate_vehicles
        SET status = 'Approved'
        WHERE id = ?
          AND status IN ('Suspended', 'Inactive', 'Pending review')
          AND (insurance_expiry IS NULL OR insurance_expiry >= CURDATE())
          AND (roadworthiness_expiry IS NULL OR roadworthiness_expiry >= CURDATE())
    ");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        $check = $conn->prepare("
            SELECT
                status,
                insurance_expiry,
                roadworthiness_expiry
            FROM gate_vehicles
            WHERE id = ?
            LIMIT 1
        ");
        $check->execute([$id]);
        $vehicle = $check->fetch(PDO::FETCH_ASSOC);

        if (!$vehicle) {
            http_response_code(404);
            echo json_encode([
                "error" => true,
                "data" => "Vehicle not found.",
                "code" => null
            ]);
            exit;
        }

        if (
            ($vehicle["insurance_expiry"] !== null &&
                $vehicle["insurance_expiry"] < date("Y-m-d")) ||
            ($vehicle["roadworthiness_expiry"] !== null &&
                $vehicle["roadworthiness_expiry"] < date("Y-m-d"))
        ) {
            http_response_code(409);
            echo json_encode([
                "error" => true,
                "data" => "Vehicle documents have expired. Renew them before activation.",
                "code" => $vehicle
            ]);
            exit;
        }

        http_response_code(409);
        echo json_encode([
            "error" => true,
            "data" => "This vehicle cannot be activated from its current status.",
            "code" => $vehicle
        ]);
        exit;
    }

    echo json_encode([
        "error" => false,
        "data" => "Vehicle activated successfully.",
        "code" => ["id" => $id, "status" => "Approved"]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not activate vehicle.",
        "code" => null
    ]);
}