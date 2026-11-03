<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=UTF-8");

try {
    $sql = "
        SELECT
            id,
            equipment_name,
            equipment_type,
            operational_status
        FROM terminal_equipment
        WHERE is_active = 1
        AND operational_status = 'AVAILABLE'
        ORDER BY equipment_name ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    echo json_encode([
        "error" => false,
        "data" => [
            "equipments" => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ],
        "code" => 200
    ]);

} catch (Throwable $e) {
    echo json_encode([
        "error" => true,
        "data" => "Could not load available equipment.",
        "code" => 500
    ]);
}