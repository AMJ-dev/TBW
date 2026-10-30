<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

try {
    $type = trim($_POST["type"] ?? "");
    $query = trim($_POST["q"] ?? "");

    if ($type === "" || $query === "") {
        echo json_encode([
            "error" => true,
            "data" => "Search type and reference are required.",
            "code" => null
        ]);
        exit;
    }

    $allowedTypes = [
        "gate_pass",
        "bill_of_lading",
        "shipment_reference"
    ];

    if (!in_array($type, $allowedTypes, true)) {
        echo json_encode([
            "error" => true,
            "data" => "Invalid search type.",
            "code" => null
        ]);
        exit;
    }

    if ($type === "gate_pass") {
        $stmt = $conn->prepare("
            SELECT DISTINCT
                s.id,
                s.shipment_reference,
                s.bill_of_lading,
                gp.pass_code AS gate_pass_number,
                s.consignee,
                s.vessel_name,
                s.voyage_number
            FROM gate_passes gp
            INNER JOIN gate_appointments ga
                ON ga.id = gp.appointment_id
            INNER JOIN gate_appointment_containers gac
                ON gac.appointment_id = ga.id
            INNER JOIN portal_shipment_containers c
                ON UPPER(TRIM(c.container_no)) = UPPER(TRIM(gac.container_no))
            INNER JOIN portal_shipments s
                ON s.id = c.shipment_id
            WHERE UPPER(TRIM(gp.pass_code)) = UPPER(TRIM(:query))
            ORDER BY s.shipment_reference ASC
            LIMIT 1
        ");
    } elseif ($type === "bill_of_lading") {
        $stmt = $conn->prepare("
            SELECT
                s.id,
                s.shipment_reference,
                s.bill_of_lading,
                (
                    SELECT gp.pass_code
                    FROM gate_passes gp
                    INNER JOIN gate_appointments ga
                        ON ga.id = gp.appointment_id
                    INNER JOIN gate_appointment_containers gac
                        ON gac.appointment_id = ga.id
                    INNER JOIN portal_shipment_containers c
                        ON UPPER(TRIM(c.container_no)) = UPPER(TRIM(gac.container_no))
                    WHERE c.shipment_id = s.id
                    ORDER BY gp.issued_at DESC
                    LIMIT 1
                ) AS gate_pass_number,
                s.consignee,
                s.vessel_name,
                s.voyage_number
            FROM portal_shipments s
            WHERE UPPER(TRIM(s.bill_of_lading)) = UPPER(TRIM(:query))
            ORDER BY s.shipment_reference ASC
            LIMIT 1
        ");
    } else {
        $stmt = $conn->prepare("
            SELECT
                s.id,
                s.shipment_reference,
                s.bill_of_lading,
                (
                    SELECT gp.pass_code
                    FROM gate_passes gp
                    INNER JOIN gate_appointments ga
                        ON ga.id = gp.appointment_id
                    INNER JOIN gate_appointment_containers gac
                        ON gac.appointment_id = ga.id
                    INNER JOIN portal_shipment_containers c
                        ON UPPER(TRIM(c.container_no)) = UPPER(TRIM(gac.container_no))
                    WHERE c.shipment_id = s.id
                    ORDER BY gp.issued_at DESC
                    LIMIT 1
                ) AS gate_pass_number,
                s.consignee,
                s.vessel_name,
                s.voyage_number
            FROM portal_shipments s
            WHERE UPPER(TRIM(s.shipment_reference)) = UPPER(TRIM(:query))
            LIMIT 1
        ");
    }

    $stmt->execute([
        "query" => $query
    ]);

    $shipment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$shipment) {
        echo json_encode([
            "error" => true,
            "data" => "No matching shipment was found.",
            "code" => null
        ]);
        exit;
    }

    $containerStmt = $conn->prepare("
        SELECT
            c.id,
            c.container_no,
            c.seal_no AS expected_seal_no,
            CASE
                WHEN UPPER(COALESCE(c.status, '')) IN (
                    'ENTERED',
                    'RECEIVED',
                    'UNDER_EXAMINATION',
                    'EXAMINATION_COMPLETE',
                    'CHARGES_PENDING',
                    'CHARGES_SETTLED',
                    'RELEASE_AUTHORISED',
                    'GATE_OUT',
                    'TRANSFERRED_OUT',
                    'RETURNED_RE_EXPORTED'
                )
                OR EXISTS (
                    SELECT 1
                    FROM gate_appointment_containers gac
                    INNER JOIN gate_appointments ga
                        ON ga.id = gac.appointment_id
                    INNER JOIN gate_passes gp
                        ON gp.appointment_id = ga.id
                    INNER JOIN gate_movement_records gmr
                        ON gmr.appointment_id = ga.id
                        AND gmr.gate_pass_id = gp.id
                    WHERE UPPER(TRIM(gac.container_no)) = UPPER(TRIM(c.container_no))
                        AND gmr.direction = 'in'
                        AND gmr.decision = 'ADMIT'
                )
                THEN 'ENTERED'
                ELSE 'NOT_ENTERED'
            END AS gate_status,
            COALESCE(r.receiving_status, 'PENDING') AS receiving_status,
            r.actual_seal_no,
            r.condition_status AS container_condition,
            r.actual_weight,
            r.receiving_location,
            r.remarks
        FROM portal_shipment_containers c
        LEFT JOIN portal_receiving_containers r
            ON r.container_id = c.id
            AND r.shipment_id = c.shipment_id
        WHERE c.shipment_id = :shipment_id
        ORDER BY c.container_no ASC
    ");

    $containerStmt->execute([
        "shipment_id" => $shipment["id"]
    ]);

    $containers = $containerStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($containers as &$container) {
        $container["expected_seal_no"] = $container["expected_seal_no"] ?? "";
        $container["actual_seal_no"] = $container["actual_seal_no"] ?? "";
        $container["condition"] = $container["container_condition"] ?? "";
        $container["actual_weight"] = $container["actual_weight"] ?? "";
        $container["receiving_location"] = $container["receiving_location"] ?? "";
        $container["remarks"] = $container["remarks"] ?? "";
        $container["selected"] = false;
    }

    unset($container);

    $shipment["gate_pass_number"] = $shipment["gate_pass_number"] ?? null;
    $shipment["total_containers"] = count($containers);
    $shipment["containers"] = $containers;

    echo json_encode([
        "error" => false,
        "data" => $shipment,
        "code" => null
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (PDOException $e) {
    error_log($e->getMessage());

    echo json_encode([
        "error" => true,
        "data" => "Could not search for the shipment.",
        "code" => null
    ]);
}