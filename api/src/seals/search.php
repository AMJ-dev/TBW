<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json");

try {
    $container_number = strtoupper(trim($_POST["container_number"] ?? ""));

    if ($container_number === "") {
        echo json_encode([
            "error" => true,
            "data" => "Enter a container number.",
            "code" => null
        ]);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT
            c.id,
            c.container_no AS container_number,
            c.seal_no AS declared_seal_number,
            c.size,
            c.status AS container_status,
            c.shipment_id,
            c.current_location_id,
            s.shipment_reference,
            s.bill_of_lading,
            s.organisation_id,
            COALESCE(
                NULLIF(rc.actual_seal_no, ''),
                NULLIF(c.seal_no, '')
            ) AS current_seal_number,
            rc.expected_seal_no,
            rc.actual_seal_no,
            rc.condition_status,
            rc.receiving_status,
            rc.received_at,
            COALESCE(
                tl.name,
                rc.receiving_location,
                'Not assigned'
            ) AS current_location,
            tl.kind AS location_type
        FROM portal_shipment_containers c
        INNER JOIN portal_shipments s
            ON s.id = c.shipment_id
        LEFT JOIN terminal_locations tl
            ON tl.id = c.current_location_id
        LEFT JOIN portal_receiving_containers rc
            ON rc.id = (
                SELECT rci.id
                FROM portal_receiving_containers rci
                WHERE rci.container_id = c.id
                ORDER BY
                    rci.received_at DESC,
                    rci.created_at DESC
                LIMIT 1
            )
        WHERE UPPER(c.container_no) = :container_number
        LIMIT 1
    ");

    $stmt->execute([
        ":container_number" => $container_number
    ]);

    $container = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$container) {
        echo json_encode([
            "error" => true,
            "data" => "Container not found.",
            "code" => null
        ]);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT
            id,
            event_type,
            seal_number,
            previous_seal_number,
            seal_type,
            location,
            status,
            notes,
            photo_path,
            recorded_at
        FROM terminal_seal_events
        WHERE container_id = :container_id
        ORDER BY recorded_at DESC
    ");

    $stmt->execute([
        ":container_id" => $container["id"]
    ]);

    $container["seal_history"] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "error" => false,
        "data" => $container,
        "code" => null
    ]);

} catch (Throwable $e) {
    error_log($e->getMessage());

    echo json_encode([
        "error" => true,
        "data" => "Could not search for container.",
        "code" => null
    ]);
}