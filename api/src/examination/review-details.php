<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

try {
    $id = $_GET["id"] ?? null;

    if (!$id) {
        http_response_code(400);

        echo json_encode([
            "error" => true,
            "data" => "Examination ID is required.",
            "code" => null
        ]);
        exit;
    }

    $sql = "
        SELECT
            e.id,
            e.reference,
            e.examination_type,
            e.status AS examination_status,
            e.priority,
            e.scheduled_date,
            e.scheduled_time,
            e.completed_at AS completed_date,
            e.created_at,
            e.findings,
            e.remarks,

            c.id AS container_id,
            c.container_no,
            c.size AS container_size,
            c.seal_no,
            c.status AS container_status,

            s.id AS shipment_id,
            s.shipment_reference,
            s.bill_of_lading,
            s.vessel_name AS vessel,
            s.voyage_number AS voyage,
            s.shipping_line,
            s.consignee,

            u.full_name AS assigned_officer,

            l.name AS location

        FROM terminal_examinations e

        LEFT JOIN portal_shipment_containers c
            ON c.id = e.container_id

        LEFT JOIN portal_shipments s
            ON s.id = e.shipment_id

        LEFT JOIN users u
            ON u.id = e.officer_id

        LEFT JOIN terminal_locations l
            ON l.id = e.location_id

        WHERE e.id = :id
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ":id" => $id
    ]);

    $examination = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$examination) {
        http_response_code(404);

        echo json_encode([
            "error" => true,
            "data" => "Examination not found.",
            "code" => null
        ]);
        exit;
    }

    $findingsData = [];

    if (!empty($examination["findings"])) {
        $decoded = json_decode($examination["findings"], true);

        if (is_array($decoded)) {
            $findingsData = $decoded;
        }
    }

    $checklist = [];

    if (isset($findingsData["checklist"]) && is_array($findingsData["checklist"])) {
        $checklist = $findingsData["checklist"];
    }

    $findings = [];

    if (isset($findingsData["findings"]) && is_array($findingsData["findings"])) {
        $findings = $findingsData["findings"];
    } elseif (array_is_list($findingsData)) {
        $findings = $findingsData;
    }

    $examination["checklist"] = $checklist;
    $examination["findings"] = $findings;

    echo json_encode([
        "error" => false,
        "data" => "Examination details loaded successfully.",
        "code" => [
            "examination" => $examination
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Could not load examination.",
        "code" => null
    ]);
}