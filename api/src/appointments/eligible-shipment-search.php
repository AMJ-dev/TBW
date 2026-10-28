<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    header("Content-Type: application/json; charset=utf-8");

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed.",
            "code" => null
        ]);
        exit;
    }

    $q = strtoupper(trim((string)($_POST["q"] ?? "")));

    if (mb_strlen($q) < 2) {
        echo json_encode([
            "error" => false,
            "data" => "Enter at least two characters to search.",
            "code" => [
                "shipments" => []
            ]
        ]);
        exit;
    }

    try {
        $shipment_stmt = $conn->prepare("
            SELECT
                s.id,
                s.shipment_reference,
                s.bill_of_lading,
                s.status,
                m.id AS manifest_id,
                m.manifest_ref,
                m.status AS manifest_status
            FROM portal_shipments s
            INNER JOIN operation_manifests m
                ON m.matched_shipment_id = s.id
                AND m.bill_of_lading = s.bill_of_lading
            WHERE m.status = 'Validated'
                AND s.status = 'EXPECTED'
                AND UPPER(s.bill_of_lading) LIKE :q
            GROUP BY
                s.id,
                s.shipment_reference,
                s.bill_of_lading,
                s.status,
                m.id,
                m.manifest_ref,
                m.status
            ORDER BY s.bill_of_lading ASC
            LIMIT 20
        ");

        $shipment_stmt->execute([
            ":q" => "%" . $q . "%"
        ]);

        $shipments = $shipment_stmt->fetchAll(PDO::FETCH_ASSOC);

        $container_stmt = $conn->prepare("
            SELECT *
            FROM portal_shipment_containers
            WHERE shipment_id = :shipment_id
            ORDER BY container_no ASC
        ");

        $results = [];

        foreach ($shipments as $shipment) {
            $container_stmt->execute([
                ":shipment_id" => $shipment["id"]
            ]);

            $containers = $container_stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($containers)) {
                continue;
            }

            $shipment["containers"] = $containers;
            $shipment["container_count"] = count($containers);

            $results[] = $shipment;
        }

        echo json_encode([
            "error" => false,
            "data" => "Eligible shipments loaded successfully.",
            "code" => [
                "shipments" => $results
            ]
        ]);
    } catch (Throwable $e) {
        error_log("Eligible Shipment Search Error: " . $e->getMessage());

        echo json_encode([
            "error" => true,
            "data" => "Could not search eligible shipments.",
            "code" => null
        ]);
    }
    ?>