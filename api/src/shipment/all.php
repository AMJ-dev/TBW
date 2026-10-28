<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    header("Content-Type: application/json; charset=utf-8");

    if ($_SERVER["REQUEST_METHOD"] !== "GET") {
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed",
            "code" => null
        ]);
        exit;
    }

    try {
        $userId = (string) ($my_details->id ?? "");

        if ($userId === "") {
            echo json_encode([
                "error" => true,
                "data" => "Authentication required.",
                "code" => null
            ]);
            exit;
        }

        $status = trim((string) ($_GET["status"] ?? ""));
        $organisationId = trim((string) ($_GET["organisation_id"] ?? ""));
        $search = trim((string) ($_GET["q"] ?? ""));
        $page = max(1, (int) ($_GET["page"] ?? 1));
        $pageSize = (int) ($_GET["page_size"] ?? 25);

        if ($pageSize < 1) {
            $pageSize = 25;
        }

        if ($pageSize > 100) {
            $pageSize = 100;
        }

        $offset = ($page - 1) * $pageSize;

        $where = [];
        $params = [];

        if ($status !== "") {
            $where[] = "ps.status = :status";
            $params[":status"] = $status;
        }

        if ($organisationId !== "") {
            $where[] = "ps.organisation_id = :organisation_id";
            $params[":organisation_id"] = $organisationId;
        }

        if ($search !== "") {
            $where[] = "(
                ps.id LIKE :search_id
                OR ps.bill_of_lading LIKE :search_bol
                OR ps.booking_number LIKE :search_booking
                OR ps.cargo_description LIKE :search_description
                OR ps.cargo_category LIKE :search_category
                OR o.organisation_name LIKE :search_org
            )";

            $searchValue = "%" . $search . "%";

            $params[":search_id"] = $searchValue;
            $params[":search_bol"] = $searchValue;
            $params[":search_booking"] = $searchValue;
            $params[":search_description"] = $searchValue;
            $params[":search_category"] = $searchValue;
            $params[":search_org"] = $searchValue;
        }

        $whereSql = $where ? "WHERE " . implode(" AND ", $where) : "";

        $countSql = "
            SELECT COUNT(*)
            FROM portal_shipments ps
            LEFT JOIN organisations o ON o.id = ps.organisation_id
            $whereSql
        ";

        $countStmt = $conn->prepare($countSql);

        foreach ($params as $key => $value) {
            $countStmt->bindValue($key, $value);
        }

        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        $listSql = "
            SELECT
                ps.id,
                ps.shipment_reference,
                ps.user_id,
                ps.organisation_id,
                o.organisation_name AS organisation_name,
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
                ps.cargo_description,
                ps.cargo_category,
                ps.package_type,
                ps.package_count,
                ps.gross_weight,
                ps.volume,
                ps.dangerous_goods,
                ps.temperature_controlled,
                ps.temperature,
                ps.special_instructions,
                ps.customs_reference,
                ps.status,
                ps.created_at,
                ps.updated_at
            FROM portal_shipments ps
            LEFT JOIN organisations o ON o.id = ps.organisation_id
            $whereSql
            ORDER BY ps.created_at DESC
            LIMIT :limit OFFSET :offset
        ";

        $listStmt = $conn->prepare($listSql);

        foreach ($params as $key => $value) {
            $listStmt->bindValue($key, $value);
        }

        $listStmt->bindValue(":limit", $pageSize, PDO::PARAM_INT);
        $listStmt->bindValue(":offset", $offset, PDO::PARAM_INT);
        $listStmt->execute();

        $shipments = $listStmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$shipments) {
            echo json_encode([
                "error" => false,
                "data" => "Shipments loaded.",
                "code" => [
                    "shipments" => [],
                    "pagination" => [
                        "page" => $page,
                        "page_size" => $pageSize,
                        "total" => $total,
                        "total_pages" => $total > 0
                            ? (int) ceil($total / $pageSize)
                            : 1
                    ]
                ]
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        }

        $shipmentIds = array_map(
            static fn(array $row): string => (string) $row["id"],
            $shipments
        );

        $placeholders = implode(
            ",",
            array_fill(0, count($shipmentIds), "?")
        );

        $containerStmt = $conn->prepare("
            SELECT *
            FROM portal_shipment_containers
            WHERE shipment_id IN ($placeholders)
            ORDER BY created_at ASC
        ");

        $containerStmt->execute($shipmentIds);
        $containerRows = $containerStmt->fetchAll(PDO::FETCH_ASSOC);

        $containersByShipment = [];

        foreach ($containerRows as $row) {
            $sid = (string) $row["shipment_id"];

            if (!isset($containersByShipment[$sid])) {
                $containersByShipment[$sid] = [];
            }

            $containersByShipment[$sid][] = [
                "id" => (string) $row["id"],
                "shipment_id" => (string) $row["shipment_id"],
                "container_no" => $row["container_no"] ?? null,
                "size" => $row["size"] ?? null,
                "seal_no" => $row["seal_no"] ?? null,
                "package_count" => isset($row["package_count"])
                    ? (float) $row["package_count"]
                    : null,
                "gross_weight" => isset($row["gross_weight"])
                    ? (float) $row["gross_weight"]
                    : null,
                "status" => $row["status"] ?? null,
                "gate_in_at" => $row["gate_in_at"] ?? null,
                "received_at" => $row["received_at"] ?? null,
                "stored_at" => $row["stored_at"] ?? null,
                "gate_out_at" => $row["gate_out_at"] ?? null,
                "cargo_description" => $row["cargo_description"] ?? null,
                "package_type" => $row["package_type"] ?? null,
                "hs_code" => $row["hs_code"] ?? null,
                "customs_tariff_id" => $row["customs_tariff_id"] ?? null,
                "item_quantity" => isset($row["item_quantity"])
                    ? (float) $row["item_quantity"]
                    : null,
                "unit_of_measure" => $row["unit_of_measure"] ?? null,
                "unit_value" => isset($row["unit_value"])
                    ? (float) $row["unit_value"]
                    : null,
                "currency" => $row["currency"] ?? null,
                "total_value" => isset($row["total_value"])
                    ? (float) $row["total_value"]
                    : null,
                "created_at" => $row["created_at"] ?? null,
                "updated_at" => $row["updated_at"] ?? null
            ];
        }

        $documentStmt = $conn->prepare("
            SELECT
                id,
                shipment_id,
                document_type,
                original_name,
                file_path,
                mime_type,
                file_size,
                uploaded_at
            FROM portal_shipment_documents
            WHERE shipment_id IN ($placeholders)
            ORDER BY uploaded_at ASC
        ");

        $documentStmt->execute($shipmentIds);
        $documentRows = $documentStmt->fetchAll(PDO::FETCH_ASSOC);

        $documentsByShipment = [];

        foreach ($documentRows as $row) {
            $sid = (string) $row["shipment_id"];

            if (!isset($documentsByShipment[$sid])) {
                $documentsByShipment[$sid] = [];
            }

            $documentsByShipment[$sid][] = [
                "id" => (string) $row["id"],
                "document_type" => (string) $row["document_type"],
                "original_name" => (string) $row["original_name"],
                "file_path" => $row["file_path"],
                "mime_type" => $row["mime_type"],
                "file_size" => (int) $row["file_size"],
                "uploaded_at" => (string) $row["uploaded_at"]
            ];
        }

        $result = [];

        foreach ($shipments as $row) {
            $sid = (string) $row["id"];

            $result[] = [
                "id" => $sid,
                "shipment_reference" => $row["shipment_reference"],
                "user_id" => (string) $row["user_id"],
                "organisation_id" => $row["organisation_id"],
                "organisation_name" => $row["organisation_name"],
                "shipment_type" => (string) $row["shipment_type"],
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
                "cargo_category" => (string) $row["cargo_category"],
                "package_type" => (string) $row["package_type"],
                "package_count" => $row["package_count"] !== null
                    ? (float) $row["package_count"]
                    : null,
                "gross_weight" => $row["gross_weight"] !== null
                    ? (float) $row["gross_weight"]
                    : null,
                "volume" => $row["volume"] !== null
                    ? (float) $row["volume"]
                    : null,
                "dangerous_goods" => (string) $row["dangerous_goods"],
                "temperature_controlled" => (string) $row["temperature_controlled"],
                "temperature" => $row["temperature"],
                "special_instructions" => $row["special_instructions"],
                "customs_reference" => $row["customs_reference"],
                "status" => (string) $row["status"],
                "created_at" => (string) $row["created_at"],
                "updated_at" => (string) $row["updated_at"],
                "containers" => $containersByShipment[$sid] ?? [],
                "documents" => $documentsByShipment[$sid] ?? []
            ];
        }

        echo json_encode([
            "error" => false,
            "data" => "Shipments loaded.",
            "code" => [
                "shipments" => $result,
                "pagination" => [
                    "page" => $page,
                    "page_size" => $pageSize,
                    "total" => $total,
                    "total_pages" => $total > 0
                        ? (int) ceil($total / $pageSize)
                        : 1
                ]
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    } catch (Throwable $e) {
        error_log("Could not load shipments: " . $e->getMessage());

        echo json_encode([
            "error" => true,
            "data" => "Could not load shipments.",
            "code" => null
        ]);
    }