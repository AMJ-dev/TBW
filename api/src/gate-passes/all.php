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
                gp.valid_until,
                gp.status,
                gp.issued_at,
                v.plate AS vehicle_plate,
                d.name AS driver_name,
                d.phone AS driver_phone
            FROM gate_passes gp
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
            $appointmentIds = array_column($passes, "appointment_id");
            $placeholders = implode(",", array_fill(0, count($appointmentIds), "?"));

            $containerStmt = $conn->prepare("
                SELECT appointment_id, container_no
                FROM gate_appointment_containers
                WHERE appointment_id COLLATE utf8mb4_unicode_ci IN ($placeholders)
                ORDER BY container_no ASC
            ");

            $containerStmt->execute($appointmentIds);
            $containers = $containerStmt->fetchAll(PDO::FETCH_ASSOC);

            $containersByPass = [];

            foreach ($containers as $container) {
                $containersByPass[$container["appointment_id"]][] =
                    $container["container_no"];
            }

            foreach ($passes as &$pass) {
                $pass["container_nos"] = $containersByPass[$pass["appointment_id"]] ?? [];
            }

            unset($pass);
        }

        echo json_encode([
            "error" => false,
            "data" => "Gate passes loaded successfully.",
            "code" => $passes
        ]);
    } catch (Throwable $e) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not load gate passes.",
            "code" => $e->getMessage()
        ]);
    }
