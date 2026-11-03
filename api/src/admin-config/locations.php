<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

try {
    if ($_SERVER["REQUEST_METHOD"] !== "GET") {
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
            tl.code AS location_code,
            tl.name AS location_name,
            tl.description,
            tl.kind AS location_type,
            tl.capacity,
            tl.status = 'active' AS is_active,
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

    foreach ($locations as &$location) {
        $location["is_active"] = (bool) $location["is_active"];

        $location["capacity"] = $location["capacity"] === null
            ? null
            : (float) $location["capacity"];

        $location["children_count"] = (int) $location["children_count"];

        $location["parent_location_id"] =
            $location["parent_location_id"] ?? "";

        $location["parent_location_name"] =
            $location["parent_location_name"] ?? "";

        $location["parent_location_code"] =
            $location["parent_location_code"] ?? "";

        $location["description"] = $location["description"] ?? "";
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
    echo json_encode([
        "error" => true,
        "data" => "Could not load terminal locations.",
        "code" => null
    ]);
}