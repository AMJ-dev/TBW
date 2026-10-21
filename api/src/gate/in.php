
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

            EXISTS (
                SELECT 1
                FROM gate_driver_vehicle_assignments dva
                WHERE dva.driver_id = a.driver_id
                  AND dva.vehicle_id = a.vehicle_id
                  AND dva.unassigned_at IS NULL
            ) AS assignment_eligible,

            EXISTS (
                SELECT 1
                FROM gate_movement_records gm
                WHERE gm.appointment_id = a.id
                  AND gm.direction = 'in'
                  AND gm.decision = 'ADMIT'
            ) AS already_admitted

        FROM gate_appointments a

        INNER JOIN gate_vehicles v
            ON v.id = a.vehicle_id

        INNER JOIN gate_drivers d
            ON d.id = a.driver_id

        INNER JOIN gate_passes p
            ON p.id = (
                SELECT gp.id
                FROM gate_passes gp
                WHERE gp.appointment_id = a.id
                ORDER BY gp.issued_at DESC
                LIMIT 1
            )

        WHERE a.appointment_date = CURDATE()
          AND a.status IN ('Confirmed', 'Arrived')
          AND p.type IN ('Terminal Entry', 'Collection')
          AND p.status = 'Active'
          AND p.valid_until > NOW()

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
    $result = [];

    $eligibleContainerStatuses = [
        "EXPECTED",
        "IN_TRANSIT_TO_TERMINAL"
    ];

    $eligibleShipmentStatuses = [
        "expected",
        "in_transit_to_terminal",
        "arrived_at_gate"
    ];

    foreach ($rows as $row) {
        $containers = !empty($row["container_nos"])
            ? array_values(array_unique(array_filter(
                array_map("trim", explode(",", $row["container_nos"]))
            )))
            : [];

        $appointmentStatus = strtolower(
            trim((string) $row["appointment_status"])
        );

        $appointmentEligible =
            in_array($appointmentStatus, ["confirmed", "arrived"], true) &&
            $row["appointment_date"] === $today;

        $vehicleEligible =
            $row["vehicle_status"] === "Approved" &&
            !empty($row["insurance_expiry"]) &&
            $row["insurance_expiry"] >= $today &&
            !empty($row["roadworthiness_expiry"]) &&
            $row["roadworthiness_expiry"] >= $today;

        $driverEligible =
            $row["driver_status"] === "Approved" &&
            !empty($row["licence_expiry"]) &&
            $row["licence_expiry"] >= $today;

        $passExpiry = !empty($row["valid_until"])
            ? strtotime($row["valid_until"])
            : false;

        $passEligible =
            $row["pass_status"] === "Active" &&
            $passExpiry !== false &&
            $passExpiry > $now &&
            in_array(
                $row["pass_type"],
                ["Terminal Entry", "Collection"],
                true
            );

        $assignmentEligible = (bool) $row["assignment_eligible"];
        $alreadyAdmitted = (bool) $row["already_admitted"];

        $cargoEligible = false;
        $cargoHolds = [];

        if (count($containers) > 0) {
            $cargoSql = "
                SELECT
                    ac.container_no,
                    pc.id AS portal_container_id,
                    pc.status AS container_status,
                    pc.gate_in_at,
                    pc.received_at,
                    ps.status AS shipment_status
                FROM gate_appointment_containers ac
                LEFT JOIN portal_shipment_containers pc
                    ON UPPER(TRIM(pc.container_no)) =
                       UPPER(TRIM(ac.container_no))
                LEFT JOIN portal_shipments ps
                    ON ps.id = pc.shipment_id
                WHERE ac.appointment_id = :appointment_id
                ORDER BY ac.container_no
            ";

            $cargoStmt = $conn->prepare($cargoSql);
            $cargoStmt->execute([
                ":appointment_id" => $row["appointment_id"]
            ]);

            $cargoRows = $cargoStmt->fetchAll(PDO::FETCH_ASSOC);

            $cargoByNumber = [];

            foreach ($cargoRows as $cargoRow) {
                $key = strtoupper(trim((string) $cargoRow["container_no"]));

                if (!isset($cargoByNumber[$key])) {
                    $cargoByNumber[$key] = [];
                }

                $cargoByNumber[$key][] = $cargoRow;
            }

            $cargoEligible = true;

            foreach ($containers as $containerNo) {
                $key = strtoupper(trim($containerNo));
                $matches = $cargoByNumber[$key] ?? [];

                if (count($matches) !== 1) {
                    $cargoEligible = false;
                    $cargoHolds[] = count($matches) === 0
                        ? "Container {$containerNo} is not linked to a shipment"
                        : "Container {$containerNo} matches multiple shipment records";
                    continue;
                }

                $cargo = $matches[0];

                $containerStatus = strtoupper(
                    trim((string) $cargo["container_status"])
                );

                $shipmentStatus = strtolower(
                    trim((string) $cargo["shipment_status"])
                );

                if (
                    !in_array(
                        $containerStatus,
                        $eligibleContainerStatuses,
                        true
                    ) ||
                    !in_array(
                        $shipmentStatus,
                        $eligibleShipmentStatuses,
                        true
                    ) ||
                    !empty($cargo["gate_in_at"]) ||
                    !empty($cargo["received_at"])
                ) {
                    $cargoEligible = false;
                    $cargoHolds[] = "Container {$containerNo} is not eligible for gate-in";
                }
            }
        } else {
            $cargoHolds[] = "No containers are linked to this appointment";
        }

        $checks = [
            "vehicle" => $vehicleEligible,
            "driver" => $driverEligible,
            "assignment" => $assignmentEligible,
            "appointment" => $appointmentEligible,
            "cargo" => $cargoEligible,
            "financial" => null,
            "release" => null,
            "pass" => $passEligible
        ];

        $holds = [];

        if (!$appointmentEligible) {
            $holds[] = "Appointment date or status does not permit gate-in";
        }

        if (!$vehicleEligible) {
            $holds[] = "Vehicle approval or required documents are invalid or expired";
        }

        if (!$driverEligible) {
            $holds[] = "Driver approval or licence is invalid or expired";
        }

        if (!$assignmentEligible) {
            $holds[] = "Driver is not currently assigned to this vehicle";
        }

        if (!$passEligible) {
            $holds[] = "Gate pass is expired, inactive or invalid for gate-in";
        }

        if (!$cargoEligible) {
            $holds = array_merge($holds, $cargoHolds);
        }

        if ($alreadyAdmitted) {
            $holds[] = "Appointment has already been admitted";
        }

        $canAdmit =
            $vehicleEligible &&
            $driverEligible &&
            $assignmentEligible &&
            $appointmentEligible &&
            $passEligible &&
            $cargoEligible &&
            !$alreadyAdmitted &&
            count($holds) === 0;

        $row["container_nos"] = $containers;
        $row["assignment_eligible"] = $assignmentEligible;
        $row["already_admitted"] = $alreadyAdmitted;
        $row["checks"] = $checks;
        $row["holds"] = $holds;
        $row["readiness"] = $canAdmit
            ? "Ready"
            : "Needs verification";
        $row["readiness_notes"] = $canAdmit
            ? "All required gate-in checks passed."
            : implode("; ", $holds);
        $row["purpose"] = $row["pass_type"] ?: "Terminal movement";
        $row["consignment"] = "";
        $row["can_admit"] = $canAdmit;

        // if ($canAdmit) {
        //     $result[] = $row;
        // }
    }

    echo json_encode([
        "error" => false,
        "data" => "Gate-in queue loaded successfully.",
        "code" => $result,
        "count" => count($result)
    ]);
} catch (Throwable $e) {
    error_log("Gate-in queue error: " . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not load gate-in queue.",
        "code" => null
    ]);
}
