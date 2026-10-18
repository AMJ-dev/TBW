<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json");

$id = trim($_GET["id"] ?? $_POST["id"] ?? "");
$name = trim($_POST["name"] ?? "");
$phone = trim($_POST["phone"] ?? "");
$licence_number = trim($_POST["licence_number"] ?? "");
$licence_class = trim($_POST["licence_class"] ?? "");
$licence_expiry = trim($_POST["licence_expiry"] ?? "");
$assigned_vehicle = trim($_POST["assigned_vehicle"] ?? "");
$transporter = trim($_POST["transporter"] ?? "");
$notes = trim($_POST["notes"] ?? "");

if ($id === "" || $name === "" || $phone === "" || $licence_number === "") {
    echo json_encode(["error" => true, "data" => "Driver ID, name, phone, and licence number are required.", "code" => null]);
    exit;
}

if ($licence_expiry !== "") {
    $date = DateTime::createFromFormat("!Y-m-d", $licence_expiry);

    if (!$date || $date->format("Y-m-d") !== $licence_expiry) {
        echo json_encode(["error" => true, "data" => "Invalid licence expiry date.", "code" => null]);
        exit;
    }
}

try {
    $actor = $my_details->id ?? null;

    $conn->beginTransaction();

    $stmt = $conn->prepare("SELECT id, status FROM gate_drivers WHERE id = ? FOR UPDATE");
    $stmt->execute([$id]);
    $driver = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$driver) {
        $conn->rollBack();
        echo json_encode(["error" => true, "data" => "Driver not found.", "code" => null]);
        exit;
    }

    $stmt = $conn->prepare("
        UPDATE gate_drivers
        SET name = ?, phone = ?, licence_number = ?, licence_class = ?,
            licence_expiry = ?, assigned_vehicle = ?, transporter = ?,
            notes = ?, updated_by = ?
        WHERE id = ?
    ");

    $stmt->execute([
        $name,
        $phone,
        $licence_number,
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
            id, driver_id, action, previous_status, new_status, actor_id
        ) VALUES (?, ?, 'updated', ?, ?, ?)
    ");

    $stmt->execute([
        generateId(),
        $id,
        $driver["status"],
        $driver["status"],
        $actor
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Driver updated successfully.",
        "code" => ["id" => $id]
    ]);
} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    $message = $e->getCode() === "23000"
        ? "This licence number is already registered to another driver."
        : "Could not update driver.";

    echo json_encode(["error" => true, "data" => $message, "code" => null]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode(["error" => true, "data" => "Could not update driver.", "code" => null]);
}