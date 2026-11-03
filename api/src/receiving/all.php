<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

try {
    $stmt = $conn->prepare("
        SELECT
            r.*,
            s.shipment_reference,
            s.bill_of_lading,
            s.booking_number,
            s.vessel_name,
            s.voyage_number,
            s.shipping_line,
            s.origin_country,
            s.origin_port,
            s.destination_port,
            s.cargo_description,
            s.cargo_category,
            s.package_type,
            s.package_count,
            s.gross_weight AS shipment_gross_weight
        FROM portal_receiving r
        LEFT JOIN portal_shipments s
            ON s.id = r.shipment_id
        ORDER BY r.created_at DESC
    ");

    $stmt->execute();
    $receiving = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $containerStmt = $conn->prepare("
        SELECT
            rc.id,
            rc.receiving_id,
            rc.shipment_id,
            rc.container_id,
            rc.container_no,
            rc.gate_pass_number,
            rc.expected_seal_no,
            rc.actual_seal_no,
            rc.condition_status,
            rc.actual_weight,
            rc.receiving_location,
            rc.receiving_location_id,
            rc.damage_proof_path,
            rc.receiving_status,
            rc.remarks,
            rc.received_by,
            rc.received_at,
            sc.seal_no,
            sc.gross_weight AS expected_weight,
            sc.size AS container_size,
            sc.status AS container_status
        FROM portal_receiving_containers rc
        LEFT JOIN portal_shipment_containers sc
            ON sc.id = rc.container_id
        WHERE rc.receiving_id = :receiving_id
        ORDER BY rc.received_at DESC
    ");

    foreach ($receiving as &$record) {
        $containerStmt->execute([
            "receiving_id" => $record["id"]
        ]);

        $containers = $containerStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($containers as &$container) {
            $container["expected_seal_no"] =
                $container["expected_seal_no"]
                ?: ($container["seal_no"] ?? null);
        }

        unset($container);

        $record["containers"] = $containers;
        $record["total_containers"] = (int) ($record["total_containers"] ?? 0);
        $record["received_containers"] = (int) ($record["received_containers"] ?? 0);
        $record["discrepancy_containers"] = (int) ($record["discrepancy_containers"] ?? 0);

        $record["total_expected_weight"] = array_sum(
            array_map(
                fn($container) => (float) ($container["expected_weight"] ?? 0),
                $containers
            )
        );

        $record["total_actual_weight"] = array_sum(
            array_map(
                fn($container) => (float) ($container["actual_weight"] ?? 0),
                $containers
            )
        );

        $record["container_no"] = implode(
            ", ",
            array_filter(array_column($containers, "container_no"))
        );

        $record["seal_number"] = implode(
            ", ",
            array_filter(array_column($containers, "expected_seal_no"))
        );

        $record["observed_seal_number"] = implode(
            ", ",
            array_filter(array_column($containers, "actual_seal_no"))
        );

        $record["actual_weight"] = $record["total_actual_weight"];
        $record["expected_weight"] = $record["total_expected_weight"];

        $record["receiving_location"] = implode(
            ", ",
            array_unique(
                array_filter(array_column($containers, "receiving_location"))
            )
        );

        $record["cargo_condition"] = implode(
            ", ",
            array_unique(
                array_filter(array_column($containers, "condition_status"))
            )
        );

        $record["discrepancy_notes"] = implode(
            "; ",
            array_filter(array_column($containers, "remarks"))
        );

        $receivedDates = array_filter(
            array_column($containers, "received_at")
        );

        $record["received_at"] = $receivedDates
            ? max($receivedDates)
            : ($record["started_at"] ?? null);
    }

    unset($record);

    echo json_encode([
        "error" => false,
        "data" => $receiving,
        "code" => null
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "error" => true,
        "data" => "Could not load receiving records.",
        "code" => $e->getMessage()
    ]);
}