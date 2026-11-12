<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        if ($_SERVER["REQUEST_METHOD"] !== "POST") {
            http_response_code(405);
            echo json_encode([
                "error" => true,
                "data" => "Method not allowed.",
                "code" => null
            ]);
            exit;
        }

        if (($my_details->account_type ?? null) !== "system") {
            http_response_code(403);
            echo json_encode([
                "error" => true,
                "data" => "You are not authorised to access shipments.",
                "code" => null
            ]);
            exit;
        }

        $page = max(1, (int)($_POST["page"] ?? 1));
        $search = trim($_POST["q"] ?? "");

        $page_size = 20;
        $offset = ($page - 1) * $page_size;

        $where_sql = "";
        $params = [];

        if ($search !== "") {
            $where_sql = "WHERE (
                s.shipment_reference LIKE :search
                OR s.bill_of_lading LIKE :search
                OR s.booking_number LIKE :search
                OR s.vessel_name LIKE :search
                OR s.consignee LIKE :search
                OR o.organisation_name LIKE :search
            )";

            $params["search"] = "%{$search}%";
        }

        $count_stmt = $conn->prepare("
            SELECT COUNT(*)
            FROM portal_shipments s
            LEFT JOIN organisations o ON o.id = s.organisation_id
            $where_sql
        ");

        $count_stmt->execute($params);
        $total = (int)$count_stmt->fetchColumn();

        $shipment_stmt = $conn->prepare("
            SELECT
                s.id,
                s.shipment_reference,
                s.bill_of_lading,
                s.consignee,
                s.cargo_description,
                s.status,
                s.document_status,
                s.created_at,
                s.updated_at,
                o.organisation_name,
                (
                    SELECT COUNT(*)
                    FROM portal_shipment_containers c
                    WHERE c.shipment_id = s.id
                ) AS container_count
            FROM portal_shipments s
            LEFT JOIN organisations o ON o.id = s.organisation_id
            $where_sql
            ORDER BY s.created_at DESC, s.id DESC
            LIMIT :limit OFFSET :offset
        ");

        foreach ($params as $key => $value) {
            $shipment_stmt->bindValue(":{$key}", $value);
        }

        $shipment_stmt->bindValue(":limit", $page_size, PDO::PARAM_INT);
        $shipment_stmt->bindValue(":offset", $offset, PDO::PARAM_INT);
        $shipment_stmt->execute();

        $shipments = $shipment_stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($shipments)) {
            $shipment_ids = array_column($shipments, "id");
            $placeholders = implode(",", array_fill(0, count($shipment_ids), "?"));

            $container_stmt = $conn->prepare("
                SELECT
                    id,
                    shipment_id,
                    container_no,
                    size
                FROM portal_shipment_containers
                WHERE shipment_id IN ($placeholders)
                ORDER BY created_at DESC, id DESC
            ");

            $container_stmt->execute($shipment_ids);
            $containers = $container_stmt->fetchAll(PDO::FETCH_ASSOC);

            $containers_by_shipment = [];

            foreach ($containers as $container) {
                $containers_by_shipment[$container["shipment_id"]][] = $container;
            }

            $document_stmt = $conn->prepare("
                SELECT
                    id,
                    shipment_id,
                    reference_code,
                    document_type,
                    original_name,
                    file_size,
                    status,
                    uploaded_at
                FROM portal_shipment_documents
                WHERE shipment_id IN ($placeholders)
                ORDER BY uploaded_at DESC, id DESC
            ");

            $document_stmt->execute($shipment_ids);
            $documents = $document_stmt->fetchAll(PDO::FETCH_ASSOC);

            $documents_by_shipment = [];

            foreach ($documents as $document) {
                $documents_by_shipment[$document["shipment_id"]][] = $document;
            }

            foreach ($shipments as &$shipment) {
                $shipment["container_count"] = (int)$shipment["container_count"];
                $shipment["containers"] = $containers_by_shipment[$shipment["id"]] ?? [];
                $shipment["documents"] = $documents_by_shipment[$shipment["id"]] ?? [];
            }

            unset($shipment);
        }

        echo json_encode([
            "error" => false,
            "data" => "Shipments loaded successfully.",
            "code" => $shipments,
            "pagination" => [
                "total" => $total,
                "page" => $page,
                "page_size" => $page_size,
                "total_pages" => (int)ceil($total / $page_size)
            ]
        ]);

    } catch (\Throwable $th) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not load shipments.",
            "code" => null
        ]);
    }
