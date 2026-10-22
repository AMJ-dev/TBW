<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $organisation_id = $my_details->organisation_id ?? null;
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

    if ($plate === "" || $kind === "") {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Plate number and vehicle type are required.",
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
            WHERE plate = :plate && organisation_id = :organisation_id
            LIMIT 1
        ");
        $check->execute([
            ":plate" => $plate,
            ":organisation_id" => $organisation_id
        ]);

        if ($check->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(409);
            echo json_encode([
                "error" => true,
                "data" => "A vehicle with this plate number already exists.",
                "code" => null
            ]);
            exit;
        }

        $id = generateId();

        $stmt = $conn->prepare("
            INSERT INTO gate_vehicles (
                id,
                organisation_id,
                plate,
                kind,
                make,
                model,
                year,
                capacity,
                owner,
                transporter,
                insurance_expiry,
                roadworthiness_expiry,
                notes,
                status,
                created_by
            ) VALUES (:id, :organisation_id, :plate, :kind, :make, :model, :year, :capacity, :owner, :transporter, :insurance_expiry, :roadworthiness_expiry, :notes, :status, :actor_id)
        ");

        $stmt->execute([
            ":id" => $id,
            ":organisation_id" => $organisation_id,
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
            ":status" => "Pending review",
            ":created_by" => $my_details->id
        ]);

        $stmt = $conn->prepare("
            SELECT *
            FROM gate_vehicles
            WHERE id = ?
            LIMIT 1
        ");
        $stmt->execute([$id]);

        echo json_encode([
            "error" => false,
            "data" => "Vehicle registered successfully and is pending review.",
            "code" => $stmt->fetch(PDO::FETCH_ASSOC)
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "error" => true,
            "data" => "Could not register vehicle.",
            "code" => null
        ]);
    }