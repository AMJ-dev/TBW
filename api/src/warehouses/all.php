<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $stmt = $conn->prepare("
            SELECT
                wm.id,
                wm.movement_reference,
                wm.shipment_id,
                wm.container_id,
                wm.from_location_id,
                wm.to_location_id,
                wm.remarks,
                wm.moved_by,
                wm.completed_at,
                wm.created_at,
                ps.shipment_reference,
                ps.bill_of_lading,
                ps.vessel_name,
                ps.voyage_number,
                ps.shipping_line,
                pc.container_no,
                pc.size AS container_size,
                pc.seal_no,
                pc.gross_weight,
                pc.cargo_description,
                pc.status AS container_status,
                fl.code AS from_location_code,
                fl.name AS from_location_name,
                tl.code AS to_location_code,
                tl.name AS to_location_name,
                COALESCE(NULLIF(TRIM(u.full_name), ''), 'Not recorded') AS operator_name
            FROM terminal_warehouse_movements wm
            INNER JOIN portal_shipments ps ON ps.id = wm.shipment_id
            INNER JOIN portal_shipment_containers pc ON pc.id = wm.container_id
            LEFT JOIN terminal_locations fl ON fl.id = wm.from_location_id
            INNER JOIN terminal_locations tl ON tl.id = wm.to_location_id
            LEFT JOIN users u ON u.id = wm.moved_by
            ORDER BY wm.completed_at DESC
        ");

        $stmt->execute();
        $movements = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => [
                "movements" => $movements,
                "total" => count($movements)
            ],
            "code" => null
        ]);

    } catch (Throwable $e) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not load warehouse movements.",
            "code" => null
        ]);
    }