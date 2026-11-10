
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

    $acceptedFiles = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    $uploadedPaths = [];

    if (!$organisation_id) {
        echo json_encode([
            "error" => true,
            "data" => "Organisation not found.",
            "code" => null
        ]);
        exit;
    }

    if ($id === "" || $plate === "" || $kind === "") {
        echo json_encode([
            "error" => true,
            "data" => "Vehicle ID, plate number, and vehicle type are required.",
            "code" => null
        ]);
        exit;
    }

    if (!in_array($kind, $allowedKinds, true)) {
        echo json_encode([
            "error" => true,
            "data" => "Invalid vehicle type.",
            "code" => null
        ]);
        exit;
    }

    if ($year !== "" && (!ctype_digit($year) || (int)$year < 1900 || (int)$year > (int)date("Y") + 1)) {
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

        $existingVehicle = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$existingVehicle) {
            echo json_encode([
                "error" => true,
                "data" => "Vehicle not found.",
                "code" => null
            ]);
            exit;
        }

        $check = $conn->prepare("
            SELECT id
            FROM gate_vehicles
            WHERE plate = :plate
            AND id <> :id
            AND organisation_id = :organisation_id
            LIMIT 1
        ");

        $check->execute([
            ":plate" => $plate,
            ":id" => $id,
            ":organisation_id" => $organisation_id
        ]);

        if ($check->fetch(PDO::FETCH_ASSOC)) {
            echo json_encode([
                "error" => true,
                "data" => "Another vehicle already uses this plate number.",
                "code" => null
            ]);
            exit;
        }

        $insuranceCertificate = $existingVehicle["insurance_certificate"] ?? null;
        $roadworthinessCertificate = $existingVehicle["roadworthiness_certificate"] ?? null;

        $documentFields = [
            "insurance_certificate" => [
                "label" => "Vehicle Insurance Certificate",
                "column" => "insurance_certificate"
            ],
            "roadworthiness_certificate" => [
                "label" => "Vehicle Roadworthiness Certificate",
                "column" => "roadworthiness_certificate"
            ]
        ];

        foreach ($documentFields as $field => $document) {
            if (!isset($_FILES[$field])) {
                continue;
            }

            $file = $_FILES[$field];

            if ($file["error"] === UPLOAD_ERR_NO_FILE) {
                continue;
            }

            if ($file["error"] !== UPLOAD_ERR_OK) {
                throw new Exception("Could not upload " . $document["label"] . ".");
            }

            if ($file["size"] > 10 * 1024 * 1024) {
                throw new Exception($document["label"] . " must not exceed 10MB.");
            }

            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime = $finfo->file($file["tmp_name"]);

            if (!in_array($mime, $acceptedFiles, true)) {
                throw new Exception("Invalid file format for " . $document["label"] . ".");
            }

            $file["type"] = $mime;

            $upload = upload_files($file, $acceptedFiles);

            if ($upload["error"]) {
                throw new Exception($document["label"] . ": " . $upload["data"]);
            }

            $uploadedPaths[] = $upload["data"];

            if ($field === "insurance_certificate") {
                $insuranceCertificate = $upload["data"];
            }

            if ($field === "roadworthiness_certificate") {
                $roadworthinessCertificate = $upload["data"];
            }
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
                insurance_certificate = :insurance_certificate,
                roadworthiness_certificate = :roadworthiness_certificate,
                notes = :notes,
                updated_by = :actor_id
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
            ":insurance_certificate" => $insuranceCertificate,
            ":roadworthiness_certificate" => $roadworthinessCertificate,
            ":notes" => $notes ?: null,
            ":id" => $id,
            ":organisation_id" => $organisation_id,
            ":actor_id" => $my_details->id
        ]);

        if (
            isset($_FILES["insurance_certificate"]) &&
            $_FILES["insurance_certificate"]["error"] === UPLOAD_ERR_OK &&
            !empty($existingVehicle["insurance_certificate"])
        ) {
            $oldPath = dirname(__DIR__, 1) . "/" . $existingVehicle["insurance_certificate"];

            if (is_file($oldPath)) {
                unlink($oldPath);
            }
        }

        if (
            isset($_FILES["roadworthiness_certificate"]) &&
            $_FILES["roadworthiness_certificate"]["error"] === UPLOAD_ERR_OK &&
            !empty($existingVehicle["roadworthiness_certificate"])
        ) {
            $oldPath = dirname(__DIR__, 1) . "/" . $existingVehicle["roadworthiness_certificate"];

            if (is_file($oldPath)) {
                unlink($oldPath);
            }
        }

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

        echo json_encode([
            "error" => false,
            "data" => "Vehicle updated successfully.",
            "code" => $vehicle
        ]);
    } catch (Throwable $e) {
        foreach ($uploadedPaths as $path) {
            $fullPath = dirname(__DIR__, 1) . "/" . $path;

            if (is_file($fullPath)) {
                unlink($fullPath);
            }
        }

        echo json_encode([
            "error" => true,
            "data" => $e instanceof PDOException
                ? "Could not update vehicle."
                : $e->getMessage(),
            "code" => null
        ]);
    }
