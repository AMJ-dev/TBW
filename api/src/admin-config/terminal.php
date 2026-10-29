<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        if ($_SERVER["REQUEST_METHOD"] !== "GET") {
            echo json_encode([
                "error" => true,
                "data" => "Method not allowed",
                "code" => null
            ]);
            exit;
        }

        $q = $conn->prepare("
            SELECT terminal_name, terminal_code, operating_hours
            FROM terminal_configuration
            WHERE id = 1
            LIMIT 1
        ");
        $q->execute();

        $terminal = $q->fetch(PDO::FETCH_ASSOC) ?: [
            "terminal_name" => "",
            "terminal_code" => "",
            "operating_hours" => ""
        ];

        $q = $conn->query("
            SELECT id, label
            FROM terminal_hold_reasons
            WHERE is_active = 1
            ORDER BY label ASC
        ");
        $holds = $q->fetchAll(PDO::FETCH_ASSOC);

        $q = $conn->query("
            SELECT id, label, is_active
            FROM terminal_cargo_categories
            WHERE is_active = 1
            ORDER BY label ASC
        ");
        $categories = $q->fetchAll(PDO::FETCH_ASSOC);

        $q = $conn->query("
            SELECT id, label, is_active
            FROM terminal_packaging_types
            WHERE is_active = 1
            ORDER BY label ASC
        ");
        $packagingTypes = $q->fetchAll(PDO::FETCH_ASSOC);

        $q = $conn->query("
            SELECT id, label, is_active
            FROM terminal_shipment_types
            WHERE is_active = 1
            ORDER BY label ASC
        ");
        $shipmentTypes = $q->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => "Terminal configuration loaded successfully",
            "code" => [
                "terminal_name" => $terminal["terminal_name"],
                "terminal_code" => $terminal["terminal_code"],
                "operating_hours" => $terminal["operating_hours"],
                "hold_reasons" => $holds,
                "cargo_categories" => $categories,
                "packaging_types" => $packagingTypes,
                "shipment_types" => $shipmentTypes
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } catch (Throwable $e) {
        echo json_encode([
            "error" => true,
            "data" => "Unable to load terminal configuration",
            "code" => null
        ]);
    }