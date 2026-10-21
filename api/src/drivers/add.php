<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $organisation_id = $my_details->organisation_id ?? null;

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
            WHERE licence_number = :licence_number AND organisation_id = :organisation_id
            LIMIT 1
            FOR UPDATE
        ");
        $stmt->execute([
            ":licence_number" => $licence_number,
            ":organisation_id" => $organisation_id
        ]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $id = $existing["id"];

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
                    updated_by = :updated_by,
                    updated_at = NOW()
                WHERE id = :id AND organisation_id = :organisation_id
            ");

            $stmt->execute([
                ":name" => $name,
                ":phone" => $phone,
                ":licence_class" => $licence_class ?: null,
                ":licence_expiry" => $licence_expiry ?: null,
                ":assigned_vehicle" => $assigned_vehicle ?: null,
                ":transporter" => $transporter ?: null,
                ":notes" => $notes ?: null,
                ":updated_by" => $actor,
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
                ) VALUES (:id, :driver_id, :action, :previous_status, :new_status, :actor_id)
            ");

            $stmt->execute([
                ":id" => generateId(),
                ":driver_id" => $id,
                ":action" => "updated_existing_licence",
                ":previous_status" => $existing["status"],
                ":new_status" => $existing["status"],
                ":actor_id" => $actor
            ]);

            $message = "Existing driver found by licence number and updated.";
        } else {
            $id = generateId();

            $stmt = $conn->prepare("
                INSERT INTO gate_drivers (
                    id,
                    organisation_id,
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
                ) VALUES (:id, :organisation_id, :name, :phone, :licence_number, :licence_class, :licence_expiry, :assigned_vehicle, :transporter, :notes, :status, :created_by, :updated_by)
            ");

            $stmt->execute([
                ':id' => $id,
                ':organisation_id' => $organisation_id,
                ':name' => $name,
                ':phone' => $phone,
                ':licence_number' => $licence_number,
                ':licence_class' => $licence_class ?: null,
                ':licence_expiry' => $licence_expiry ?: null,
                ':assigned_vehicle' => $assigned_vehicle ?: null,
                ':transporter' => $transporter ?: null,
                ':notes' => $notes ?: null,
                ':status' => 'Pending review',
                ':created_by' => $actor,
                ':updated_by' => $actor
            ]);

            $stmt = $conn->prepare("
                INSERT INTO gate_driver_action_logs (
                    id,
                    driver_id,
                    action,
                    new_status,
                    actor_id
                ) VALUES (:id, :driver_id, :action, :new_status, :actor_id)
            ");

            $stmt->execute([
                ':id' => generateId(),
                ':driver_id' => $id,
                ':action' => 'created',
                ':new_status' => 'Pending review',
                ':actor_id' => $actor
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