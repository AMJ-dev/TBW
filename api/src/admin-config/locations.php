<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

try {
    if ($_SERVER["REQUEST_METHOD"] !== "GET") {
        http_response_code(405);
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed.",
            "code" => null
        ]);
        exit;
    }

    $q = $conn->prepare("
        SELECT
            tl.id,
            tl.parent_location_id,
            tl.code,
            tl.name,
            tl.description,
            tl.kind,
            tl.bonded,
            tl.status,
            tl.capacity,
            tl.capacity_unit,
            tl.cargo_types,
            tl.security,
            tl.equipment,
            tl.zone_code,
            tl.block_code,
            tl.row_code,
            tl.slot_code,
            tl.tier_code,
            tl.aisle_code,
            tl.rack_code,
            tl.bin_code,
            tl.created_at,
            tl.updated_at,
            parent.name AS parent_location_name,
            parent.code AS parent_location_code,
            (
                SELECT COUNT(*)
                FROM terminal_locations child
                WHERE child.parent_location_id = tl.id
            ) AS children_count
        FROM terminal_locations tl
        LEFT JOIN terminal_locations parent
            ON parent.id = tl.parent_location_id
        ORDER BY
            COALESCE(parent.code, tl.code) ASC,
            tl.code ASC
    ");

    $q->execute();
    $locations = $q->fetchAll(PDO::FETCH_ASSOC);

    $locationTypes = [
        "terminal" => "TERMINAL",
        "receiving_area" => "RECEIVING_AREA",
        "yard" => "YARD",
        "block" => "BLOCK",
        "slot" => "SLOT",
        "warehouse" => "WAREHOUSE",
        "warehouse_zone" => "WAREHOUSE_ZONE",
        "inspection_bay" => "INSPECTION_BAY",
        "discrepancy_holding_area" => "DISCREPANCY_HOLDING_AREA",
        "other" => "OTHER"
    ];

    foreach ($locations as &$location) {
        $location["bonded"] = (bool) $location["bonded"];
        $location["is_active"] = $location["status"] === "active";
        $location["capacity"] = $location["capacity"] === null
            ? null
            : (float) $location["capacity"];

        $location["children_count"] = (int) $location["children_count"];

        $location["location_name"] = $location["name"];
        $location["location_code"] = $location["code"];

        $kind = strtolower((string) $location["kind"]);

        $location["location_type"] = $locationTypes[$kind] ?? strtoupper($kind);

        $location["parent_location_id"] = $location["parent_location_id"] ?? "";
        $location["parent_location_name"] = $location["parent_location_name"] ?? "";
        $location["parent_location_code"] = $location["parent_location_code"] ?? "";
        $location["description"] = $location["description"] ?? "";

        $location["footprint_section"] = $location["zone_code"] !== ""
            ? $location["zone_code"]
            : (
                $location["block_code"] !== ""
                    ? $location["block_code"]
                    : $location["code"]
            );
    }

    unset($location);

    echo json_encode([
        "error" => false,
        "data" => "Terminal locations loaded successfully.",
        "code" => [
            "locations" => $locations,
            "summary" => [
                "total_locations" => count($locations),
                "active_locations" => count(array_filter(
                    $locations,
                    fn($location) => $location["is_active"]
                )),
                "inactive_locations" => count(array_filter(
                    $locations,
                    fn($location) => !$location["is_active"]
                )),
                "top_level_locations" => count(array_filter(
                    $locations,
                    fn($location) => $location["parent_location_id"] === ""
                ))
            ]
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not load terminal locations.",
        "code" => null
    ]);
}