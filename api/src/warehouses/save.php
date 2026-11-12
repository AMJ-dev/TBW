
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=UTF-8");

try {
	$shipment_id = trim($_POST["shipment_id"] ?? "");
	$containers = $_POST["containers"] ?? null;

	if ($shipment_id === "" || !is_string($containers)) {
		echo json_encode([
			"error" => true,
			"data" => "Shipment and container details are required.",
			"code" => null
		]);
		exit;
	}

	$containers = json_decode($containers, true);

	if (!is_array($containers) || count($containers) === 0) {
		echo json_encode([
			"error" => true,
			"data" => "Select at least one container.",
			"code" => null
		]);
		exit;
	}

	$operator_id = $my_details->id ?? null;

	$eligibleStatuses = [
		"RECEIVED",
		"IN_YARD",
		"IN_WAREHOUSE",
		"UNDER_EXAMINATION",
		"EXAMINATION_SCHEDULED",
		"EXAMINATION_COMPLETE",
		"CHARGES_PENDING",
		"CHARGES_SETTLED",
		"RELEASE_AUTHORISED"
	];

	$conn->beginTransaction();

	$shipmentStmt = $conn->prepare("
		SELECT id, status
		FROM portal_shipments
		WHERE id = :id
		LIMIT 1
		FOR UPDATE
	");

	$shipmentStmt->bindValue(":id", $shipment_id, PDO::PARAM_STR);
	$shipmentStmt->execute();

	$shipment = $shipmentStmt->fetch(PDO::FETCH_ASSOC);

	if (!$shipment) {
		throw new RuntimeException("Shipment was not found.");
	}

	$containerStmt = $conn->prepare("
		SELECT
			pc.id,
			pc.shipment_id,
			pc.container_no,
			pc.status,
			pc.current_location_id,
			current_location.kind AS current_location_kind,
			receiving.receiving_status,
			receiving.receiving_location_id
		FROM portal_shipment_containers pc
		LEFT JOIN terminal_locations current_location
			ON current_location.id = pc.current_location_id
		LEFT JOIN (
			SELECT
				rc.container_id,
				rc.receiving_status,
				rc.receiving_location_id,
				ROW_NUMBER() OVER (
					PARTITION BY rc.container_id
					ORDER BY
						COALESCE(
							rc.received_at,
							rc.updated_at,
							rc.created_at
						) DESC,
						rc.created_at DESC
				) AS row_num
			FROM portal_receiving_containers rc
		) receiving
			ON receiving.container_id = pc.id
			AND receiving.row_num = 1
		WHERE pc.id = :container_id
			AND pc.shipment_id = :shipment_id
		LIMIT 1
		FOR UPDATE
	");

	$destinationStmt = $conn->prepare("
		SELECT id, code, name, kind, status
		FROM terminal_locations
		WHERE id = :id
		LIMIT 1
	");

	$insertMovement = $conn->prepare("
		INSERT INTO terminal_warehouse_movements (
			id,
			movement_reference,
			shipment_id,
			container_id,
			from_location_id,
			to_location_id,
			remarks,
			moved_by,
			completed_at,
			created_at
		) VALUES (
			:id,
			:movement_reference,
			:shipment_id,
			:container_id,
			:from_location_id,
			:to_location_id,
			:remarks,
			:moved_by,
			NOW(),
			NOW()
		)
	");

	$insertLog = $conn->prepare("
		INSERT INTO activity_logs (
			id,
			actor_id,
			category,
			action,
			entity_type,
			entity_id,
			entity_reference,
			description,
			old_values,
			new_values,
			metadata,
			severity,
			created_at
		) VALUES (
			:id,
			:actor_id,
			:category,
			:action,
			:entity_type,
			:entity_id,
			:entity_reference,
			:description,
			:old_values,
			:new_values,
			:metadata,
			:severity,
			NOW()
		)
	");

	$updateContainer = $conn->prepare("
		UPDATE portal_shipment_containers
		SET
			current_location_id = :location_id,
			status = 'IN_WAREHOUSE',
			stored_at = COALESCE(stored_at, NOW()),
			updated_at = NOW()
		WHERE id = :container_id
			AND shipment_id = :shipment_id
	");

	$saved = [];

	foreach ($containers as $item) {
		$container_id = trim($item["container_id"] ?? "");
		$destination_id = trim($item["to_location_id"] ?? "");
		$remarks = trim($item["remarks"] ?? "");

		if ($container_id === "" || $destination_id === "") {
			throw new RuntimeException(
				"Every selected container needs a warehouse destination."
			);
		}

		$containerStmt->bindValue(":container_id", $container_id, PDO::PARAM_STR);
		$containerStmt->bindValue(":shipment_id", $shipment_id, PDO::PARAM_STR);
		$containerStmt->execute();

		$container = $containerStmt->fetch(PDO::FETCH_ASSOC);

		if (!$container) {
			throw new RuntimeException(
				"One of the selected containers does not belong to this shipment."
			);
		}

		if ($container["receiving_status"] !== "RECEIVED") {
			throw new RuntimeException(
				"Container " . $container["container_no"] . " has not been received."
			);
		}

		if (!in_array($container["status"], $eligibleStatuses, true)) {
			throw new RuntimeException(
				"Container " . $container["container_no"] . " is not eligible for warehouse placement."
			);
		}

		$source_location_id = $container["current_location_id"]
			?: $container["receiving_location_id"];

		$destinationStmt->bindValue(":id", $destination_id, PDO::PARAM_STR);
		$destinationStmt->execute();

		$destination = $destinationStmt->fetch(PDO::FETCH_ASSOC);

		if (
			!$destination ||
			$destination["kind"] !== "WAREHOUSE" ||
			$destination["status"] !== "active"
		) {
			throw new RuntimeException(
				"The selected warehouse destination is not active or is not a warehouse."
			);
		}

		if ($source_location_id && $destination_id === $source_location_id) {
			throw new RuntimeException(
				"Container " . $container["container_no"] . " is already at the selected location."
			);
		}

		$movement_id = generateId();
		$movement_reference = "TRN-WHM-" . date("Y") . "-" . strtoupper(bin2hex(random_bytes(5)));

		$isRelocation = $container["current_location_kind"] === "WAREHOUSE";

		$action = $isRelocation
			? "WAREHOUSE_RELOCATION"
			: "WAREHOUSE_PLACEMENT";

		$description = $isRelocation
			? "Container relocated to " . $destination["name"]
			: "Container placed in " . $destination["name"];

		$insertMovement->execute([
			":id" => $movement_id,
			":movement_reference" => $movement_reference,
			":shipment_id" => $shipment_id,
			":container_id" => $container_id,
			":from_location_id" => $source_location_id,
			":to_location_id" => $destination_id,
			":remarks" => $remarks !== "" ? $remarks : null,
			":moved_by" => $operator_id
		]);

		$updateContainer->execute([
			":location_id" => $destination_id,
			":container_id" => $container_id,
			":shipment_id" => $shipment_id
		]);

		$insertLog->execute([
			":id" => generateId(),
			":actor_id" => $operator_id,
			":category" => "WAREHOUSE",
			":action" => $action,
			":entity_type" => "CONTAINER",
			":entity_id" => $container_id,
			":entity_reference" => $movement_reference,
			":description" => $description,
			":old_values" => json_encode([
				"location_id" => $source_location_id,
				"status" => $container["status"]
			], JSON_THROW_ON_ERROR),
			":new_values" => json_encode([
				"location_id" => $destination_id,
				"status" => "IN_WAREHOUSE"
			], JSON_THROW_ON_ERROR),
			":metadata" => json_encode([
				"source_table" => "terminal_warehouse_movement_logs",
				"movement_id" => $movement_id,
				"movement_reference" => $movement_reference,
				"shipment_id" => $shipment_id,
				"container_id" => $container_id,
				"container_no" => $container["container_no"],
				"previous_location_id" => $source_location_id,
				"new_location_id" => $destination_id,
				"destination_code" => $destination["code"],
				"destination_name" => $destination["name"],
				"movement_type" => $action,
				"remarks" => $remarks !== "" ? $remarks : null
			], JSON_THROW_ON_ERROR),
			":severity" => "INFO"
		]);

		$saved[] = [
			"movement_id" => $movement_id,
			"movement_reference" => $movement_reference,
			"container_id" => $container_id,
			"container_no" => $container["container_no"],
			"destination" => $destination["name"],
			"movement_type" => $action
		];
	}

	$countStmt = $conn->prepare("
		SELECT
			COUNT(*) AS total_containers,
			SUM(
				CASE
					WHEN status = 'IN_WAREHOUSE' THEN 1
					ELSE 0
				END
			) AS stored_containers
		FROM portal_shipment_containers
		WHERE shipment_id = :shipment_id
	");

	$countStmt->bindValue(":shipment_id", $shipment_id, PDO::PARAM_STR);
	$countStmt->execute();

	$counts = $countStmt->fetch(PDO::FETCH_ASSOC);

	$total = (int) ($counts["total_containers"] ?? 0);
	$stored = (int) ($counts["stored_containers"] ?? 0);

	if ($total > 0 && $stored === $total) {
		$shipmentStatus = "STORED";
	} elseif ($stored > 0) {
		$shipmentStatus = "PARTIALLY_STORED";
	} else {
		$shipmentStatus = null;
	}

	if ($shipmentStatus !== null) {
		$updateShipment = $conn->prepare("
			UPDATE portal_shipments
			SET status = :status, updated_at = NOW()
			WHERE id = :shipment_id
			AND status IN (
				'EXPECTED',
				'PARTIALLY_GATED_IN',
				'GATED_IN',
				'PARTIALLY_RECEIVED',
				'RECEIVED',
				'PARTIALLY_STORED',
				'STORED'
			)
		");

		$updateShipment->execute([
			":status" => $shipmentStatus,
			":shipment_id" => $shipment_id
		]);
	}

	$conn->commit();

	echo json_encode([
		"error" => false,
		"data" => [
			"message" => "Warehouse movement completed.",
			"saved" => $saved,
			"total_saved" => count($saved),
			"shipment_status" => $shipmentStatus
		],
		"code" => null
	]);

} catch (Throwable $e) {
	if ($conn->inTransaction()) {
		$conn->rollBack();
	}

	echo json_encode([
		"error" => true,
		"data" => $e instanceof RuntimeException
			? $e->getMessage()
			: "Could not save warehouse movement.",
		"code" => null
	]);
}
