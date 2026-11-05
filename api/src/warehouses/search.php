<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $q = trim($_POST["q"] ?? "");
        $where = trim($_POST["where"] ?? "all");

        if ($q === "") {
            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "Enter a container number, Bill of Lading, seal number, or shipment reference.",
                "code" => null
            ]);
            exit;
        }

        $allowed = [
            "all",
            "bill_of_lading",
            "shipment_reference",
            "container_number",
            "seal_number"
        ];

        if (!in_array($where, $allowed, true)) {
            $where = "all";
        }

        $conditions = [];
        $params = [];

        $search = "%" . $q . "%";

        if ($where === "bill_of_lading") {
            $conditions[] = "ps.bill_of_lading LIKE :bol";
            $params[":bol"] = $search;
        } elseif ($where === "shipment_reference") {
            $conditions[] = "ps.shipment_reference LIKE :shipment_reference";
            $params[":shipment_reference"] = $search;
        } elseif ($where === "container_number") {
            $conditions[] = "pc.container_no LIKE :container_no";
            $params[":container_no"] = $search;
        } elseif ($where === "seal_number") {
            $conditions[] = "pc.seal_no LIKE :seal_no";
            $params[":seal_no"] = $search;
        } else {
            $conditions[] = "(
                ps.bill_of_lading LIKE :bol
                OR ps.shipment_reference LIKE :shipment_reference
                OR pc.container_no LIKE :container_no
                OR pc.seal_no LIKE :seal_no
            )";

            $params[":bol"] = $search;
            $params[":shipment_reference"] = $search;
            $params[":container_no"] = $search;
            $params[":seal_no"] = $search;
        }

        $sql = "
            SELECT
                ps.id AS shipment_id,
                ps.shipment_reference,
                ps.bill_of_lading,
                ps.status AS shipment_status,
                ps.vessel_name,
                ps.voyage_number,
                ps.shipping_line,
                ps.consignee,
                ps.cargo_description AS shipment_cargo_description,
                ps.package_count AS shipment_package_count,
                ps.volume AS shipment_volume,
                pc.id AS container_id,
                pc.container_no,
                pc.size AS container_size,
                pc.seal_no,
                pc.package_count,
                pc.gross_weight,
                pc.cargo_description,
                pc.package_type,
                pc.status AS container_status,
                pc.current_location_id,
                tl.code AS current_location_code,
                tl.name AS current_location_name,
                tl.kind AS current_location_kind,
                tl.status AS current_location_status,
                CASE
                    WHEN pc.current_location_id IS NOT NULL
                        AND tl.kind = 'YARD'
                        AND tl.status = 'active'
                        AND pc.status = 'IN_YARD'
                    THEN 1
                    ELSE 0
                END AS can_move
            FROM portal_shipments ps
            INNER JOIN portal_shipment_containers pc
                ON pc.shipment_id = ps.id
            LEFT JOIN terminal_locations tl
                ON tl.id = pc.current_location_id
            WHERE " . implode(" AND ", $conditions) . "
            ORDER BY ps.created_at DESC, pc.container_no ASC
        ";

        $stmt = $conn->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }

        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$rows) {
            echo json_encode([
                "error" => false,
                "data" => [
                    "shipment" => null,
                    "containers" => []
                ],
                "code" => null
            ]);
            exit;
        }

        $shipment = [
            "shipment_id" => $rows[0]["shipment_id"],
            "shipment_reference" => $rows[0]["shipment_reference"],
            "bill_of_lading" => $rows[0]["bill_of_lading"],
            "shipment_status" => $rows[0]["shipment_status"],
            "vessel_name" => $rows[0]["vessel_name"],
            "voyage_number" => $rows[0]["voyage_number"],
            "shipping_line" => $rows[0]["shipping_line"],
            "consignee" => $rows[0]["consignee"],
            "cargo_description" => $rows[0]["shipment_cargo_description"],
            "package_count" => $rows[0]["shipment_package_count"],
            "volume" => $rows[0]["shipment_volume"]
        ];

        $containers = array_map(function ($row) {
            return [
                "container_id" => $row["container_id"],
                "container_no" => $row["container_no"],
                "container_size" => $row["container_size"],
                "seal_no" => $row["seal_no"],
                "package_count" => $row["package_count"],
                "gross_weight" => $row["gross_weight"],
                "cargo_description" => $row["cargo_description"],
                "package_type" => $row["package_type"],
                "container_status" => $row["container_status"],
                "current_location_id" => $row["current_location_id"],
                "current_location_code" => $row["current_location_code"],
                "current_location_name" => $row["current_location_name"],
                "current_location_kind" => $row["current_location_kind"],
                "can_move" => (bool) $row["can_move"]
            ];
        }, $rows);

        echo json_encode([
            "error" => false,
            "data" => [
                "shipment" => $shipment,
                "containers" => $containers
            ],
            "code" => null
        ]);

    } catch (Throwable $e) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not search shipment containers.",
            "code" => null
        ]);
    }