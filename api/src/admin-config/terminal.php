<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        if ($_SERVER["REQUEST_METHOD"] !== "GET") {
            http_response_code(405);
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

        $q = $conn->prepare("
            SELECT
                id,
                code,
                name,
                kind,
                bonded,
                status,
                capacity,
                capacity_unit,
                cargo_types,
                security,
                equipment,
                zone_code AS zone,
                block_code AS `block`,
                row_code AS `row`,
                slot_code AS slot,
                tier_code AS tier,
                aisle_code AS aisle,
                rack_code AS rack,
                bin_code AS bin
            FROM terminal_locations
            ORDER BY code ASC
        ");
        $q->execute();
        $locations = $q->fetchAll(PDO::FETCH_ASSOC);

        foreach ($locations as &$location) {
            $location["bonded"] = (bool) $location["bonded"];

            $location["capacity"] = $location["capacity"] === null
                ? null
                : (float) $location["capacity"];

            $location["equipment"] = array_values(array_map(
                function ($label) {
                    return [
                        "id" => generateId(),
                        "label" => trim($label)
                    ];
                },
                array_filter(
                    array_map(
                        "trim",
                        explode(",", (string) $location["equipment"])
                    ),
                    function ($label) {
                        return $label !== "";
                    }
                )
            ));
        }
        unset($location);

        $q = $conn->prepare("
            SELECT id, label
            FROM terminal_cargo_services
            WHERE is_active = 1
            ORDER BY label ASC
        ");
        $q->execute();
        $services = $q->fetchAll(PDO::FETCH_ASSOC);

        $q = $conn->prepare("
            SELECT id, label
            FROM terminal_hold_reasons
            WHERE is_active = 1
            ORDER BY label ASC
        ");
        $q->execute();
        $holds = $q->fetchAll(PDO::FETCH_ASSOC);

        $q = $conn->prepare("
            SELECT id, label
            FROM terminal_operational_areas
            WHERE is_active = 1
            ORDER BY label ASC
        ");
        $q->execute();
        $areas = $q->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => "Terminal configuration loaded successfully",
            "code" => [
                "terminal_name" => $terminal["terminal_name"],
                "terminal_code" => $terminal["terminal_code"],
                "operating_hours" => $terminal["operating_hours"],
                "locations" => $locations,
                "cargo_services" => $services,
                "hold_reasons" => $holds,
                "operational_areas" => $areas
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            "error" => true,
            "data" => "Unable to load terminal configuration",
            "code" => null
        ]);
    }