<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=UTF-8");

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

    $column = match ($type) {
        "gate_pass" => "gp.gate_pass_number",
        "bill_of_lading" => "s.bill_of_lading",
        "shipment_reference" => "s.shipment_reference"
    };

    $stmt = $conn->prepare("
        SELECT
            s.id,
            s.shipment_reference,
            s.bill_of_lading,
            gp.gate_pass_number,
            s.consignee,
            s.vessel_name,
            s.voyage_number
        FROM portal_shipments s
        LEFT JOIN portal_gate_passes gp
            ON gp.shipment_id = s.id
        WHERE {$column} = :query
        LIMIT 1
    ");

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
                WHEN EXISTS (
                    SELECT 1
                    FROM portal_gate_pass_containers gpc
                    WHERE gpc.container_id = c.id
                      AND gpc.status = 'ENTERED'
                ) THEN 'ENTERED'
                ELSE 'NOT_ENTERED'
            END AS gate_status,
            COALESCE(r.receiving_status, 'PENDING') AS receiving_status
        FROM portal_shipment_containers c
        LEFT JOIN portal_receiving_containers r
            ON r.container_id = c.id
        WHERE c.shipment_id = :shipment_id
        ORDER BY c.container_no ASC
    ");

    $containerStmt->execute([
        "shipment_id" => $shipment["id"]
    ]);

    $containers = $containerStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($containers as &$container) {
        $container["actual_seal_no"] = "";
        $container["condition"] = "";
        $container["actual_weight"] = "";
        $container["receiving_location"] = "";
        $container["remarks"] = "";
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
    ]);
} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Could not search for the shipment.",
        "code" => $e->getMessage()
    ]);
}