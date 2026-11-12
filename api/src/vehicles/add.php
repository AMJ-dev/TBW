
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

    if ($plate === "" || $kind === "") {
        echo json_encode([
            "error" => true,
            "data" => "Plate number and vehicle type are required.",
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

    $documents = [
        "insurance_certificate" => "Vehicle Insurance Certificate",
        "roadworthiness_certificate" => "Vehicle Roadworthiness Certificate"
    ];

    foreach ($documents as $field => $label) {
        if (
            !isset($_FILES[$field]) ||
            $_FILES[$field]["error"] !== UPLOAD_ERR_OK
        ) {
            echo json_encode([
                "error" => true,
                "data" => $label . " is required.",
                "code" => null
            ]);
            exit;
        }

        if ($_FILES[$field]["size"] > 10 * 1024 * 1024) {
            echo json_encode([
                "error" => true,
                "data" => $label . " must not exceed 10MB.",
                "code" => null
            ]);
            exit;
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($_FILES[$field]["tmp_name"]);

        if (!in_array($mime, $acceptedFiles, true)) {
            echo json_encode([
                "error" => true,
                "data" => "Invalid file format for " . $label . ".",
                "code" => null
            ]);
            exit;
        }

        $_FILES[$field]["type"] = $mime;
    }

    try {
        $check = $conn->prepare("
            SELECT id
            FROM gate_vehicles
            WHERE plate = :plate AND organisation_id = :organisation_id
            LIMIT 1
        ");

        $check->execute([
            ":plate" => $plate,
            ":organisation_id" => $organisation_id
        ]);

        if ($check->fetch(PDO::FETCH_ASSOC)) {
            echo json_encode([
                "error" => true,
                "data" => "A vehicle with this plate number already exists.",
                "code" => null
            ]);
            exit;
        }

        $insuranceUpload = upload_files(
            $_FILES["insurance_certificate"],
            $acceptedFiles
        );

        if ($insuranceUpload["error"]) {
            throw new Exception("Vehicle Insurance Certificate: " . $insuranceUpload["data"]);
        }

        $uploadedPaths[] = $insuranceUpload["data"];

        $roadworthinessUpload = upload_files(
            $_FILES["roadworthiness_certificate"],
            $acceptedFiles
        );

        if ($roadworthinessUpload["error"]) {
            throw new Exception("Vehicle Roadworthiness Certificate: " . $roadworthinessUpload["data"]);
        }

        $uploadedPaths[] = $roadworthinessUpload["data"];

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
                insurance_certificate,
                roadworthiness_certificate,
                notes,
                status,
                created_by
            ) VALUES (
                :id,
                :organisation_id,
                :plate,
                :kind,
                :make,
                :model,
                :year,
                :capacity,
                :owner,
                :transporter,
                :insurance_expiry,
                :roadworthiness_expiry,
                :insurance_certificate,
                :roadworthiness_certificate,
                :notes,
                :status,
                :actor_id
            )
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
            ":insurance_certificate" => $insuranceUpload["data"],
            ":roadworthiness_certificate" => $roadworthinessUpload["data"],
            ":notes" => $notes ?: null,
            ":status" => "Pending review",
            ":actor_id" => $my_details->id
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
    } catch (Exception $e) {
        foreach ($uploadedPaths as $path) {
            $fullPath = dirname(__DIR__, 1) . "/" . $path;

            if (is_file($fullPath)) {
                unlink($fullPath);
            }
        }

        echo json_encode([
            "error" => true,
            "data" => $e instanceof PDOException
                ? "Could not register vehicle."
                : $e->getMessage(),
            "code" => null
        ]);
    }
