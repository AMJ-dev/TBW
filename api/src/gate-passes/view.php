
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed.",
        "code" => null
    ]);
    exit;
}

$id = trim((string)($_GET["id"] ?? ""));

if ($id === "") {
    http_response_code(400);
    echo json_encode([
        "error" => true,
        "data" => "Gate pass ID is required.",
        "code" => null
    ]);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT
            gp.id,
            gp.pass_code,
            gp.vehicle_id,
            gp.driver_id,
            gp.type,
            gp.issued_at,
            gp.valid_until,
            gp.status,
            gp.issued_at,
            v.plate AS vehicle_plate,
            d.name AS driver_name,
            d.phone AS driver_phone
        FROM gate_passes gp
        INNER JOIN gate_vehicles v
            ON CAST(gp.vehicle_id AS CHAR) = CAST(v.id AS CHAR)
        INNER JOIN gate_drivers d
            ON CAST(gp.driver_id AS CHAR) = CAST(d.id AS CHAR)
        WHERE CAST(gp.id AS CHAR) = ?
        LIMIT 1
    ");

    $stmt->execute([$id]);
    $pass = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$pass) {
        http_response_code(404);
        echo json_encode([
            "error" => true,
            "data" => "Gate pass not found.",
            "code" => null
        ]);
        exit;
    }

    $containerStmt = $conn->prepare("
        SELECT container_no
        FROM gate_pass_containers
        WHERE CAST(gate_pass_id AS CHAR) = ?
        ORDER BY container_no ASC
    ");

    $containerStmt->execute([$id]);
    $pass["container_nos"] = $containerStmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        "error" => false,
        "data" => "Gate pass loaded successfully.",
        "code" => $pass
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not load gate pass.",
        "code" => $e->getMessage()
    ]);
}
