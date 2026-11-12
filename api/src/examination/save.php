
<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
	http_response_code(405);
	echo json_encode([
		"error" => true,
		"data" => "Method not allowed.",
		"code" => null
	]);
	exit;
}

try {
	$container_id = trim($_POST["container_id"] ?? "");
	$examination_type = strtoupper(trim($_POST["examination_type"] ?? ""));
	$location_id = trim($_POST["location_id"] ?? "");
	$officer_id = trim($_POST["officer_id"] ?? "");
	$scheduled_date = trim($_POST["scheduled_date"] ?? "");
	$scheduled_time = trim($_POST["scheduled_time"] ?? "");
	$priority = strtoupper(trim($_POST["priority"] ?? "NORMAL"));
	$instructions = trim($_POST["instructions"] ?? "");

	$allowed_types = [
		"PHYSICAL",
		"DOCUMENT",
		"SCANNING",
		"JOINT"
	];

	$allowed_priorities = [
		"LOW",
		"NORMAL",
		"HIGH",
		"URGENT"
	];

	if (
		$container_id === "" ||
		$examination_type === "" ||
		$location_id === "" ||
		$officer_id === "" ||
		$scheduled_date === "" ||
		$scheduled_time === ""
	) {
		http_response_code(422);
		echo json_encode([
			"error" => true,
			"data" => "Complete all required examination fields.",
			"code" => 422
		]);
		exit;
	}

	if (!in_array($examination_type, $allowed_types, true)) {
		http_response_code(422);
		echo json_encode([
			"error" => true,
			"data" => "Invalid examination type.",
			"code" => 422
		]);
		exit;
	}

	if (!in_array($priority, $allowed_priorities, true)) {
		http_response_code(422);
		echo json_encode([
			"error" => true,
			"data" => "Invalid examination priority.",
			"code" => 422
		]);
		exit;
	}

	$date = DateTime::createFromFormat("!Y-m-d", $scheduled_date);
	$time = DateTime::createFromFormat("!H:i", $scheduled_time);

	if (
		!$date ||
		$date->format("Y-m-d") !== $scheduled_date ||
		!$time ||
		$time->format("H:i") !== $scheduled_time
	) {
		http_response_code(422);
		echo json_encode([
			"error" => true,
			"data" => "Invalid examination date or time.",
			"code" => 422
		]);
		exit;
	}

	$scheduled_at = DateTime::createFromFormat(
		"Y-m-d H:i",
		$scheduled_date . " " . $scheduled_time
	);

	if (!$scheduled_at || $scheduled_at <= new DateTime()) {
		http_response_code(422);
		echo json_encode([
			"error" => true,
			"data" => "The examination schedule must be in the future.",
			"code" => 422
		]);
		exit;
	}

	if (strlen($instructions) > 5000) {
		http_response_code(422);
		echo json_encode([
			"error" => true,
			"data" => "Instructions cannot exceed 5000 characters.",
			"code" => 422
		]);
		exit;
	}

	$conn->beginTransaction();

	$containerStmt = $conn->prepare("
		SELECT
			c.id,
			c.container_no,
			c.shipment_id,
			c.status AS container_status,
			s.shipment_reference,
			s.status AS shipment_status
		FROM portal_shipment_containers c
		INNER JOIN portal_shipments s
			ON s.id = c.shipment_id
		WHERE c.id = :container_id
		LIMIT 1
		FOR UPDATE
	");

	$containerStmt->execute([
		":container_id" => $container_id
	]);

	$container = $containerStmt->fetch(PDO::FETCH_ASSOC);

	if (!$container) {
		$conn->rollBack();

		http_response_code(404);
		echo json_encode([
			"error" => true,
			"data" => "The selected container could not be found.",
			"code" => 404
		]);
		exit;
	}

	$earlierContainerStatuses = [
		"EXPECTED",
		"SCHEDULED",
		"ENTERED",
		"RECEIVED",
		"IN_YARD",
		"IN_WAREHOUSE"
	];

	if (!in_array($container["container_status"], $earlierContainerStatuses, true)) {
		$conn->rollBack();

		http_response_code(409);
		echo json_encode([
			"error" => true,
			"data" => "This container cannot be scheduled for examination from its current status.",
			"code" => [
				"container_status" => $container["container_status"]
			]
		]);
		exit;
	}

	$officerStmt = $conn->prepare("
		SELECT id, full_name
		FROM users
		WHERE id = :officer_id
		AND account_type = 'system'
		LIMIT 1
	");

	$officerStmt->execute([
		":officer_id" => $officer_id
	]);

	$officer = $officerStmt->fetch(PDO::FETCH_ASSOC);

	if (!$officer) {
		$conn->rollBack();

		http_response_code(422);
		echo json_encode([
			"error" => true,
			"data" => "The selected examination officer is invalid.",
			"code" => 422
		]);
		exit;
	}

	$duplicateStmt = $conn->prepare("
		SELECT id
		FROM terminal_examinations
		WHERE container_id = :container_id
		AND status IN (
			'SCHEDULED',
			'IN_PROGRESS',
			'PENDING_REVIEW',
			'FURTHER_EXAMINATION'
		)
		LIMIT 1
	");

	$duplicateStmt->execute([
		":container_id" => $container_id
	]);

	if ($duplicateStmt->fetch(PDO::FETCH_ASSOC)) {
		$conn->rollBack();

		http_response_code(409);
		echo json_encode([
			"error" => true,
			"data" => "An active examination already exists for this container.",
			"code" => 409
		]);
		exit;
	}

	$examination_id = generateId();
	$log_id = generateId();
	$performed_by = $my_details->id;

	$insertStmt = $conn->prepare("
		INSERT INTO terminal_examinations (
			id,
			shipment_id,
			container_id,
			reference,
			examination_type,
			location_id,
			officer_id,
			scheduled_date,
			scheduled_time,
			priority,
			instructions,
			status,
			created_by,
			created_at,
			updated_at
		) VALUES (
			:id,
			:shipment_id,
			:container_id,
			:reference,
			:examination_type,
			:location_id,
			:officer_id,
			:scheduled_date,
			:scheduled_time,
			:priority,
			:instructions,
			'SCHEDULED',
			:created_by,
			NOW(),
			NOW()
		)
	");

	$insertStmt->execute([
		":id" => $examination_id,
		":shipment_id" => $container["shipment_id"],
		":container_id" => $container["id"],
		":reference" => generate_ref(),
		":examination_type" => $examination_type,
		":location_id" => $location_id,
		":officer_id" => $officer_id,
		":scheduled_date" => $scheduled_date,
		":scheduled_time" => $scheduled_time,
		":priority" => $priority,
		":instructions" => $instructions !== "" ? $instructions : null,
		":created_by" => $performed_by
	]);

	$logStmt = $conn->prepare("
		INSERT INTO terminal_examination_logs (
			id,
			examination_id,
			action,
			previous_status,
			new_status,
			description,
			metadata,
			performed_by,
			performed_at
		) VALUES (
			:id,
			:examination_id,
			'EXAMINATION_SCHEDULED',
			NULL,
			'SCHEDULED',
			:description,
			:metadata,
			:performed_by,
			NOW()
		)
	");

	$metadata = json_encode([
		"container_id" => $container["id"],
		"container_no" => $container["container_no"],
		"shipment_id" => $container["shipment_id"],
		"shipment_reference" => $container["shipment_reference"],
		"examination_type" => $examination_type,
		"location_id" => $location_id,
		"officer_id" => $officer_id,
		"scheduled_date" => $scheduled_date,
		"scheduled_time" => $scheduled_time,
		"priority" => $priority
	], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

	$logStmt->execute([
		":id" => $log_id,
		":examination_id" => $examination_id,
		":description" => "Examination scheduled and assigned to " . $officer["full_name"] . ".",
		":metadata" => $metadata,
		":performed_by" => $performed_by
	]);

	$updateContainerStmt = $conn->prepare("
		UPDATE portal_shipment_containers
		SET status = 'EXAMINATION_SCHEDULED'
		WHERE id = :container_id
		AND status IN (
			'EXPECTED',
			'SCHEDULED',
			'ENTERED',
			'RECEIVED',
			'IN_YARD',
			'IN_WAREHOUSE'
		)
	");

	$updateContainerStmt->execute([
		":container_id" => $container["id"]
	]);

	$containerStatusUpdated = $updateContainerStmt->rowCount() > 0;

	$earlierShipmentStatuses = [
		"EXPECTED",
		"SCHEDULED",
		"PARTIALLY_GATED_IN",
		"GATED_IN",
		"PARTIALLY_RECEIVED",
		"RECEIVED",
		"PARTIALLY_STORED",
		"STORED",
		"IN_TRANSIT"
	];

	$allowedContainerStatuses = [
		"EXPECTED",
		"SCHEDULED",
		"ENTERED",
		"RECEIVED",
		"IN_YARD",
		"IN_WAREHOUSE",
		"EXAMINATION_SCHEDULED"
	];

	$shipmentStatusPlaceholders = implode(
		", ",
		array_fill(0, count($earlierShipmentStatuses), "?")
	);

	$containerStatusPlaceholders = implode(
		", ",
		array_fill(0, count($allowedContainerStatuses), "?")
	);

	$updateShipmentStmt = $conn->prepare("
		UPDATE portal_shipments
		SET status = 'EXAMINATION_SCHEDULED'
		WHERE id = ?
		AND status IN ($shipmentStatusPlaceholders)
		AND EXISTS (
			SELECT 1
			FROM portal_shipment_containers c
			WHERE c.shipment_id = portal_shipments.id
		)
		AND NOT EXISTS (
			SELECT 1
			FROM portal_shipment_containers c
			WHERE c.shipment_id = portal_shipments.id
			AND c.status NOT IN ($containerStatusPlaceholders)
		)
	");

	$updateShipmentStmt->execute(array_merge(
		[$container["shipment_id"]],
		$earlierShipmentStatuses,
		$allowedContainerStatuses
	));

	$shipmentStatusUpdated = $updateShipmentStmt->rowCount() > 0;

	$conn->commit();

	echo json_encode([
		"error" => false,
		"code" => [
			"id" => $examination_id,
			"container_id" => $container["id"],
			"container_no" => $container["container_no"],
			"shipment_id" => $container["shipment_id"],
			"shipment_reference" => $container["shipment_reference"],
			"examination_type" => $examination_type,
			"location_id" => $location_id,
			"officer_id" => $officer_id,
			"officer_name" => $officer["full_name"],
			"scheduled_date" => $scheduled_date,
			"scheduled_time" => $scheduled_time,
			"priority" => $priority,
			"status" => "SCHEDULED",
			"container_status" => $containerStatusUpdated
				? "EXAMINATION_SCHEDULED"
				: $container["container_status"],
			"shipment_status" => $shipmentStatusUpdated
				? "EXAMINATION_SCHEDULED"
				: $container["shipment_status"],
			"container_status_updated" => $containerStatusUpdated,
			"shipment_status_updated" => $shipmentStatusUpdated
		],
		"data" => "Examination schedule saved successfully."
	]);
	exit;

} catch (Throwable $e) {
	if ($conn->inTransaction()) {
		$conn->rollBack();
	}

	http_response_code(500);
	echo json_encode([
		"error" => true,
		"data" => "Could not save the examination schedule.",
		"code" => 500
	]);
	exit;
}
