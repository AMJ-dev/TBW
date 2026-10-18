<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=utf-8");

$name = trim($_POST["name"] ?? "");
$phone = trim($_POST["phone"] ?? "");
$licence_number = trim($_POST["licence_number"] ?? "");
$licence_class = trim($_POST["licence_class"] ?? "");
$licence_expiry = trim($_POST["licence_expiry"] ?? "");
$assigned_vehicle = trim($_POST["assigned_vehicle"] ?? "");
$transporter = trim($_POST["transporter"] ?? "");
$notes = trim($_POST["notes"] ?? "");

if ($name === "" || $phone === "" || $licence_number === "") {
    echo json_encode([
        "error" => true,
        "data" => "Name, phone, and licence number are required.",
        "code" => null
    ]);
    exit;
}

if ($licence_expiry !== "") {
    $date = DateTime::createFromFormat("!Y-m-d", $licence_expiry);

    if (!$date || $date->format("Y-m-d") !== $licence_expiry) {
        echo json_encode([
            "error" => true,
            "data" => "Invalid licence expiry date.",
            "code" => null
        ]);
        exit;
    }
}

try {
    $actor = $my_details->id ?? null;

    $conn->beginTransaction();

    $stmt = $conn->prepare("
        SELECT id, status
        FROM gate_drivers
        WHERE licence_number = ?
        LIMIT 1
        FOR UPDATE
    ");
    $stmt->execute([$licence_number]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $id = $existing["id"];

        $stmt = $conn->prepare("
            UPDATE gate_drivers
            SET
                name = ?,
                phone = ?,
                licence_class = ?,
                licence_expiry = ?,
                assigned_vehicle = ?,
                transporter = ?,
                notes = ?,
                updated_by = ?,
                updated_at = NOW()
            WHERE id = ?
        ");

        $stmt->execute([
            $name,
            $phone,
            $licence_class ?: null,
            $licence_expiry ?: null,
            $assigned_vehicle ?: null,
            $transporter ?: null,
            $notes ?: null,
            $actor,
            $id
        ]);

        $stmt = $conn->prepare("
            INSERT INTO gate_driver_action_logs (
                id,
                driver_id,
                action,
                previous_status,
                new_status,
                actor_id
            ) VALUES (?, ?, 'updated_existing_licence', ?, ?, ?)
        ");

        $stmt->execute([
            generateId(),
            $id,
            $existing["status"],
            $existing["status"],
            $actor
        ]);

        $message = "Existing driver found by licence number and updated.";
    } else {
        $id = generateId();

        $stmt = $conn->prepare("
            INSERT INTO gate_drivers (
                id,
                name,
                phone,
                licence_number,
                licence_class,
                licence_expiry,
                assigned_vehicle,
                transporter,
                notes,
                status,
                created_by,
                updated_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending review', ?, ?)
        ");

        $stmt->execute([
            $id,
            $name,
            $phone,
            $licence_number,
            $licence_class ?: null,
            $licence_expiry ?: null,
            $assigned_vehicle ?: null,
            $transporter ?: null,
            $notes ?: null,
            $actor,
            $actor
        ]);

        $stmt = $conn->prepare("
            INSERT INTO gate_driver_action_logs (
                id,
                driver_id,
                action,
                new_status,
                actor_id
            ) VALUES (?, ?, 'created', 'Pending review', ?)
        ");

        $stmt->execute([
            generateId(),
            $id,
            $actor
        ]);

        $message = "Driver registered successfully.";
    }

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => $message,
        "code" => [
            "id" => $id,
            "existing" => (bool)$existing
        ]
    ]);
} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    $message = $e->getCode() === "23000"
        ? "This licence number is already registered."
        : "Could not save driver.";

    echo json_encode([
        "error" => true,
        "data" => $message,
        "code" => null
    ]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode([
        "error" => true,
        "data" => "Could not save driver.",
        "code" => null
    ]);
}