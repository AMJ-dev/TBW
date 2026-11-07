<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $id = $_GET["id"] ?? "";

        if (
            !is_string($id) ||
            !preg_match('/^[0-9a-zA-Z-]{1,36}$/', $id)
        ) {
            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "Invalid examination ID.",
                "code" => null
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT
                e.id,
                e.reference,
                e.container_id,
                e.shipment_id,
                e.examination_type,
                e.location_id,
                e.officer_id,
                e.scheduled_date,
                e.scheduled_time,
                e.priority,
                e.instructions,
                e.status,
                e.findings,
                e.remarks,
                e.completed_at,
                e.reviewed_by,
                e.reviewed_at,
                e.created_by,
                e.created_at,
                e.updated_at,

                s.shipment_reference,
                s.bill_of_lading,
                s.booking_number,
                s.vessel_name,
                s.voyage_number,
                s.shipping_line,
                s.origin_country,
                s.origin_port,
                s.destination_port,
                s.expected_arrival,
                s.consignee,
                s.consignee_email,
                s.consignee_phone,
                s.cargo_description,
                s.cargo_category,
                s.package_type,
                s.package_count,
                s.gross_weight AS shipment_gross_weight,
                s.status AS shipment_status,

                c.container_no,
                c.size AS container_size,
                c.seal_no,
                c.gross_weight AS container_gross_weight,
                c.cargo_description AS container_cargo_description,
                c.status AS container_status,
                c.current_location_id,

                l.code AS location_code,
                l.name AS location_name,
                l.description AS location_description,
                l.kind AS location_kind,

                officer.full_name AS officer_name,
                officer.email AS officer_email,
                officer.phone AS officer_phone,

                reviewer.full_name AS reviewer_name,
                reviewer.email AS reviewer_email,

                creator.full_name AS creator_name

            FROM terminal_examinations e

            INNER JOIN portal_shipments s
                ON s.id = e.shipment_id

            INNER JOIN portal_shipment_containers c
                ON c.id = e.container_id
                AND c.shipment_id = e.shipment_id

            LEFT JOIN terminal_locations l
                ON l.id = e.location_id

            LEFT JOIN users officer
                ON officer.id = e.officer_id

            LEFT JOIN users reviewer
                ON reviewer.id = e.reviewed_by

            LEFT JOIN users creator
                ON creator.id = e.created_by

            WHERE e.id = :id
            LIMIT 1
        ");

        $stmt->execute([
            ":id" => $id
        ]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            http_response_code(404);
            echo json_encode([
                "error" => true,
                "data" => "Examination not found.",
                "code" => null
            ]);
            exit;
        }

        $logStmt = $conn->prepare("
            SELECT
                log.id,
                log.action,
                log.previous_status,
                log.new_status,
                log.description,
                log.metadata,
                log.performed_at,
                log.performed_by,
                u.full_name AS performed_by_name
            FROM terminal_examination_logs log
            LEFT JOIN users u
                ON u.id = log.performed_by
            WHERE log.examination_id = :examination_id
            ORDER BY log.performed_at ASC
        ");

        $logStmt->execute([
            ":examination_id" => $id
        ]);

        $logs = $logStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($logs as &$log) {
            if (!empty($log["metadata"])) {
                $metadata = json_decode($log["metadata"], true);
                $log["metadata"] = json_last_error() === JSON_ERROR_NONE
                    ? $metadata
                    : $log["metadata"];
            } else {
                $log["metadata"] = null;
            }
        }

        unset($log);

        $examination = [
            "id" => $row["id"],
            "reference" => $row["reference"],
            "examination_type" => $row["examination_type"],
            "status" => $row["status"],
            "priority" => $row["priority"],
            "scheduled_date" => $row["scheduled_date"],
            "scheduled_time" => $row["scheduled_time"],
            "instructions" => $row["instructions"],
            "findings" => $row["findings"],
            "remarks" => $row["remarks"],
            "completed_at" => $row["completed_at"],
            "reviewed_at" => $row["reviewed_at"],
            "created_at" => $row["created_at"],
            "updated_at" => $row["updated_at"],

            "shipment" => [
                "id" => $row["shipment_id"],
                "shipment_reference" => $row["shipment_reference"],
                "bill_of_lading" => $row["bill_of_lading"],
                "booking_number" => $row["booking_number"],
                "vessel_name" => $row["vessel_name"],
                "voyage_number" => $row["voyage_number"],
                "shipping_line" => $row["shipping_line"],
                "origin_country" => $row["origin_country"],
                "origin_port" => $row["origin_port"],
                "destination_port" => $row["destination_port"],
                "expected_arrival" => $row["expected_arrival"],
                "consignee" => $row["consignee"],
                "consignee_email" => $row["consignee_email"],
                "consignee_phone" => $row["consignee_phone"],
                "cargo_description" => $row["cargo_description"],
                "cargo_category" => $row["cargo_category"],
                "package_type" => $row["package_type"],
                "package_count" => $row["package_count"],
                "gross_weight" => $row["shipment_gross_weight"],
                "status" => $row["shipment_status"]
            ],

            "container" => [
                "id" => $row["container_id"],
                "container_no" => $row["container_no"],
                "size" => $row["container_size"],
                "seal_no" => $row["seal_no"],
                "gross_weight" => $row["container_gross_weight"],
                "cargo_description" => $row["container_cargo_description"],
                "status" => $row["container_status"],
                "current_location_id" => $row["current_location_id"]
            ],

            "location" => [
                "id" => $row["location_id"],
                "code" => $row["location_code"],
                "name" => $row["location_name"],
                "description" => $row["location_description"],
                "kind" => $row["location_kind"]
            ],

            "officer" => [
                "id" => $row["officer_id"],
                "name" => $row["officer_name"],
                "email" => $row["officer_email"],
                "phone" => $row["officer_phone"]
            ],

            "reviewer" => [
                "id" => $row["reviewed_by"],
                "name" => $row["reviewer_name"],
                "email" => $row["reviewer_email"]
            ],

            "created_by" => [
                "id" => $row["created_by"],
                "name" => $row["creator_name"]
            ]
        ];

        echo json_encode([
            "error" => false,
            "data" => "Examination details loaded successfully.",
            "code" => [
                "examination" => $examination,
                "checklist" => [],
                "findings" => [],
                "report" => [
                    "findings" => $row["findings"],
                    "remarks" => $row["remarks"],
                    "completed_at" => $row["completed_at"]
                ],
                "logs" => $logs
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "error" => true,
            "data" => "Could not load examination details.",
            "code" => null
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            "error" => true,
            "data" => "An unexpected error occurred.",
            "code" => null
        ]);
    }