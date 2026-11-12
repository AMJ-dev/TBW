
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

$examination_id = trim($_POST["examination_id"] ?? "");

if ($examination_id === "") {
	http_response_code(422);
	echo json_encode([
		"error" => true,
		"data" => "Examination ID is required.",
		"code" => null
	]);
	exit;
}

try {
	$conn->beginTransaction();

	$stmt = $conn->prepare("
		SELECT
			e.id,
			e.reference,
			e.container_id,
			e.shipment_id,
			e.status,
			e.officer_id,
			c.container_no,
			c.status AS container_status
		FROM terminal_examinations e
		INNER JOIN portal_shipment_containers c
			ON c.id = e.container_id
		WHERE e.id = :id
		FOR UPDATE
	");

	$stmt->execute([
		":id" => $examination_id
	]);

	$examination = $stmt->fetch(PDO::FETCH_OBJ);

	if (!$examination) {
		$conn->rollBack();

		http_response_code(404);
		echo json_encode([
			"error" => true,
			"data" => "Examination not found.",
			"code" => null
		]);
		exit;
	}

	if ($examination->officer_id !== $my_details->id) {
		$conn->rollBack();

		http_response_code(403);
		echo json_encode([
			"error" => true,
			"data" => "You are not assigned to this examination.",
			"code" => null
		]);
		exit;
	}

	if ($examination->status !== "SCHEDULED") {
		$conn->rollBack();

		http_response_code(409);
		echo json_encode([
			"error" => true,
			"data" => "Only scheduled examinations can be started.",
			"code" => [
				"status" => $examination->status
			]
		]);
		exit;
	}

	$allowed_container_statuses = [
		"EXPECTED",
		"SCHEDULED",
		"ENTERED",
		"RECEIVED",
		"IN_YARD",
		"IN_WAREHOUSE",
		"EXAMINATION_SCHEDULED"
	];

	if (!in_array($examination->container_status, $allowed_container_statuses, true)) {
		$conn->rollBack();

		http_response_code(409);
		echo json_encode([
			"error" => true,
			"data" => "The container cannot be placed under examination from its current status.",
			"code" => [
				"container_status" => $examination->container_status
			]
		]);
		exit;
	}

	$update_examination = $conn->prepare("
		UPDATE terminal_examinations
		SET status = 'IN_PROGRESS'
		WHERE id = :id
			AND status = 'SCHEDULED'
	");

	$update_examination->execute([
		":id" => $examination_id
	]);

	if ($update_examination->rowCount() !== 1) {
		throw new RuntimeException("Examination could not be started.");
	}

	$update_container = $conn->prepare("
		UPDATE portal_shipment_containers
		SET status = 'UNDER_EXAMINATION'
		WHERE id = :container_id
			AND status = :previous_status
	");

	$update_container->execute([
		":container_id" => $examination->container_id,
		":previous_status" => $examination->container_status
	]);

	if ($update_container->rowCount() !== 1) {
		throw new RuntimeException("Container status could not be updated.");
	}

	$eligible_shipment_statuses = [
		"EXPECTED",
		"SCHEDULED",
		"PARTIALLY_GATED_IN",
		"GATED_IN",
		"PARTIALLY_RECEIVED",
		"RECEIVED",
		"PARTIALLY_STORED",
		"STORED",
		"EXAMINATION_SCHEDULED"
	];

	$eligible_container_statuses = [
		"EXPECTED",
		"SCHEDULED",
		"ENTERED",
		"RECEIVED",
		"IN_YARD",
		"IN_WAREHOUSE",
		"EXAMINATION_SCHEDULED",
		"UNDER_EXAMINATION"
	];

	$status_placeholders = implode(
		", ",
		array_fill(0, count($eligible_shipment_statuses), "?")
	);

	$container_placeholders = implode(
		", ",
		array_fill(0, count($eligible_container_statuses), "?")
	);

	$update_shipment = $conn->prepare("
		UPDATE portal_shipments
		SET status = 'UNDER_EXAMINATION'
		WHERE id = ?
			AND status IN ($status_placeholders)
			AND EXISTS (
				SELECT 1
				FROM portal_shipment_containers c
				WHERE c.shipment_id = portal_shipments.id
					AND c.status = 'UNDER_EXAMINATION'
			)
			AND NOT EXISTS (
				SELECT 1
				FROM portal_shipment_containers c
				WHERE c.shipment_id = portal_shipments.id
					AND c.status NOT IN ($container_placeholders)
			)
	");

	$update_shipment->execute(array_merge(
		[$examination->shipment_id],
		$eligible_shipment_statuses,
		$eligible_container_statuses
	));

	$log = $conn->prepare("
		INSERT INTO activity_logs (
			id,
			actor_id,
			category,
			action,
			entity_type,
			entity_id,
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
			:description,
			:old_values,
			:new_values,
			:metadata,
			:severity,
			NOW()
		)
	");

	$log->execute([
		":id" => generateId(),
		":actor_id" => $my_details->id,
		":category" => "EXAMINATION",
		":action" => "EXAMINATION_STARTED",
		":entity_type" => "EXAMINATION",
		":entity_id" => $examination_id,
		":description" => "Examination started for container {$examination->container_no}.",
		":old_values" => json_encode([
			"examination_status" => "SCHEDULED",
			"container_status" => $examination->container_status
		], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
		":new_values" => json_encode([
			"examination_status" => "IN_PROGRESS",
			"container_status" => "UNDER_EXAMINATION"
		], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
		":metadata" => json_encode([
			"source_table" => "terminal_examination_logs",
			"container_id" => $examination->container_id,
			"container_no" => $examination->container_no
		], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
		":severity" => "INFO"
	]);

	$conn->commit();

	echo json_encode([
		"error" => false,
		"data" => "Examination started successfully.",
		"code" => [
			"examination_id" => $examination_id,
			"status" => "IN_PROGRESS",
			"container_status" => "UNDER_EXAMINATION",
			"shipment_status_updated" => $update_shipment->rowCount() > 0
		]
	]);
	exit;

} catch (Throwable $e) {
	if ($conn->inTransaction()) {
		$conn->rollBack();
	}

	http_response_code(500);
	echo json_encode([
		"error" => true,
		"data" => "Could not start examination.",
		"code" => null
	]);
	exit;
}
