<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $organisation_id = $my_details->organisation_id ?? null;

    try {
        $sql = "
            SELECT
                d.id AS driver_id,
                d.name AS driver_name,
                d.phone AS driver_phone,
                d.licence_number AS driver_licence_number,
                d.licence_expiry,
                d.transporter AS driver_transporter,
                d.status AS driver_status,
                a.id AS assignment_id,
                a.assigned_at,
                v.id AS vehicle_id,
                v.plate AS vehicle_plate,
                v.kind AS vehicle_kind,
                v.make AS vehicle_make,
                v.model AS vehicle_model,
                v.transporter AS vehicle_transporter
            FROM gate_drivers d
            LEFT JOIN gate_driver_vehicle_assignments a
                ON a.driver_id = d.id
                AND a.unassigned_at IS NULL
            LEFT JOIN gate_vehicles v
                ON v.id = a.vehicle_id
            WHERE d.organisation_id = :organisation_id
            ORDER BY d.name ASC
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([":organisation_id" => $organisation_id]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows as &$row) {
            if (
                strtolower((string)($row["driver_status"] ?? "")) === "approved" &&
                !empty($row["licence_expiry"]) &&
                $row["licence_expiry"] < date("Y-m-d")
            ) {
                $row["driver_status"] = "Expired documents";
            }

            $row["driver"] = [
                "id" => $row["driver_id"],
                "name" => $row["driver_name"],
                "phone" => $row["driver_phone"],
                "licence_number" => $row["driver_licence_number"],
                "licence_expiry" => $row["licence_expiry"],
                "transporter" => $row["driver_transporter"],
                "status" => $row["driver_status"]
            ];

            $row["vehicle"] = $row["vehicle_id"] ? [
                "id" => $row["vehicle_id"],
                "plate" => $row["vehicle_plate"],
                "kind" => $row["vehicle_kind"],
                "make" => $row["vehicle_make"],
                "model" => $row["vehicle_model"],
                "transporter" => $row["vehicle_transporter"]
            ] : null;

            $row["assigned_at"] = $row["assigned_at"] ?? null;

            unset(
                $row["driver_id"],
                $row["driver_name"],
                $row["driver_phone"],
                $row["driver_licence_number"],
                $row["licence_expiry"],
                $row["driver_transporter"],
                $row["driver_status"],
                $row["assignment_id"],
                $row["vehicle_id"],
                $row["vehicle_plate"],
                $row["vehicle_kind"],
                $row["vehicle_make"],
                $row["vehicle_model"],
                $row["vehicle_transporter"]
            );
        }
        unset($row);

        echo json_encode([
            "error" => false,
            "data" => "Driver assignments loaded successfully.",
            "code" => $rows
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            "error" => true,
            "data" => "Could not load driver assignments.",
            "code" => null
        ]);
    }