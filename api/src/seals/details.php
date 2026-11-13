<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

$id = trim($_GET["id"] ?? "");

if ($id === "") {
    http_response_code(400);
    echo json_encode([
        "error" => true,
        "data" => "Seal event ID is required.",
        "code" => null
    ]);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT
            se.id,
            se.container_id,
            se.shipment_id,
            se.event_type,
            se.seal_number,
            se.previous_seal_number,
            se.seal_type,
            se.location,
            se.status,
            se.notes,
            se.photo_path,
            se.recorded_by,
            se.recorded_at,
            c.container_no,
            c.size AS container_size,
            s.shipment_reference,
            s.bill_of_lading,
            s.organisation_id,
            CASE
                WHEN u.id IS NOT NULL THEN u.full_name
                ELSE 'Unknown user'
            END AS recorded_by_name
        FROM terminal_seal_events se
        INNER JOIN portal_shipment_containers c
            ON c.id = se.container_id
        INNER JOIN portal_shipments s
            ON s.id = se.shipment_id
        LEFT JOIN users u
            ON u.id = se.recorded_by
        WHERE se.id = :id
        LIMIT 1
    ");

    $stmt->execute([
        ":id" => $id
    ]);

    $record = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$record) {
        http_response_code(404);
        echo json_encode([
            "error" => true,
            "data" => "Seal event not found.",
            "code" => null
        ]);
        exit;
    }

    $data = [
        "id" => $record["id"],
        "container_id" => $record["container_id"],
        "container_no" => $record["container_no"],
        "container_size" => $record["container_size"],
        "shipment_id" => $record["shipment_id"],
        "shipment_reference" => $record["shipment_reference"],
        "bill_of_lading" => $record["bill_of_lading"],
        "organisation_id" => $record["organisation_id"],
        "seal_number" => $record["seal_number"],
        "previous_seal_number" => $record["previous_seal_number"],
        "seal_type" => $record["seal_type"],
        "event_type" => $record["event_type"],
        "location" => $record["location"],
        "status" => $record["status"],
        "notes" => $record["notes"],
        "photo_path" => $record["photo_path"],
        "recorded_by" => $record["recorded_by_name"],
        "recorded_at" => $record["recorded_at"]
    ];

    echo json_encode([
        "error" => false,
        "data" => $data,
        "code" => null
    ]);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Could not load seal details.",
        "code" => $e->getMessage()
    ]);
}