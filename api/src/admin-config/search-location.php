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

        $allowed_types = ["RECEIVING", "WAREHOUSE", "INSPECTION"];

        $kind = strtoupper(trim($_POST["q"] ?? ""));

        if (!in_array($kind, $allowed_types, true)) {
            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "Invalid location type. Allowed types are RECEIVING, WAREHOUSE, and INSPECTION.",
                "code" => null
            ]);
            exit;
        }

        $q = $conn->prepare("SELECT id, code AS location_code, `name` AS location_name FROM terminal_locations WHERE kind = :kind ORDER BY `name` ASC");

        $q->execute([":kind" => $kind]);

        $locations = $q->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => "Terminal locations loaded successfully.",
            "code" => [
                "locations" => $locations
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            "error" => true,
            "data" => "Could not load terminal locations.",
            "code" => $e->getMessage()
        ]);
    }