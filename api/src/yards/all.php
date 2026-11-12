<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=UTF-8");

try {
    $page = max(1, (int)($_POST["page"] ?? 1));
    $limit = min(100, max(1, (int)($_POST["limit"] ?? 50)));
    $offset = ($page - 1) * $limit;

    $search = trim($_POST["search"] ?? "");
    $from_date = trim($_POST["from_date"] ?? "");
    $to_date = trim($_POST["to_date"] ?? "");

    $where = [];
    $params = [];

    if ($search !== "") {
        $where[] = "(
            ym.movement_reference LIKE :search
            OR ps.shipment_reference LIKE :search
            OR ps.bill_of_lading LIKE :search
            OR psc.container_no LIKE :search
            OR tl_from.name LIKE :search
            OR tl_to.name LIKE :search
        )";
        $params[":search"] = "%{$search}%";
    }

    if ($from_date !== "") {
        $where[] = "DATE(ym.completed_at) >= :from_date";
        $params[":from_date"] = $from_date;
    }

    if ($to_date !== "") {
        $where[] = "DATE(ym.completed_at) <= :to_date";
        $params[":to_date"] = $to_date;
    }

    $where_sql = $where ? "WHERE " . implode(" AND ", $where) : "";

    $count_sql = "
        SELECT COUNT(*)
        FROM terminal_yard_movements ym
        INNER JOIN portal_shipments ps ON ps.id = ym.shipment_id
        INNER JOIN portal_shipment_containers psc ON psc.id = ym.container_id
        LEFT JOIN terminal_locations tl_from ON tl_from.id = ym.from_location_id
        INNER JOIN terminal_locations tl_to ON tl_to.id = ym.to_location_id
        LEFT JOIN terminal_equipment te ON te.id = ym.equipment_id
        {$where_sql}
    ";

    $count_stmt = $conn->prepare($count_sql);

    foreach ($params as $key => $value) {
        $count_stmt->bindValue($key, $value);
    }

    $count_stmt->execute();
    $total = (int)$count_stmt->fetchColumn();

    $sql = "
        SELECT
            ym.id,
            ym.movement_reference,
            ym.shipment_id,
            ym.container_id,
            ym.from_location_id,
            ym.to_location_id,
            ym.equipment_id,
            ym.remarks,
            COALESCE(NULLIF(TRIM(u.full_name), ''), 'Not recorded') AS moved_by,
            ym.completed_at,
            ym.created_at,

            ps.shipment_reference,
            ps.bill_of_lading,
            ps.booking_number,
            ps.vessel_name,
            ps.voyage_number,
            ps.shipping_line,

            psc.container_no,
            psc.size AS container_size,
            psc.seal_no,
            psc.gross_weight,
            psc.cargo_description,
            psc.status AS container_status,

            tl_from.code AS from_location_code,
            tl_from.name AS from_location_name,

            tl_to.code AS to_location_code,
            tl_to.name AS to_location_name,

            te.equipment_code,
            te.equipment_name,
            te.equipment_type,
            te.registration_number,

            (
                SELECT COUNT(*)
                FROM terminal_yard_movement_logs yml
                WHERE yml.movement_id = ym.id
            ) AS log_count

        FROM terminal_yard_movements ym

        INNER JOIN portal_shipments ps ON ps.id = ym.shipment_id

        INNER JOIN portal_shipment_containers psc ON psc.id = ym.container_id

        LEFT JOIN terminal_locations tl_from ON tl_from.id = ym.from_location_id

        INNER JOIN terminal_locations tl_to ON tl_to.id = ym.to_location_id

        LEFT JOIN terminal_equipment te ON te.id = ym.equipment_id

        LEFT JOIN users u ON u.id = ym.moved_by
        {$where_sql}

        ORDER BY ym.completed_at DESC

        LIMIT :limit OFFSET :offset
    ";

    $stmt = $conn->prepare($sql);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }

    $stmt->bindValue(":limit", $limit, PDO::PARAM_INT);
    $stmt->bindValue(":offset", $offset, PDO::PARAM_INT);
    $stmt->execute();

    $movements = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $movement_ids = array_column($movements, "id");
    $logs = [];

    if (!empty($movement_ids)) {
        $placeholders = implode(",", array_fill(0, count($movement_ids), "?"));

        $log_sql = "
            SELECT
                yml.id,
                yml.movement_id,
                yml.shipment_id,
                yml.container_id,
                yml.action,
                yml.previous_location_id,
                yml.new_location_id,
                yml.description,
                yml.metadata,
                yml.performed_by,
                yml.performed_at,
                previous_location.name AS previous_location_name,
                new_location.name AS new_location_name
            FROM terminal_yard_movement_logs yml
            LEFT JOIN terminal_locations previous_location
                ON previous_location.id = yml.previous_location_id
            LEFT JOIN terminal_locations new_location
                ON new_location.id = yml.new_location_id
            WHERE yml.movement_id IN ({$placeholders})
            ORDER BY yml.performed_at DESC
        ";

        $log_stmt = $conn->prepare($log_sql);
        $log_stmt->execute($movement_ids);

        $logs = $log_stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    $logs_by_movement = [];

    foreach ($logs as $log) {
        $movement_id = $log["movement_id"];

        if (!isset($logs_by_movement[$movement_id])) {
            $logs_by_movement[$movement_id] = [];
        }

        $log["metadata"] = $log["metadata"]
            ? json_decode($log["metadata"], true)
            : null;

        $logs_by_movement[$movement_id][] = $log;
    }

    foreach ($movements as &$movement) {
        $movement["logs"] = $logs_by_movement[$movement["id"]] ?? [];
    }

    unset($movement);

    echo json_encode([
        "error" => false,
        "data" => [
            "movements" => $movements,
            "pagination" => [
                "page" => $page,
                "limit" => $limit,
                "total" => $total,
                "total_pages" => (int)ceil($total / $limit)
            ]
        ],
        "code" => 200
    ]);

} catch (Throwable $e) {
    echo json_encode([
        "error" => true,
        "data" => "Could not load yard movements.",
        "code" => $e->getMessage()
    ]);
}