<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
    exit;
}

try {
    $sql = "
        SELECT
            m.appointment_id AS id,
            m.appointment_id,
            a.appointment_date,
            a.slot_time,
            v.id AS vehicle_id,
            v.plate AS vehicle_plate,
            v.transporter,
            d.id AS driver_id,
            d.name AS driver_name,
            d.phone AS driver_phone,
            p.id AS gate_pass_id,
            p.pass_code,
            p.status AS pass_status,
            p.type AS pass_type,
            MAX(m.movement_at) AS gate_in_at,
            (
                SELECT GROUP_CONCAT(c.container_no ORDER BY c.container_no SEPARATOR ',')
                FROM gate_appointment_containers c
                WHERE c.appointment_id = a.id
            ) AS container_nos
        FROM gate_movement_records m
        INNER JOIN gate_appointments a ON a.id = m.appointment_id
        INNER JOIN gate_vehicles v ON v.id = m.vehicle_id
        INNER JOIN gate_drivers d ON d.id = m.driver_id
        LEFT JOIN gate_passes p ON p.id = m.gate_pass_id
        WHERE m.direction = 'in'
          AND m.decision = 'ADMIT'
          AND NOT EXISTS (
              SELECT 1
              FROM gate_movement_records outm
              WHERE outm.appointment_id = m.appointment_id
                AND outm.direction = 'out'
                AND outm.decision = 'ADMIT'
          )
        GROUP BY
            m.appointment_id, a.appointment_date, a.slot_time,
            v.id, v.plate, v.transporter, d.id, d.name, d.phone,
            p.id, p.pass_code, p.status, p.type
        ORDER BY gate_in_at ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $appointmentIds = array_values(array_unique(array_filter(array_column($rows, "appointment_id"))));
    $containersByAppointment = [];

    if (count($appointmentIds) > 0) {
        $placeholders = [];
        $containerStmtParams = [];

        foreach ($appointmentIds as $index => $appointmentId) {
            $placeholder = ":appointment_id_" . $index;
            $placeholders[] = $placeholder;
            $containerStmtParams[$placeholder] = $appointmentId;
        }

        $containerSql = "
            SELECT *
            FROM gate_appointment_containers
            WHERE appointment_id IN (" . implode(", ", $placeholders) . ")
            ORDER BY container_no ASC
        ";

        $containerStmt = $conn->prepare($containerSql);
        foreach ($containerStmtParams as $placeholder => $value) {
            $containerStmt->bindValue($placeholder, $value);
        }
        $containerStmt->execute();
        $containerRows = $containerStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($containerRows as $containerRow) {
            $appointmentId = (string) ($containerRow["appointment_id"] ?? "");
            $containerNo = (string) ($containerRow["container_no"] ?? "");

            $sealNo = $containerRow["seal_no"]
                ?? $containerRow["seal_number"]
                ?? $containerRow["container_seal_no"]
                ?? $containerRow["container_seal_number"]
                ?? null;

            $containerSize = $containerRow["container_size"]
                ?? $containerRow["size"]
                ?? $containerRow["iso_size"]
                ?? null;

            $containerType = $containerRow["container_type"]
                ?? $containerRow["type"]
                ?? $containerRow["iso_type"]
                ?? null;

            $weight = $containerRow["weight"]
                ?? $containerRow["gross_weight"]
                ?? $containerRow["cargo_weight"]
                ?? null;

            $containersByAppointment[$appointmentId][] = [
                "container_no" => $containerNo,
                "seal_no" => $sealNo,
                "container_size" => $containerSize,
                "container_type" => $containerType,
                "weight" => $weight
            ];
        }
    }

    $today = date("Y-m-d");

    foreach ($rows as &$row) {
        $appointmentId = (string) ($row["appointment_id"] ?? "");
        $row["container_nos"] = !empty($row["container_nos"])
            ? explode(",", $row["container_nos"])
            : [];
        $row["containers"] = $containersByAppointment[$appointmentId] ?? [];

        $appointmentDate = !empty($row["appointment_date"])
            ? date("Y-m-d", strtotime((string) $row["appointment_date"]))
            : null;

        $passStatus = strtolower(trim((string) ($row["pass_status"] ?? "")));
        $passType = strtolower(trim((string) ($row["pass_type"] ?? "")));

        $passEligible =
            !empty($row["gate_pass_id"]) &&
            $passStatus === "active" &&
            $passType === "gate-out clearance" &&
            $appointmentDate === $today;

        $row["checks"] = [
            "vehicle" => true,
            "driver" => true,
            "appointment" => $appointmentDate === $today,
            "cargo" => count($row["containers"]) > 0,
            "financial" => false,
            "release" => false,
            "pass" => $passEligible
        ];

        $row["readiness"] = "Needs verification";
        $row["holds"] = [];

        if ($appointmentDate !== $today) {
            $row["holds"][] = "Appointment date is not today";
        }

        if (!$passEligible) {
            $row["holds"][] = "An active Gate-Out Clearance pass for today's appointment is required";
        }

        if (count($row["containers"]) === 0) {
            $row["holds"][] = "No containers are linked to this appointment";
        }

        $row["holds"][] = "Release authorisation and financial clearance are not connected";
    }
    unset($row);

    echo json_encode([
        "error" => false,
        "data" => "Gate-out queue loaded successfully.",
        "code" => $rows
    ], JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    error_log("Gate-out queue error: " . $e->getMessage());
    echo json_encode(["error" => true, "data" => "Could not load gate-out queue.", "code" => null]);
}
