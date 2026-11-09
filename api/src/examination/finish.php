
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
    "PASS",
    "ISSUE",
    "NA"
];

$allowed_severities = [
    "LOW",
    "MEDIUM",
    "HIGH"
];

foreach ($checklist as $item) {
    if (
        !is_array($item) ||
        empty($item["id"]) ||
        empty($item["label"]) ||
        !in_array($item["result"] ?? "", $allowed_checklist_results, true)
    ) {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Complete every checklist item with a valid result.",
            "code" => null
        ]);
        exit;
    }

    if (
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

    if ($examination->status !== "IN_PROGRESS") {
        $conn->rollBack();

        http_response_code(409);
        echo json_encode([
            "error" => true,
            "data" => "Only examinations currently in progress can be submitted.",
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

    $update_examination = $conn->prepare("
        UPDATE terminal_examinations
        SET
            status = 'PENDING_REVIEW',
            findings = :findings,
            remarks = :remarks,
            completed_at = NOW()
        WHERE id = :id
            AND status = 'IN_PROGRESS'
    ");

    $update_examination->execute([
        ":findings" => $encoded_findings,
        ":remarks" => $remarks,
        ":id" => $examination_id
    ]);

    if ($update_examination->rowCount() !== 1) {
        throw new RuntimeException("Examination could not be submitted.");
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
        INSERT INTO terminal_examination_logs (
            id,
            examination_id,
            action,
            previous_status,
            new_status,
            description,
            metadata,
            performed_by
        ) VALUES (
            :id,
            :examination_id,
            :action,
            :previous_status,
            :new_status,
            :description,
            :metadata,
            :performed_by
        )
    ");

    $log->execute([
        ":id" => generateId(),
        ":examination_id" => $examination_id,
        ":action" => "EXAMINATION_SUBMITTED",
        ":previous_status" => "IN_PROGRESS",
        ":new_status" => "PENDING_REVIEW",
        ":description" => "Examination submitted for review for container {$examination->container_no}.",
        ":metadata" => json_encode([
            "container_id" => $examination->container_id,
            "container_no" => $examination->container_no,
            "container_status" => "UNDER_EXAMINATION",
            "checklist_count" => count($checklist),
            "findings_count" => count($findings),
            "has_report" => $report !== "",
            "has_remarks" => $remarks !== ""
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ":performed_by" => $my_details->id
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Examination submitted successfully and is awaiting review.",
        "code" => [
            "examination_id" => $examination_id,
            "status" => "PENDING_REVIEW",
            "container_status" => "UNDER_EXAMINATION",
            "shipment_status_updated" => $update_shipment->rowCount() > 0,
            "checklist_count" => count($checklist),
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
        "data" => "Could not submit examination.",
        "code" => null
    ]);
    exit;
}
