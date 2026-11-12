<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json");

try {
    $stmt = $conn->prepare("
        SELECT
            id,
            equipment_name,
            equipment_code,
            equipment_type,
            registration_number,
            capacity,
            capacity_unit,
            operational_status,
            description,
            is_active,
            created_at,
            updated_at
        FROM terminal_equipment
        ORDER BY created_at DESC
    ");

    $stmt->execute();

    $equipment = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($equipment as &$item) {
        $item["capacity"] = $item["capacity"] !== null
            ? (float) $item["capacity"]
            : null;

        $item["is_active"] = (bool) $item["is_active"];
    }

    unset($item);

    echo json_encode([
        "error" => false,
        "data" => "Equipment loaded successfully.",
        "code" => $equipment
    ]);

} catch (Throwable $e) {
    echo json_encode([
        "error" => true,
        "data" => "Could not load equipment.",
        "code" => null
    ]);
}