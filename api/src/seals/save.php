<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

$container_id = trim($_POST["container_id"] ?? "");
$container_number = trim($_POST["container_number"] ?? "");
$seal_number = trim($_POST["seal_number"] ?? "");
$seal_type = trim($_POST["seal_type"] ?? "");
$event_type = trim($_POST["event"] ?? "");
$location = trim($_POST["location"] ?? "");
$status = trim($_POST["status"] ?? "");
$notes = trim($_POST["notes"] ?? "");

$allowed_events = [
    "Initial",
    "Custody change",
    "Examination preparation",
    "Return to storage",
    "Replacement"
];

$allowed_statuses = [
    "Verified",
    "Intact",
    "Pending verification",
    "Mismatch",
    "Broken",
    "Missing"
];

$allowed_locations = [
    "Receiving",
    "YARD",
    "WAREHOUSE",
    "EXAMINATION_BAY"
];

if (
    $container_id === "" ||
    $container_number === "" ||
    $seal_number === "" ||
    $seal_type === "" ||
    $event_type === "" ||
    $location === "" ||
    $status === ""
) {
    echo json_encode([
        "error" => true,
        "data" => "Please provide all required seal details.",
        "code" => null
    ]);
    exit;
}

if (!in_array($event_type, $allowed_events, true)) {
    echo json_encode([
        "error" => true,
        "data" => "Invalid seal event type.",
        "code" => null
    ]);
    exit;
}

if (!in_array($status, $allowed_statuses, true)) {
    echo json_encode([
        "error" => true,
        "data" => "Invalid seal status.",
        "code" => null
    ]);
    exit;
}

if (!in_array($location, $allowed_locations, true)) {
    echo json_encode([
        "error" => true,
        "data" => "Invalid seal event location.",
        "code" => null
    ]);
    exit;
}

if (strlen($seal_number) > 100 || strlen($seal_type) > 100) {
    echo json_encode([
        "error" => true,
        "data" => "Seal details exceed the allowed length.",
        "code" => null
    ]);
    exit;
}

$photo_path = null;

if (isset($_FILES["photo"]) && $_FILES["photo"]["error"] !== UPLOAD_ERR_NO_FILE) {
    if ($_FILES["photo"]["error"] !== UPLOAD_ERR_OK) {
        echo json_encode([
            "error" => true,
            "data" => "Could not upload seal photo.",
            "code" => null
        ]);
        exit;
    }

    if ($_FILES["photo"]["size"] > 5 * 1024 * 1024) {
        echo json_encode([
            "error" => true,
            "data" => "Seal photo must not exceed 5MB.",
            "code" => null
        ]);
        exit;
    }

    $upload = upload_files(
        $_FILES["photo"],
        ["image/jpeg", "image/png", "image/webp"]
    );

    if ($upload["error"]) {
        echo json_encode([
            "error" => true,
            "data" => $upload["data"],
            "code" => null
        ]);
        exit;
    }

    $photo_path = $upload["data"];
}

try {
    $conn->beginTransaction();

    $stmt = $conn->prepare("
        SELECT
            c.id AS container_id,
            c.container_no,
            c.seal_no,
            c.shipment_id,
            s.shipment_reference,
            s.organisation_id,
            (
                SELECT rc.actual_seal_no
                FROM portal_receiving_containers rc
                WHERE rc.container_id = c.id
                ORDER BY rc.received_at DESC
                LIMIT 1
            ) AS receiving_actual_seal
        FROM portal_shipment_containers c
        INNER JOIN portal_shipments s
            ON s.id = c.shipment_id
        WHERE c.id = :container_id
          AND c.container_no = :container_number
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->execute([
        ":container_id" => $container_id,
        ":container_number" => $container_number
    ]);

    $container = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$container) {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "Container could not be found.",
            "code" => null
        ]);
        exit;
    }

    $previous_seal = trim((string) ($container["receiving_actual_seal"] ?? ""));

    if ($previous_seal === "") {
        $previous_seal = trim((string) ($container["seal_no"] ?? ""));
    }

    $id = generateId();

    $stmt = $conn->prepare("
        INSERT INTO terminal_seal_events (
            id,
            container_id,
            shipment_id,
            event_type,
            seal_number,
            previous_seal_number,
            seal_type,
            location,
            status,
            notes,
            photo_path,
            recorded_by
        ) VALUES (
            :id,
            :container_id,
            :shipment_id,
            :event_type,
            :seal_number,
            :previous_seal_number,
            :seal_type,
            :location,
            :status,
            :notes,
            :photo_path,
            :recorded_by
        )
    ");

    $stmt->execute([
        ":id" => $id,
        ":container_id" => $container_id,
        ":shipment_id" => $container["shipment_id"],
        ":event_type" => $event_type,
        ":seal_number" => $seal_number,
        ":previous_seal_number" => $previous_seal !== "" ? $previous_seal : null,
        ":seal_type" => $seal_type,
        ":location" => $location,
        ":status" => $status,
        ":notes" => $notes !== "" ? $notes : null,
        ":photo_path" => $photo_path,
        ":recorded_by" => $my_details->id
    ]);

    $updated_current_seal = false;

    if (
        in_array($status, ["Verified", "Intact"], true) &&
        in_array($event_type, ["Initial", "Replacement"], true)
    ) {
        $stmt = $conn->prepare("
            UPDATE portal_shipment_containers
            SET seal_no = :seal_number
            WHERE id = :container_id
        ");

        $stmt->execute([
            ":seal_number" => $seal_number,
            ":container_id" => $container_id
        ]);

        $updated_current_seal = true;
    }

    $severity = match ($status) {
        "Mismatch", "Broken", "Missing" => "WARNING",
        default => "INFO"
    };

    $action = match ($event_type) {
        "Initial" => "SEAL_RECORDED",
        "Replacement" => "SEAL_REPLACED",
        "Custody change" => "SEAL_CUSTODY_CHANGED",
        "Examination preparation" => "SEAL_EXAMINATION_RECORDED",
        "Return to storage" => "SEAL_RETURNED_TO_STORAGE",
        default => "SEAL_EVENT_RECORDED"
    };

    $description = match ($event_type) {
        "Initial" => "Initial seal recorded for container {$container["container_no"]}.",
        "Replacement" => "Seal replaced for container {$container["container_no"]}.",
        "Custody change" => "Seal custody change recorded for container {$container["container_no"]}.",
        "Examination preparation" => "Seal examination preparation recorded for container {$container["container_no"]}.",
        "Return to storage" => "Seal return to storage recorded for container {$container["container_no"]}.",
        default => "Seal event recorded for container {$container["container_no"]}."
    };

    $old_values = [
        "seal_number" => $previous_seal !== "" ? $previous_seal : null
    ];

    $new_values = [
        "seal_number" => $seal_number,
        "event_type" => $event_type,
        "seal_type" => $seal_type,
        "location" => $location,
        "status" => $status,
        "notes" => $notes,
        "photo_path" => $photo_path,
        "current_seal_updated" => $updated_current_seal
    ];

    $metadata = [
        "container_number" => $container["container_no"],
        "shipment_reference" => $container["shipment_reference"],
        "seal_event_id" => $id,
        "photo_path" => $photo_path
    ];

    $stmt = $conn->prepare("
        INSERT INTO activity_logs (
            id,
            organisation_id,
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
            ip_address,
            user_agent,
            severity
        ) VALUES (
            :id,
            :organisation_id,
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
            :ip_address,
            :user_agent,
            :severity
        )
    ");

    $stmt->execute([
        ":id" => generateId(),
        ":organisation_id" => $container["organisation_id"],
        ":actor_id" => $my_details->id,
        ":category" => "SEALS",
        ":action" => $action,
        ":entity_type" => "CONTAINER",
        ":entity_id" => $container_id,
        ":entity_reference" => $container["container_no"],
        ":description" => $description,
        ":old_values" => json_encode($old_values),
        ":new_values" => json_encode($new_values),
        ":metadata" => json_encode($metadata),
        ":ip_address" => $_SERVER["REMOTE_ADDR"] ?? null,
        ":user_agent" => substr($_SERVER["HTTP_USER_AGENT"] ?? "", 0, 500),
        ":severity" => $severity
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => [
            "id" => $id,
            "container_id" => $container_id,
            "container_number" => $container["container_no"],
            "shipment_id" => $container["shipment_id"],
            "shipment_reference" => $container["shipment_reference"],
            "event_type" => $event_type,
            "seal_number" => $seal_number,
            "previous_seal_number" => $previous_seal !== "" ? $previous_seal : null,
            "seal_type" => $seal_type,
            "location" => $location,
            "status" => $status,
            "photo_path" => $photo_path,
            "current_seal_updated" => $updated_current_seal
        ],
        "code" => null
    ]);

} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode([
        "error" => true,
        "data" => "Could not save seal event.",
        "code" => null
    ]);
}