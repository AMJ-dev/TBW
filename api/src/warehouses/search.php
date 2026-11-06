<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $search = trim($_POST["q"] ?? $_POST["search"] ?? "");
        $where = trim($_POST["where"] ?? "bill_of_lading");

        if ($search === "") {
            echo json_encode([
                "error" => true,
                "data" => "Enter a search value.",
                "code" => 422
            ]);
            exit;
        }

        $allowedSearchFields = [
            "bill_of_lading",
            "shipment_reference",
            "container_number",
            "seal_number"
        ];

        if (!in_array($where, $allowedSearchFields, true)) {
            echo json_encode([
                "error" => true,
                "data" => "Invalid search type.",
                "code" => 422
            ]);
            exit;
        }

        $searchValue = "%" . $search . "%";

        $searchConditions = [
            "bill_of_lading" => "ps.bill_of_lading LIKE :search",
            "shipment_reference" => "ps.shipment_reference LIKE :search",
            "container_number" => "EXISTS (
                SELECT 1
                FROM portal_shipment_containers matched
                WHERE matched.shipment_id = ps.id
                    AND matched.container_no LIKE :search
            )",
            "seal_number" => "EXISTS (
                SELECT 1
                FROM portal_shipment_containers matched
                LEFT JOIN portal_receiving_containers matched_receiving
                    ON matched_receiving.container_id = matched.id
                WHERE matched.shipment_id = ps.id
                    AND (
                        matched.seal_no LIKE :search
                        OR matched_receiving.actual_seal_no LIKE :actual_seal
                    )
            )"
        ];

        $searchCondition = $searchConditions[$where];

        $sql = "
            SELECT
                ps.id AS shipment_id,
                ps.shipment_reference,
                ps.shipment_type,
                ps.bill_of_lading,
                ps.booking_number,
                ps.vessel_name,
                ps.voyage_number,
                ps.shipping_line,
                ps.origin_country,
                ps.origin_port,
                ps.destination_port,
                ps.expected_arrival,
                ps.consignee,
                ps.consignee_email,
                ps.consignee_phone,
                ps.consignee_type,
                ps.consignee_status,
                ps.consignee_contact_person,
                ps.consignee_address,
                ps.consignee_country,
                ps.licensed_agent_id,
                ps.licensed_agent_name,
                ps.cargo_description AS shipment_cargo_description,
                ps.cargo_category,
                ps.package_type,
                ps.package_count,
                ps.gross_weight AS shipment_gross_weight,
                ps.volume,
                ps.dangerous_goods,
                ps.temperature_controlled,
                ps.temperature,
                ps.special_instructions,
                ps.customs_reference,
                ps.status AS shipment_status,
                ps.created_at AS shipment_created_at,

                psc.id AS container_id,
                psc.container_no,
                psc.size AS container_size,
                psc.seal_no,
                psc.package_count AS container_package_count,
                psc.gross_weight AS container_gross_weight,
                psc.cargo_description,
                psc.package_type AS container_package_type,
                psc.status AS container_status,
                psc.current_location_id,

                receiving.receiving_id,
                receiving.receiving_reference,
                receiving.receiving_status,
                receiving.receiving_record_status,
                receiving.receiving_location_id,
                receiving.receiving_location,
                receiving.actual_seal_no,
                receiving.actual_weight,
                receiving.condition_status,
                receiving.received_at,

                receiving_location.code AS receiving_location_code,
                receiving_location.name AS receiving_location_name,

                current_location.code AS current_location_code,
                current_location.name AS current_location_name,
                current_location.kind AS current_location_kind,
                current_location.status AS current_location_status,

                latest_movement.id AS last_movement_id,
                latest_movement.movement_reference AS last_movement_reference,
                latest_movement.to_location_id AS last_yard_location_id,
                latest_movement.completed_at AS last_movement_at,

                CASE
                    WHEN receiving.receiving_status = 'RECEIVED'
                        AND psc.status IN (
                            'RECEIVED',
                            'IN_YARD',
                            'IN_WAREHOUSE',
                            'UNDER_EXAMINATION',
                            'EXAMINATION_SCHEDULED',
                            'EXAMINATION_COMPLETE',
                            'CHARGES_PENDING',
                            'CHARGES_SETTLED',
                            'RELEASE_AUTHORISED'
                        )
                    THEN 1
                    ELSE 0
                END AS can_move

            FROM portal_shipments ps

            INNER JOIN portal_shipment_containers psc
                ON psc.shipment_id = ps.id

            LEFT JOIN (
                SELECT
                    rc.container_id,
                    rc.receiving_id,
                    rc.receiving_status,
                    rc.receiving_location_id,
                    rc.receiving_location,
                    rc.actual_seal_no,
                    rc.actual_weight,
                    rc.condition_status,
                    rc.received_at,
                    pr.receiving_reference,
                    pr.status AS receiving_record_status,
                    ROW_NUMBER() OVER (
                        PARTITION BY rc.container_id
                        ORDER BY
                            COALESCE(
                                rc.received_at,
                                rc.updated_at,
                                rc.created_at
                            ) DESC,
                            rc.created_at DESC
                    ) AS row_num
                FROM portal_receiving_containers rc
                INNER JOIN portal_receiving pr
                    ON pr.id = rc.receiving_id
            ) receiving
                ON receiving.container_id = psc.id
                AND receiving.row_num = 1

            LEFT JOIN terminal_locations receiving_location
                ON receiving_location.id = receiving.receiving_location_id

            LEFT JOIN terminal_locations current_location
                ON current_location.id = psc.current_location_id

            LEFT JOIN (
                SELECT
                    ym.id,
                    ym.container_id,
                    ym.movement_reference,
                    ym.to_location_id,
                    ym.completed_at
                FROM (
                    SELECT
                        ym1.id,
                        ym1.container_id,
                        ym1.movement_reference,
                        ym1.to_location_id,
                        ym1.completed_at,
                        ROW_NUMBER() OVER (
                            PARTITION BY ym1.container_id
                            ORDER BY
                                ym1.completed_at DESC,
                                ym1.created_at DESC
                        ) AS row_num
                    FROM terminal_yard_movements ym1
                    WHERE ym1.completed_at IS NOT NULL
                ) ym
                WHERE ym.row_num = 1
            ) latest_movement
                ON latest_movement.container_id = psc.id

            WHERE {$searchCondition}

            ORDER BY
                ps.created_at DESC,
                psc.container_no ASC

            LIMIT 100
        ";

        $stmt = $conn->prepare($sql);
        $stmt->bindValue(":search", $searchValue, PDO::PARAM_STR);

        if ($where === "seal_number") {
            $stmt->bindValue(":actual_seal", $searchValue, PDO::PARAM_STR);
        }

        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $shipmentFields = [
            "shipment_id",
            "shipment_reference",
            "shipment_type",
            "bill_of_lading",
            "booking_number",
            "vessel_name",
            "voyage_number",
            "shipping_line",
            "origin_country",
            "origin_port",
            "destination_port",
            "expected_arrival",
            "consignee",
            "consignee_email",
            "consignee_phone",
            "consignee_type",
            "consignee_status",
            "consignee_contact_person",
            "consignee_address",
            "consignee_country",
            "licensed_agent_id",
            "licensed_agent_name",
            "shipment_cargo_description",
            "cargo_category",
            "package_type",
            "package_count",
            "shipment_gross_weight",
            "volume",
            "dangerous_goods",
            "temperature_controlled",
            "temperature",
            "special_instructions",
            "customs_reference",
            "shipment_status",
            "shipment_created_at"
        ];

        $shipment = null;
        $containers = [];

        if (!empty($rows)) {
            $shipment = array_intersect_key(
                $rows[0],
                array_flip($shipmentFields)
            );

            foreach ($rows as $row) {
                $container = array_diff_key(
                    $row,
                    array_flip($shipmentFields)
                );

                $container["can_move"] = (bool) $container["can_move"];

                if ($container["current_location_kind"] === "WAREHOUSE") {
                    $container["warehouse_status"] = "IN_WAREHOUSE";
                    $container["warehouse_status_label"] = "Already in warehouse";
                } elseif ($container["can_move"]) {
                    $container["warehouse_status"] = "READY";
                    $container["warehouse_status_label"] = "Ready for warehouse placement";
                } elseif (
                    $container["receiving_status"] !== "RECEIVED"
                ) {
                    $container["warehouse_status"] = "NOT_RECEIVED";
                    $container["warehouse_status_label"] = "Not yet received";
                } elseif ($container["current_location_kind"] !== "YARD") {
                    $container["warehouse_status"] = "NOT_IN_YARD";
                    $container["warehouse_status_label"] = "Not currently in yard";
                } else {
                    $container["warehouse_status"] = "UNAVAILABLE";
                    $container["warehouse_status_label"] = "Not eligible for warehouse placement";
                }

                $containers[] = $container;
            }
        }

        echo json_encode([
            "error" => false,
            "data" => [
                "shipment" => $shipment,
                "containers" => $containers
            ],
            "code" => 200
        ]);

    } catch (Throwable $e) {
        echo json_encode([
            "error" => true,
            "data" => "Could not search shipment containers.",
            "code" => 500
        ]);
    }