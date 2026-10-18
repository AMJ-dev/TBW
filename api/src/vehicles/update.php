<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

$id = trim($_POST["id"] ?? "");
$plate = strtoupper(trim($_POST["plate"] ?? ""));
$kind = trim($_POST["kind"] ?? "");
$make = trim($_POST["make"] ?? "");
$model = trim($_POST["model"] ?? "");
$year = trim($_POST["year"] ?? "");
$capacity = trim($_POST["capacity"] ?? "");
$owner = trim($_POST["owner"] ?? "");
$transporter = trim($_POST["transporter"] ?? "");
$insuranceExpiry = trim($_POST["insurance_expiry"] ?? "");
$roadworthinessExpiry = trim($_POST["roadworthiness_expiry"] ?? "");
$notes = trim($_POST["notes"] ?? "");

$allowedKinds = ["Flatbed", "Container", "Reefer", "Box", "Tanker"];

if ($id === "" || $plate === "" || $kind === "") {
    http_response_code(400);
    echo json_encode([
        "error" => true,
        "data" => "Vehicle ID, plate number, and vehicle type are required.",
        "code" => null
    ]);
    exit;
}

if (!in_array($kind, $allowedKinds, true)) {
    http_response_code(400);
    echo json_encode([
        "error" => true,
        "data" => "Invalid vehicle type.",
        "code" => null
    ]);
    exit;
}

if ($year !== "" && (!ctype_digit($year) || (int)$year < 1900 || (int)$year > (int)date("Y") + 1)) {
    http_response_code(400);
    echo json_encode([
        "error" => true,
        "data" => "Invalid vehicle year.",
        "code" => null
    ]);
    exit;
}

foreach ([$insuranceExpiry, $roadworthinessExpiry] as $date) {
    if ($date !== "") {
        $parsed = DateTime::createFromFormat("!Y-m-d", $date);

        if (!$parsed || $parsed->format("Y-m-d") !== $date) {
            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "Invalid document expiry date.",
                "code" => null
            ]);
            exit;
        }
    }
}

try {
    $check = $conn->prepare("
        SELECT id
        FROM gate_vehicles
        WHERE plate = ? AND id <> ?
        LIMIT 1
    ");
    $check->execute([$plate, $id]);

    if ($check->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(409);
        echo json_encode([
            "error" => true,
            "data" => "Another vehicle already uses this plate number.",
            "code" => null
        ]);
        exit;
    }

    $stmt = $conn->prepare("
        UPDATE gate_vehicles
        SET
            plate = ?,
            kind = ?,
            make = ?,
            model = ?,
            year = ?,
            capacity = ?,
            owner = ?,
            transporter = ?,
            insurance_expiry = ?,
            roadworthiness_expiry = ?,
            notes = ?
        WHERE id = ?
    ");

    $stmt->execute([
        $plate,
        $kind,
        $make ?: null,
        $model ?: null,
        $year !== "" ? (int)$year : null,
        $capacity ?: null,
        $owner ?: null,
        $transporter ?: null,
        $insuranceExpiry ?: null,
        $roadworthinessExpiry ?: null,
        $notes ?: null,
        $id
    ]);

    $stmt = $conn->prepare("
        SELECT *
        FROM gate_vehicles
        WHERE id = ?
        LIMIT 1
    ");
    $stmt->execute([$id]);
    $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$vehicle) {
        http_response_code(404);
        echo json_encode([
            "error" => true,
            "data" => "Vehicle not found.",
            "code" => null
        ]);
        exit;
    }

    echo json_encode([
        "error" => false,
        "data" => "Vehicle updated successfully.",
        "code" => $vehicle
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not update vehicle.",
        "code" => null
    ]);
}