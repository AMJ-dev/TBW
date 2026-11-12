
<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $organisation_id = $my_details->organisation_id ?? null;

    $id = trim($_GET["id"] ?? $_POST["id"] ?? "");
    $name = trim($_POST["name"] ?? "");
    $phone = trim($_POST["phone"] ?? "");
    $licence_number = trim($_POST["licence_number"] ?? "");
    $licence_class = trim($_POST["licence_class"] ?? "");
    $licence_expiry = trim($_POST["licence_expiry"] ?? "");
    $assigned_vehicle = trim($_POST["assigned_vehicle"] ?? "");
    $transporter = trim($_POST["transporter"] ?? "");
    $notes = trim($_POST["notes"] ?? "");

    if (!$organisation_id) {
        echo json_encode([
            "error" => true,
            "data" => "Organisation not found.",
            "code" => null
        ]);
        exit;
    }

    if ($id === "" || $name === "" || $phone === "" || $licence_number === "") {
        echo json_encode([
            "error" => true,
            "data" => "Driver ID, name, phone, and licence number are required.",
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

    $licence_file = $_FILES["licence_document"] ?? null;

    if (
        $licence_file &&
        $licence_file["error"] !== UPLOAD_ERR_NO_FILE &&
        $licence_file["error"] !== UPLOAD_ERR_OK
    ) {
        echo json_encode([
            "error" => true,
            "data" => "Could not upload driver licence.",
            "code" => null
        ]);
        exit;
    }

    $accepted = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if ($licence_file && $licence_file["error"] === UPLOAD_ERR_OK) {
        if ($licence_file["size"] > 10 * 1024 * 1024) {
            echo json_encode([
                "error" => true,
                "data" => "Driver licence must not exceed 10MB.",
                "code" => null
            ]);
            exit;
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime_type = $finfo->file($licence_file["tmp_name"]);

        if (!in_array($mime_type, $accepted, true)) {
            echo json_encode([
                "error" => true,
                "data" => "Only PDF, JPG, PNG, and WEBP files are allowed.",
                "code" => null
            ]);
            exit;
        }

        $licence_file["type"] = $mime_type;
    } else {
        $licence_file = null;
    }

    $uploaded_document = null;

    try {
        $actor = $my_details->id ?? null;

        $conn->beginTransaction();

        $stmt = $conn->prepare("
            SELECT id, status, licence_document
            FROM gate_drivers
            WHERE id = :id
            AND organisation_id = :organisation_id
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->execute([
            ":id" => $id,
            ":organisation_id" => $organisation_id
        ]);

        $driver = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$driver) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Driver not found.",
                "code" => null
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT id, status, licence_document
            FROM gate_drivers
            WHERE licence_number = :licence_number
            AND organisation_id = :organisation_id
            AND id <> :id
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->execute([
            ":licence_number" => $licence_number,
            ":organisation_id" => $organisation_id,
            ":id" => $id
        ]);

        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        $target_id = $existing["id"] ?? $id;
        $target_document = $existing["licence_document"] ?? $driver["licence_document"];

        if ($licence_file) {
            $upload_result = upload_files($licence_file, $accepted);

            if ($upload_result["error"]) {
                $conn->rollBack();

                echo json_encode([
                    "error" => true,
                    "data" => $upload_result["data"],
                    "code" => null
                ]);
                exit;
            }

            $uploaded_document = $upload_result["data"];
            $target_document = $uploaded_document;
        }

        if ($existing) {
            $stmt = $conn->prepare("
                UPDATE gate_drivers
                SET
                    name = :name,
                    phone = :phone,
                    licence_class = :licence_class,
                    licence_expiry = :licence_expiry,
                    assigned_vehicle = :assigned_vehicle,
                    transporter = :transporter,
                    notes = :notes,
                    licence_document = :licence_document,
                    updated_by = :actor,
                    updated_at = NOW()
                WHERE id = :existing_id
                AND organisation_id = :organisation_id
            ");

            $stmt->execute([
                ":name" => $name,
                ":phone" => $phone,
                ":licence_class" => $licence_class ?: null,
                ":licence_expiry" => $licence_expiry ?: null,
                ":assigned_vehicle" => $assigned_vehicle ?: null,
                ":transporter" => $transporter ?: null,
                ":notes" => $notes ?: null,
                ":licence_document" => $target_document,
                ":actor" => $actor,
                ":existing_id" => $target_id,
                ":organisation_id" => $organisation_id
            ]);

            $stmt = $conn->prepare("
                INSERT INTO gate_driver_action_logs (
                    id,
                    driver_id,
                    action,
                    previous_status,
                    new_status,
                    actor_id
                ) VALUES (
                    :id,
                    :driver_id,
                    'updated_existing_licence',
                    :previous_status,
                    :new_status,
                    :actor_id
                )
            ");

            $stmt->execute([
                ":id" => generateId(),
                ":driver_id" => $target_id,
                ":previous_status" => $existing["status"],
                ":new_status" => $existing["status"],
                ":actor_id" => $actor
            ]);

            $conn->commit();

            if (
                $uploaded_document &&
                !empty($target_document) &&
                $target_document !== $uploaded_document
            ) {
                $old_document = dirname(__DIR__, 1) . "/" . ltrim($existing["licence_document"] ?? "", "/");

                if (is_file($old_document)) {
                    unlink($old_document);
                }
            }

            echo json_encode([
                "error" => false,
                "data" => "Licence already exists. The existing driver record was updated.",
                "code" => [
                    "id" => $target_id,
                    "existing" => true,
                    "licence_document" => $target_document
                ]
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            UPDATE gate_drivers
            SET
                name = :name,
                phone = :phone,
                licence_number = :licence_number,
                licence_class = :licence_class,
                licence_expiry = :licence_expiry,
                assigned_vehicle = :assigned_vehicle,
                transporter = :transporter,
                notes = :notes,
                licence_document = :licence_document,
                updated_by = :actor,
                updated_at = NOW()
            WHERE id = :id
            AND organisation_id = :organisation_id
        ");

        $stmt->execute([
            ":name" => $name,
            ":phone" => $phone,
            ":licence_number" => $licence_number,
            ":licence_class" => $licence_class ?: null,
            ":licence_expiry" => $licence_expiry ?: null,
            ":assigned_vehicle" => $assigned_vehicle ?: null,
            ":transporter" => $transporter ?: null,
            ":notes" => $notes ?: null,
            ":licence_document" => $target_document,
            ":actor" => $actor,
            ":id" => $id,
            ":organisation_id" => $organisation_id
        ]);

        $stmt = $conn->prepare("
            INSERT INTO gate_driver_action_logs (
                id,
                driver_id,
                action,
                previous_status,
                new_status,
                actor_id
            ) VALUES (
                :id,
                :driver_id,
                'updated',
                :previous_status,
                :new_status,
                :actor_id
            )
        ");

        $stmt->execute([
            ":id" => generateId(),
            ":driver_id" => $id,
            ":previous_status" => $driver["status"],
            ":new_status" => $driver["status"],
            ":actor_id" => $actor
        ]);

        $conn->commit();

        if (
            $uploaded_document &&
            !empty($driver["licence_document"]) &&
            $driver["licence_document"] !== $uploaded_document
        ) {
            $old_document = dirname(__DIR__, 1) . "/" . ltrim($driver["licence_document"], "/");

            if (is_file($old_document)) {
                unlink($old_document);
            }
        }

        echo json_encode([
            "error" => false,
            "data" => "Driver updated successfully.",
            "code" => [
                "id" => $id,
                "existing" => false,
                "licence_document" => $target_document
            ]
        ]);
    } catch (PDOException $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        if ($uploaded_document) {
            $uploaded_path = dirname(__DIR__, 1) . "/" . ltrim($uploaded_document, "/");

            if (is_file($uploaded_path)) {
                unlink($uploaded_path);
            }
        }

        $message = $e->getCode() === "23000"
            ? "This licence number is already registered."
            : "Could not update driver.";

        echo json_encode([
            "error" => true,
            "data" => $message,
            "code" => null
        ]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        if ($uploaded_document) {
            $uploaded_path = dirname(__DIR__, 1) . "/" . ltrim($uploaded_document, "/");

            if (is_file($uploaded_path)) {
                unlink($uploaded_path);
            }
        }

        echo json_encode([
            "error" => true,
            "data" => "Could not update driver.",
            "code" => null
        ]);
    }
