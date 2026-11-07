<?php

    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $where = trim($_POST["where"] ?? "");
        $search = trim($_POST["q"] ?? "");

        $allowed_fields = [
            "container_no" => "c.container_no",
            "seal_no" => "c.seal_no",
            "shipment_reference" => "s.shipment_reference",
            "bill_of_lading" => "s.bill_of_lading"
        ];

        if (!isset($allowed_fields[$where])) {
            http_response_code(422);

            echo json_encode([
                "error" => true,
                "data" => "Invalid search type. Select container number, seal number, shipment reference or bill of lading.",
                "code" => 422
            ]);
            exit;
        }

        if ($search === "") {
            http_response_code(422);

            echo json_encode([
                "error" => true,
                "data" => "Enter a search value.",
                "code" => 422
            ]);
            exit;
        }

        if (strlen($search) > 150) {
            http_response_code(422);

            echo json_encode([
                "error" => true,
                "data" => "Search value is too long.",
                "code" => 422
            ]);
            exit;
        }

        $column = $allowed_fields[$where];

        $stmt = $conn->prepare("
            SELECT
                c.id,
                c.container_no,
                c.size,
                c.seal_no,
                c.status,
                s.id AS shipment_id,
                s.shipment_reference,
                s.bill_of_lading,
                s.vessel_name,
                s.voyage_number,
                s.shipping_line,
                s.consignee,
                s.cargo_description,
                s.gross_weight
            FROM portal_shipment_containers c
            INNER JOIN portal_shipments s
                ON s.id = c.shipment_id
            WHERE $column LIKE :search
            ORDER BY s.shipment_reference ASC
            LIMIT 30
        ");

        $stmt->execute([
            ":search" => "%" . $search . "%"
        ]);

        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => $records,
            "code" => 200
        ]);
    } catch (Throwable $e) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not search shipment containers.",
            "code" => 500
        ]);
    }