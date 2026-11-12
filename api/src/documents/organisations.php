<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $organisation_id = $my_details->organisation_id ?? null;

        if (!$organisation_id) {
            echo json_encode([
                "error" => true,
                "data" => "Organisation not found.",
                "code" => null
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT
                s.id,
                s.shipment_reference,
                s.bill_of_lading,
                s.cargo_description,
                s.consignee,
                s.expected_arrival,
                s.status,
                s.document_status,
                (
                    SELECT COUNT(*)
                    FROM portal_shipment_containers c
                    WHERE BINARY c.shipment_id = BINARY s.id
                ) AS container_count,
                (
                    SELECT COUNT(*)
                    FROM portal_shipment_documents d
                    WHERE BINARY d.shipment_id = BINARY s.id
                ) AS document_count
            FROM portal_shipments s
            WHERE BINARY s.organisation_id = BINARY :organisation_id
            ORDER BY s.created_at DESC
        ");

        $stmt->execute([
            ":organisation_id" => $organisation_id
        ]);

        $shipments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$shipments) {
            echo json_encode([
                "error" => false,
                "data" => "Documents loaded successfully.",
                "code" => []
            ]);
            exit;
        }

        $shipment_ids = array_column($shipments, "id");
        $placeholders = implode(",", array_fill(0, count($shipment_ids), "?"));

        $document_stmt = $conn->prepare("
            SELECT
                id,
                shipment_id,
                document_type,
                original_name,
                file_path,
                uploaded_at,
                status
            FROM portal_shipment_documents
            WHERE shipment_id IN ($placeholders)
            ORDER BY uploaded_at DESC
        ");

        $document_stmt->execute($shipment_ids);

        $documents = $document_stmt->fetchAll(PDO::FETCH_ASSOC);

        $documents_by_shipment = [];

        foreach ($documents as $document) {
            $documents_by_shipment[$document["shipment_id"]][] = [
                "id" => $document["id"],
                "document_type" => $document["document_type"],
                "original_name" => $document["original_name"],
                "file_path" => $document["file_path"],
                "uploaded_at" => $document["uploaded_at"],
                "status" => $document["status"]
            ];
        }

        foreach ($shipments as &$shipment) {
            $shipment["container_count"] = (int) $shipment["container_count"];
            $shipment["document_count"] = (int) $shipment["document_count"];

            $shipment["documents"] =
                $documents_by_shipment[$shipment["id"]] ?? [];
        }

        unset($shipment);

        echo json_encode([
            "error" => false,
            "data" => "Documents loaded successfully.",
            "code" => $shipments
        ]);

    } catch (Throwable $e) {
        error_log("Portal Documents API Error: " . $e->getMessage());

        echo json_encode([
            "error" => true,
            "data" => "Could not load shipment documents.",
            "code" => null
        ]);
    }
