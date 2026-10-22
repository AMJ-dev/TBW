<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";
    $organisation_id = $my_details->organisation_id ?? null;

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
            WHERE plate = :plate AND id <> :id AND organisation_id = :organisation_id
            LIMIT 1
        ");
        $check->execute([
            ":plate" => $plate,
            ":id" => $id,
            ":organisation_id" => $organisation_id
        ]);

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
                plate = :plate,
                kind = :kind,
                make = :make,
                model = :model,
                year = :year,
                capacity = :capacity,
                owner = :owner,
                transporter = :transporter,
                insurance_expiry = :insurance_expiry,
                roadworthiness_expiry = :roadworthiness_expiry,
                notes = :notes,
                updated_by = :actor_id,
            WHERE id = :id AND organisation_id = :organisation_id
        ");

        $stmt->execute([
            ":plate" => $plate,
            ":kind" => $kind,
            ":make" => $make ?: null,
            ":model" => $model ?: null,
            ":year" => $year !== "" ? (int)$year : null,
            ":capacity" => $capacity ?: null,
            ":owner" => $owner ?: null,
            ":transporter" => $transporter ?: null,
            ":insurance_expiry" => $insuranceExpiry ?: null,
            ":roadworthiness_expiry" => $roadworthinessExpiry ?: null,
            ":notes" => $notes ?: null,
            ":id" => $id,
            ":organisation_id" => $organisation_id,
            ":actor_id" => $my_details->id
        ]);

        $stmt = $conn->prepare("
            SELECT *
            FROM gate_vehicles
            WHERE id = :id AND organisation_id = :organisation_id
            LIMIT 1
        ");
        $stmt->execute([
            ":id" => $id,
            ":organisation_id" => $organisation_id
        ]);
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