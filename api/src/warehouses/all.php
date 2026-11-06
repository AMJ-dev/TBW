<?php
	require_once dirname(__DIR__, 2) . "/include/verify-user.php";

	try {
		$stmt = $conn->prepare("
			SELECT
				wm.id,
				wm.movement_reference,
				wm.shipment_id,
				wm.container_id,
				COALESCE(
					wm.from_location_id,
					(
						SELECT previous_wm.to_location_id
						FROM terminal_warehouse_movements previous_wm
						WHERE previous_wm.container_id = wm.container_id
							AND previous_wm.id <> wm.id
							AND (
								previous_wm.completed_at < wm.completed_at
								OR (
									previous_wm.completed_at = wm.completed_at
									AND previous_wm.created_at < wm.created_at
								)
							)
						ORDER BY previous_wm.completed_at DESC, previous_wm.created_at DESC
						LIMIT 1
					),
					(
						SELECT prc.receiving_location_id
						FROM portal_receiving_containers prc
						WHERE prc.container_id = wm.container_id
						ORDER BY prc.received_at DESC, prc.updated_at DESC, prc.created_at DESC
						LIMIT 1
					)
				) AS from_location_id,
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
			LEFT JOIN terminal_locations fl ON fl.id = COALESCE(
				wm.from_location_id,
				(
					SELECT previous_wm.to_location_id
					FROM terminal_warehouse_movements previous_wm
					WHERE previous_wm.container_id = wm.container_id
						AND previous_wm.id <> wm.id
						AND (
							previous_wm.completed_at < wm.completed_at
							OR (
								previous_wm.completed_at = wm.completed_at
								AND previous_wm.created_at < wm.created_at
							)
						)
					ORDER BY previous_wm.completed_at DESC, previous_wm.created_at DESC
					LIMIT 1
				),
				(
					SELECT prc.receiving_location_id
					FROM portal_receiving_containers prc
					WHERE prc.container_id = wm.container_id
					ORDER BY prc.received_at DESC, prc.updated_at DESC, prc.created_at DESC
					LIMIT 1
				)
			)
			INNER JOIN terminal_locations tl ON tl.id = wm.to_location_id
			LEFT JOIN users u ON u.id = wm.moved_by
			ORDER BY wm.completed_at DESC, wm.created_at DESC
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
		echo json_encode([
			"error" => true,
			"data" => "Could not load warehouse movements.",
			"code" => null
		]);
	}