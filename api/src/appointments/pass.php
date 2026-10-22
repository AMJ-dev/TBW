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

    $id = trim((string)($_GET["id"] ?? ""));
    $organisation_id = $my_details->organisation_id ?? null;

    if ($id === "") {
        
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
                gp.appointment_id,
                gp.type,
                gp.issued_at,
                gp.valid_until,
                gp.status,
                v.plate AS vehicle_plate,
                d.name AS driver_name,
                d.phone AS driver_phone
            FROM gate_passes gp
            INNER JOIN gate_vehicles v
                ON CAST(gp.vehicle_id AS CHAR) = CAST(v.id AS CHAR)
            INNER JOIN gate_drivers d
                ON CAST(gp.driver_id AS CHAR) = CAST(d.id AS CHAR)
            WHERE CAST(gp.id AS CHAR) = :id && gp.organisation_id =:organisation_id
            LIMIT 1
        ");

        $stmt->execute([":id" => $id, "organisation_id" => $organisation_id]);
        $pass = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$pass) {
            
            echo json_encode([
                "error" => true,
                "data" => "Gate pass not found.",
                "code" => null
            ]);
            exit;
        }

        $containerStmt = $conn->prepare("
            SELECT
                c.id,
                c.container_no,
                c.container_no AS number,
                sc.size,
                sc.seal_no,
                sc.package_count,
                sc.gross_weight,
                sc.status,
                sc.gate_in_at,
                sc.received_at,
                sc.stored_at,
                sc.gate_out_at,
                sc.updated_at
            FROM gate_appointment_containers c
            LEFT JOIN portal_shipment_containers sc
                ON sc.container_no = c.container_no
            WHERE CAST(c.appointment_id AS CHAR) = ?
            ORDER BY c.container_no ASC
        ");

        $containerStmt->execute([$pass["appointment_id"]]);
        $pass["containers"] = $containerStmt->fetchAll(PDO::FETCH_ASSOC);
        $pass["container_nos"] = array_column($pass["containers"], "container_no");

        echo json_encode([
            "error" => false,
            "data" => "Gate pass loaded successfully.",
            "code" => $pass
        ]);
    } catch (Throwable $e) {
        
        echo json_encode([
            "error" => true,
            "data" => "Could not load gate pass.",
            "code" => $e->getMessage()
        ]);
    }