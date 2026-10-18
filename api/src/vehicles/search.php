<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
    exit;
}

$q = trim((string)($_POST["q"] ?? ""));

if (mb_strlen($q) < 2) {
    echo json_encode([
        "error" => false,
        "data" => "Enter at least two characters to search.",
        "code" => []
    ]);
    exit;
}

try {
    $search = "%" . $q . "%";

    $sql = "
        SELECT
            v.id,
            v.plate,
            v.kind,
            v.make,
            v.model,
            v.transporter
        FROM gate_vehicles v
        WHERE LOWER(v.status) = 'approved'
        AND v.insurance_expiry IS NOT NULL
        AND v.insurance_expiry >= CURDATE()
        AND v.roadworthiness_expiry IS NOT NULL
        AND v.roadworthiness_expiry >= CURDATE()
        AND (
            v.plate LIKE ?
            OR v.kind LIKE ?
            OR v.make LIKE ?
            OR v.model LIKE ?
            OR v.transporter LIKE ?
        )
        AND NOT EXISTS (
            SELECT 1
            FROM gate_driver_vehicle_assignments a
            WHERE a.vehicle_id = v.id
            AND a.unassigned_at IS NULL
        )
        ORDER BY v.plate ASC
        LIMIT 50
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$search, $search, $search, $search, $search]);

    echo json_encode([
        "error" => false,
        "data" => "Vehicles loaded successfully.",
        "code" => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => true, "data" => "Could not search vehicles.", "code" => null]);
}