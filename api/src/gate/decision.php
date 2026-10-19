
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
    exit;
}

$appointmentId = trim((string)($_POST["appointment_id"] ?? ""));
$passId = trim((string)($_POST["gate_pass_id"] ?? ""));
$direction = strtolower(trim((string)($_POST["direction"] ?? "")));
$decision = strtoupper(trim((string)($_POST["decision"] ?? "")));
$reason = trim((string)($_POST["reason"] ?? ""));
$overrideReason = trim((string)($_POST["override_reason"] ?? ""));
$supervisorApprovalRef = trim((string)($_POST["supervisor_approval_ref"] ?? ""));

if (
    $appointmentId === "" ||
    $passId === "" ||
    !in_array($direction, ["in", "out"], true) ||
    !in_array($decision, ["ADMIT", "REFER", "REJECT"], true)
) {
    http_response_code(422);
    echo json_encode(["error" => true, "data" => "Appointment, pass, direction and a valid decision are required.", "code" => null]);
    exit;
}

if ($decision !== "ADMIT" && $reason === "") {
    http_response_code(422);
    echo json_encode(["error" => true, "data" => "A reason is required for REFER or REJECT.", "code" => null]);
    exit;
}

if ($direction === "out" && $decision === "ADMIT") {
    http_response_code(422);
    echo json_encode([
        "error" => true,
        "data" => "Gate-out admission is blocked until release authorisation and financial clearance are verified by the server.",
        "code" => null
    ]);
    exit;
}

try {
    $conn->beginTransaction();

    $stmt = $conn->prepare("
        SELECT
            a.id AS appointment_id,
            a.appointment_date,
            a.status AS appointment_status,
            a.vehicle_id,
            a.driver_id,
            v.plate,
            v.status AS vehicle_status,
            v.insurance_expiry,
            v.roadworthiness_expiry,
            d.status AS driver_status,
            d.licence_expiry,
            p.id AS gate_pass_id,
            p.pass_code,
            p.type AS pass_type,
            p.status AS pass_status,
            p.valid_until
        FROM gate_appointments a
        INNER JOIN gate_vehicles v ON v.id = a.vehicle_id
        INNER JOIN gate_drivers d ON d.id = a.driver_id
        INNER JOIN gate_passes p
            ON p.appointment_id = a.id
            AND p.vehicle_id = a.vehicle_id
            AND p.driver_id = a.driver_id
        WHERE a.id = ?
          AND p.id = ?
        LIMIT 1
        FOR UPDATE
    ");
    $stmt->execute([$appointmentId, $passId]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$record) {
        $conn->rollBack();
        http_response_code(404);
        echo json_encode(["error" => true, "data" => "Matching appointment and gate pass not found.", "code" => null]);
        exit;
    }

    $today = date("Y-m-d");
    $holds = [];

    if ($record["appointment_date"] !== $today) {
        $holds[] = "Appointment is not scheduled for today";
    }

    if ($record["vehicle_status"] !== "Approved") {
        $holds[] = "Vehicle is not approved";
    }

    if (
        empty($record["insurance_expiry"]) ||
        $record["insurance_expiry"] < $today
    ) {
        $holds[] = "Vehicle insurance is missing or expired";
    }

    if (
        empty($record["roadworthiness_expiry"]) ||
        $record["roadworthiness_expiry"] < $today
    ) {
        $holds[] = "Vehicle roadworthiness is missing or expired";
    }

    if ($record["driver_status"] !== "Approved") {
        $holds[] = "Driver is not approved";
    }

    if (
        empty($record["licence_expiry"]) ||
        $record["licence_expiry"] < $today
    ) {
        $holds[] = "Driver licence is missing or expired";
    }

    if ($record["pass_status"] !== "Active") {
        $holds[] = "Gate pass is not active";
    }

    if (strtotime($record["valid_until"]) < time()) {
        $holds[] = "Gate pass has expired";
    }

    if ($direction === "in") {
        if (!in_array($record["pass_type"], ["Terminal Entry", "Collection"], true)) {
            $holds[] = "Pass type does not permit gate-in";
        }

        if (!in_array($record["appointment_status"], ["Confirmed", "Arrived"], true)) {
            $holds[] = "Appointment status does not permit gate-in";
        }

        $duplicate = $conn->prepare("
            SELECT id
            FROM gate_movement_records
            WHERE appointment_id = ?
              AND direction = 'in'
              AND decision = 'ADMIT'
            LIMIT 1
            FOR UPDATE
        ");
        $duplicate->execute([$appointmentId]);

        if ($duplicate->fetch(PDO::FETCH_ASSOC)) {
            $holds[] = "Appointment has already been admitted";
        }
    }

    if ($direction === "out") {
        $holds[] = "Release authorisation and financial clearance have not been verified";
    }

    if ($decision === "ADMIT" && count($holds) > 0) {
        $conn->rollBack();
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Admission blocked. Resolve the outstanding checks first.",
            "code" => ["holds" => $holds]
        ]);
        exit;
    }

    if ($decision === "ADMIT" && $overrideReason !== "") {
        if ($supervisorApprovalRef === "") {
            $conn->rollBack();
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "Supervisor approval reference is required for an override.", "code" => null]);
            exit;
        }

        $conn->rollBack();
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "Overrides require server-verified supervisor approval and cannot be authorised by reference text alone.", "code" => null]);
        exit;
    }

    $movementId = generateId();
    $operatorId = $my_details->id ?? null;

    $insert = $conn->prepare("
        INSERT INTO gate_movement_records
            (
                id, appointment_id, gate_pass_id, vehicle_id, driver_id,
                direction, decision, reason, override_reason,
                supervisor_approval_ref, operator_id, movement_at
            )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    $insert->execute([
        $movementId,
        $appointmentId,
        $passId,
        $record["vehicle_id"],
        $record["driver_id"],
        $direction,
        $decision,
        $reason !== "" ? $reason : null,
        $overrideReason !== "" ? $overrideReason : null,
        $supervisorApprovalRef !== "" ? $supervisorApprovalRef : null,
        $operatorId
    ]);

    if ($direction === "in" && $decision === "ADMIT") {
        $updateAppointment = $conn->prepare("
            UPDATE gate_appointments
            SET status = 'In Terminal'
            WHERE id = ?
              AND status IN ('Confirmed', 'Arrived')
        ");
        $updateAppointment->execute([$appointmentId]);

        if ($updateAppointment->rowCount() !== 1) {
            throw new RuntimeException("Appointment status changed before admission could be completed.");
        }

        $updatePass = $conn->prepare("
            UPDATE gate_passes
            SET status = 'Redeemed'
            WHERE id = ?
              AND status = 'Active'
        ");
        $updatePass->execute([$passId]);

        if ($updatePass->rowCount() !== 1) {
            throw new RuntimeException("Gate pass is no longer active.");
        }
    }

    $audit = $conn->prepare("
        INSERT INTO gate_movement_audit
            (id, movement_id, appointment_id, gate_pass_id, operator_id, event_type, event_data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $audit->execute([
        generateId(),
        $movementId,
        $appointmentId,
        $passId,
        $operatorId,
        "GATE_" . strtoupper($direction) . "_" . $decision,
        json_encode([
            "plate" => $record["plate"],
            "pass_code" => $record["pass_code"],
            "reason" => $reason,
            "holds" => $holds
        ])
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Gate decision recorded successfully.",
        "code" => [
            "id" => $movementId,
            "appointment_id" => $appointmentId,
            "gate_pass_id" => $passId,
            "direction" => $direction,
            "decision" => $decision,
            "reason" => $reason,
            "recorded_at" => date("Y-m-d H:i:s")
        ]
    ]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode(["error" => true, "data" => "Could not record gate decision.", "code" => null]);
}
