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
            gp.id,
            gp.pass_code,
            gp.vehicle_id,
            gp.appointment_id,
            gp.driver_id,
            gp.type,
            gp.issued_at,
            gp.status,
            a.appointment_date,
            a.slot_time,
            v.plate AS vehicle_plate,
            d.name AS driver_name,
            d.phone AS driver_phone
        FROM gate_passes gp
        INNER JOIN gate_appointments a
            ON a.id COLLATE utf8mb4_unicode_ci =
               gp.appointment_id COLLATE utf8mb4_unicode_ci
        INNER JOIN gate_vehicles v
            ON gp.vehicle_id COLLATE utf8mb4_unicode_ci =
               v.id COLLATE utf8mb4_unicode_ci
        INNER JOIN gate_drivers d
            ON gp.driver_id COLLATE utf8mb4_unicode_ci =
               d.id COLLATE utf8mb4_unicode_ci
        ORDER BY gp.issued_at DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $passes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($passes) > 0) {
        $appointmentIds = array_values(array_unique(array_filter(array_column($passes, "appointment_id"))));
        $containersByPass = [];

        if (count($appointmentIds) > 0) {
            $namedPlaceholders = [];
            foreach ($appointmentIds as $index => $appointmentId) {
                $namedPlaceholders[] = ":appointment_id_" . $index;
            }

            $containerSql = "
                SELECT appointment_id, container_no
                FROM gate_appointment_containers
                WHERE appointment_id COLLATE utf8mb4_unicode_ci IN (" . implode(",", $namedPlaceholders) . ")
                ORDER BY container_no ASC
            ";

            $containerStmt = $conn->prepare($containerSql);

            foreach ($appointmentIds as $index => $appointmentId) {
                $containerStmt->bindValue(":appointment_id_" . $index, $appointmentId, PDO::PARAM_STR);
            }

            $containerStmt->execute();
            $containers = $containerStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($containers as $container) {
                $containersByPass[$container["appointment_id"]][] = $container["container_no"];
            }
        }

        foreach ($passes as &$pass) {
            $pass["container_nos"] = $containersByPass[$pass["appointment_id"]] ?? [];
            $appointmentDate = !empty($pass["appointment_date"])
                ? date("Y-m-d", strtotime((string) $pass["appointment_date"]))
                : null;
            $pass["is_valid_today"] =
                strtolower(trim((string) ($pass["status"] ?? ""))) === "active" &&
                $appointmentDate === date("Y-m-d");
        }

        unset($pass);
    }

    echo json_encode([
        "error" => false,
        "data" => "Gate passes loaded successfully.",
        "code" => $passes
    ], JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    error_log("Gate passes list error: " . $e->getMessage());

    echo json_encode([
        "error" => true,
        "data" => "Could not load gate passes.",
        "code" => null
    ]);
}
