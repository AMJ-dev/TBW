<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json");

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
$action = strtolower(trim($_POST["action"] ?? "submit"));
$report = trim($_POST["report"] ?? "");
$remarks = trim($_POST["remarks"] ?? "");

$checklist_input = $_POST["checklist"] ?? null;
$findings_input = $_POST["findings"] ?? "[]";

if ($examination_id === "") {
    http_response_code(422);
    echo json_encode([
        "error" => true,
        "data" => "Examination ID is required.",
        "code" => null
    ]);
    exit;
}

if (!in_array($action, ["save", "submit"], true)) {
    http_response_code(422);
    echo json_encode([
        "error" => true,
        "data" => "Invalid examination action. Use save or submit.",
        "code" => null
    ]);
    exit;
}

if (is_string($checklist_input)) {
    $checklist = json_decode($checklist_input, true);
} else {
    $checklist = $checklist_input;
}

if (is_string($findings_input)) {
    $findings = json_decode($findings_input, true);
} else {
    $findings = $findings_input;
}

if (
    !is_array($checklist) ||
    count($checklist) === 0 ||
    !is_array($findings)
) {
    http_response_code(422);
    echo json_encode([
        "error" => true,
        "data" => "Invalid checklist or findings data.",
        "code" => null
    ]);
    exit;
}

$allowed_checklist_results = [
    "PENDING",
    "PASS",
    "ISSUE",
    "NA"
];

$allowed_severities = [
    "LOW",
    "MEDIUM",
    "HIGH"
];

$checklist_complete = true;

foreach ($checklist as $item) {
    if (
        !is_array($item) ||
        trim($item["id"] ?? "") === "" ||
        trim($item["label"] ?? "") === "" ||
        !in_array($item["result"] ?? "", $allowed_checklist_results, true)
    ) {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "One or more checklist items contain invalid information.",
            "code" => null
        ]);
        exit;
    }

    if ($item["result"] === "PENDING") {
        $checklist_complete = false;
    }

    if (
        $action === "submit" &&
        $item["result"] === "ISSUE" &&
        trim($item["remarks"] ?? "") === ""
    ) {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Provide an explanation for every checklist item marked as an issue.",
            "code" => [
                "checklist_id" => $item["id"]
            ]
        ]);
        exit;
    }
}

foreach ($findings as $finding) {
    if (
        !is_array($finding) ||
        trim($finding["title"] ?? "") === "" ||
        trim($finding["description"] ?? "") === "" ||
        !in_array($finding["severity"] ?? "", $allowed_severities, true)
    ) {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "One or more findings contain invalid information.",
            "code" => null
        ]);
        exit;
    }
}

if ($action === "submit" && !$checklist_complete) {
    http_response_code(422);
    echo json_encode([
        "error" => true,
        "data" => "Complete every checklist item before submitting the examination.",
        "code" => [
            "checklist_complete" => false
        ]
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

    if ((string) $examination->officer_id !== (string) $my_details->id) {
        $conn->rollBack();

        http_response_code(403);
        echo json_encode([
            "error" => true,
            "data" => "You are not assigned to this examination.",
            "code" => null
        ]);
        exit;
    }

    $editable_statuses = [
        "IN_PROGRESS",
        "CHANGES_REQUESTED"
    ];

    if (!in_array($examination->status, $editable_statuses, true)) {
        $conn->rollBack();

        http_response_code(409);
        echo json_encode([
            "error" => true,
            "data" => "This examination cannot be edited or submitted in its current status.",
            "code" => [
                "status" => $examination->status
            ]
        ]);
        exit;
    }

    if ($examination->container_status !== "UNDER_EXAMINATION") {
        $conn->rollBack();

        http_response_code(409);
        echo json_encode([
            "error" => true,
            "data" => "The container is not currently under examination.",
            "code" => [
                "container_status" => $examination->container_status
            ]
        ]);
        exit;
    }

    $previous_status = $examination->status;

    $new_status = $action === "submit"
        ? "PENDING_REVIEW"
        : $previous_status;

    $report_data = [
        "checklist" => array_values($checklist),
        "findings" => array_values($findings),
        "report" => $report
    ];

    $encoded_findings = json_encode(
        $report_data,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    if ($encoded_findings === false) {
        throw new RuntimeException("Could not encode examination report.");
    }

    if ($action === "submit") {
        $update_examination = $conn->prepare("
            UPDATE terminal_examinations
            SET
                status = 'PENDING_REVIEW',
                findings = :findings,
                remarks = :remarks,
                completed_at = NOW()
            WHERE id = :id
                AND status = :previous_status
        ");
    } else {
        $update_examination = $conn->prepare("
            UPDATE terminal_examinations
            SET
                findings = :findings,
                remarks = :remarks
            WHERE id = :id
                AND status = :previous_status
        ");
    }

    $update_examination->execute([
        ":findings" => $encoded_findings,
        ":remarks" => $remarks,
        ":id" => $examination_id,
        ":previous_status" => $previous_status
    ]);

    if ($update_examination->rowCount() !== 1) {
        throw new RuntimeException("Examination could not be updated.");
    }

    $shipment_updated = false;

    if ($action === "submit") {
        $eligible_shipment_statuses = [
            "EXPECTED",
            "SCHEDULED",
            "PARTIALLY_GATED_IN",
            "GATED_IN",
            "PARTIALLY_RECEIVED",
            "RECEIVED",
            "PARTIALLY_STORED",
            "STORED",
            "EXAMINATION_SCHEDULED",
            "UNDER_EXAMINATION"
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

        $shipment_updated = $update_shipment->rowCount() > 0;
    }

    if ($action === "save") {
        $log_action = "EXAMINATION_SAVED";
        $log_description = "Examination report saved for container {$examination->container_no}.";
        $response_message = "Examination saved successfully.";
    } elseif ($previous_status === "CHANGES_REQUESTED") {
        $log_action = "EXAMINATION_RESUBMITTED";
        $log_description = "Corrected examination resubmitted for review for container {$examination->container_no}.";
        $response_message = "Corrected examination resubmitted successfully and is awaiting review.";
    } else {
        $log_action = "EXAMINATION_SUBMITTED";
        $log_description = "Examination submitted for review for container {$examination->container_no}.";
        $response_message = "Examination submitted successfully and is awaiting review.";
    }

    $log_metadata = json_encode([
        "container_id" => $examination->container_id,
        "container_no" => $examination->container_no,
        "container_status" => $examination->container_status,
        "checklist_count" => count($checklist),
        "checklist_complete" => $checklist_complete,
        "findings_count" => count($findings),
        "has_report" => $report !== "",
        "has_remarks" => $remarks !== "",
        "action" => $action
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

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
        ":action" => $log_action,
        ":entity_type" => "EXAMINATION",
        ":entity_id" => $examination_id,
        ":description" => $log_description,
        ":old_values" => json_encode([
            "status" => $previous_status
        ], JSON_THROW_ON_ERROR),
        ":new_values" => json_encode([
            "status" => $new_status
        ], JSON_THROW_ON_ERROR),
        ":metadata" => json_encode([
            "source_table" => "terminal_examination_logs",
            "examination_id" => $examination_id,
            "details" => $log_metadata
        ], JSON_THROW_ON_ERROR),
        ":severity" => "INFO"
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => $response_message,
        "code" => [
            "examination_id" => $examination_id,
            "action" => $action,
            "status" => $new_status,
            "previous_status" => $previous_status,
            "container_status" => $examination->container_status,
            "shipment_status_updated" => $shipment_updated,
            "checklist_count" => count($checklist),
            "checklist_complete" => $checklist_complete,
            "findings_count" => count($findings)
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
        "data" => "Could not process examination.",
        "code" => null
    ]);
    exit;
}