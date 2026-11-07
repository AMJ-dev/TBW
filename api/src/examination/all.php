<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $sql = "
            SELECT
                e.id,
                e.id AS reference,
                e.examination_type,
                e.location_id,
                e.officer_id,
                e.scheduled_date,
                e.scheduled_time,
                e.completed_at,
                e.status,
                e.findings,
                e.remarks,

                c.id AS container_id,
                c.container_no,
                c.size AS container_size,
                c.seal_no,

                s.id AS shipment_id,
                s.shipment_reference,
                s.bill_of_lading,
                s.vessel_name,
                s.voyage_number,
                s.shipping_line,
                s.consignee,

                u.full_name AS officer

            FROM terminal_examinations e

            LEFT JOIN portal_shipment_containers c
                ON c.id = e.container_id

            LEFT JOIN portal_shipments s
                ON s.id = c.shipment_id

            LEFT JOIN users u
                ON u.id = e.officer_id

            ORDER BY e.scheduled_date DESC, e.scheduled_time DESC
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute();

        $examinations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($examinations as &$examination) {
            $examination["location"] = $examination["location_id"];
        }

        unset($examination);

        echo json_encode([
            "error" => false,
            "data" => "Examinations loaded successfully.",
            "code" => [
                "examinations" => $examinations,
                "total" => count($examinations)
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not load examinations.",
            "code" => null
        ]);
    }