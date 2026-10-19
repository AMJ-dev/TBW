
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
            a.id,
            a.id AS appointment_id,
            a.id AS appointment_reference,
            a.appointment_date,
            a.slot_time,
            a.status AS appointment_status,
            a.created_at,

            v.id AS vehicle_id,
            v.plate AS vehicle_plate,
            v.transporter,
            v.status AS vehicle_status,
            v.insurance_expiry,
            v.roadworthiness_expiry,

            d.id AS driver_id,
            d.name AS driver_name,
            d.phone AS driver_phone,
            d.status AS driver_status,
            d.licence_expiry,

            p.id AS gate_pass_id,
            p.pass_code,
            p.type AS pass_type,
            p.status AS pass_status,
            p.valid_until,

            (
                SELECT GROUP_CONCAT(
                    ac.container_no
                    ORDER BY ac.container_no
                    SEPARATOR ','
                )
                FROM gate_appointment_containers ac
                WHERE ac.appointment_id = a.id
            ) AS container_nos,

            (
                SELECT COUNT(*)
                FROM gate_movement_records gm
                WHERE gm.appointment_id = a.id
                  AND gm.direction = 'in'
                  AND gm.decision = 'ADMIT'
            ) AS admitted_count

        FROM gate_appointments a
        LEFT JOIN gate_vehicles v ON v.id = a.vehicle_id
        LEFT JOIN gate_drivers d ON d.id = a.driver_id
        LEFT JOIN gate_passes p ON p.id = (
            SELECT gp.id
            FROM gate_passes gp
            WHERE gp.appointment_id = a.id
            ORDER BY gp.issued_at DESC
            LIMIT 1
        )

        WHERE a.appointment_date >= CURDATE()

        ORDER BY
            a.appointment_date ASC,
            a.slot_time ASC,
            a.created_at ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $today = date("Y-m-d");
    $now = time();

    foreach ($rows as &$row) {
        $row["container_nos"] = !empty($row["container_nos"])
            ? explode(",", $row["container_nos"])
            : [];

        $row["admitted_count"] = (int) $row["admitted_count"];

        $appointmentStatus = strtolower(
            trim((string) $row["appointment_status"])
        );

        $appointmentEligible = in_array(
            $appointmentStatus,
            ["confirmed", "arrived"],
            true
        );

        $vehicleEligible =
            !empty($row["vehicle_id"]) &&
            $row["vehicle_status"] === "Approved" &&
            !empty($row["insurance_expiry"]) &&
            $row["insurance_expiry"] >= $today &&
            !empty($row["roadworthiness_expiry"]) &&
            $row["roadworthiness_expiry"] >= $today;

        $driverEligible =
            !empty($row["driver_id"]) &&
            $row["driver_status"] === "Approved" &&
            !empty($row["licence_expiry"]) &&
            $row["licence_expiry"] >= $today;

        $passExpiry = !empty($row["valid_until"])
            ? strtotime($row["valid_until"])
            : false;

        $passEligible =
            !empty($row["gate_pass_id"]) &&
            $row["pass_status"] === "Active" &&
            $passExpiry !== false &&
            $passExpiry >= $now &&
            in_array(
                $row["pass_type"],
                ["Terminal Entry", "Collection"],
                true
            );

        $alreadyAdmitted = $row["admitted_count"] > 0;

        $row["checks"] = [
            "vehicle" => $vehicleEligible,
            "driver" => $driverEligible,
            "appointment" => $appointmentEligible,
            "cargo" => false,
            "financial" => false,
            "release" => false,
            "pass" => $passEligible
        ];

        $row["holds"] = [];

        if (!$appointmentEligible) {
            $row["holds"][] = "Appointment status: " .
                $row["appointment_status"];
        }

        if (!$vehicleEligible) {
            $row["holds"][] = "Vehicle approval or documents are invalid";
        }

        if (!$driverEligible) {
            $row["holds"][] = "Driver approval or licence is invalid";
        }

        if (!$passEligible) {
            $row["holds"][] = "Valid active gate pass required";
        }

        if ($alreadyAdmitted) {
            $row["holds"][] = "Vehicle has already been admitted";
        }

        $row["holds"][] = "Cargo readiness must be verified";

        $row["readiness"] = "Needs verification";
        $row["readiness_notes"] = "Review the verification checks and holds.";

        $row["purpose"] = $row["pass_type"] ?: "Terminal movement";
        $row["consignment"] = "";
        $row["already_admitted"] = $alreadyAdmitted;

        $row["can_admit"] =
            $appointmentEligible &&
            $vehicleEligible &&
            $driverEligible &&
            $passEligible &&
            !$alreadyAdmitted;
    }
    unset($row);

    echo json_encode([
        "error" => false,
        "data" => "Gate-in queue loaded successfully.",
        "code" => $rows,
        "count" => count($rows)
    ]);
} catch (Throwable $e) {
    error_log("Gate-in queue error: " . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not load gate-in queue.",
        "code" => $e->getMessage()
    ]);
}