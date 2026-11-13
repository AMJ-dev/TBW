<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

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
            s.organisation_id

        FROM terminal_seal_events se

        INNER JOIN portal_shipment_containers c
            ON c.id = se.container_id

        INNER JOIN portal_shipments s
            ON s.id = se.shipment_id

        ORDER BY se.recorded_at DESC
    ");

    $stmt->execute();

    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $data = [];

    foreach ($records as $record) {
        $data[] = [
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
            "recorded_by" => $record["recorded_by"],
            "recorded_at" => $record["recorded_at"]
        ];
    }

    echo json_encode([
        "error" => false,
        "data" => $data,
        "code" => null
    ]);

} catch (Throwable $e) {
    echo json_encode([
        "error" => true,
        "data" => "Could not load seal events.",
        "code" => null
    ]);
}