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

    try {
        $actor = $my_details->id ?? null;

        $conn->beginTransaction();

        $stmt = $conn->prepare("SELECT id, status FROM gate_drivers WHERE id = :id AND organisation_id=:organisation_id LIMIT 1 FOR UPDATE");
        $stmt->execute([":id" => $id, ":organisation_id" => $organisation_id]);
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

        $stmt = $conn->prepare("SELECT id, status FROM gate_drivers WHERE licence_number = :licence_number AND organisation_id=:organisation_id AND id <> :id LIMIT 1 FOR UPDATE");
        $stmt->execute([":licence_number" => $licence_number, ":organisation_id" => $organisation_id, ":id" => $id]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $existing_id = $existing["id"];

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
                    updated_by = :actor
                WHERE id = :existing_id
            ");

            $stmt->execute([
                ":name" => $name,
                ":phone" => $phone,
                ":licence_class" => $licence_class ?: null,
                ":licence_expiry" => $licence_expiry ?: null,
                ":assigned_vehicle" => $assigned_vehicle ?: null,
                ":transporter" => $transporter ?: null,
                ":notes" => $notes ?: null,
                ":actor" => $actor,
                ":existing_id" => $existing_id
            ]);

            $stmt = $conn->prepare("INSERT INTO gate_driver_action_logs (id, driver_id, action, previous_status, new_status, actor_id) VALUES (:id, :driver_id, 'updated_existing_licence', :previous_status, :new_status, :actor_id)");

            $stmt->execute([
                ":id" => generateId(),
                ":driver_id" => $existing_id,
                ":previous_status" => $existing["status"],
                ":new_status" => $existing["status"],
                ":actor_id" => $actor
            ]);

            $conn->commit();

            echo json_encode([
                "error" => false,
                "data" => "Licence already exists. The existing driver record was updated.",
                "code" => [
                    "id" => $existing_id,
                    "existing" => true
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
                updated_by = :actor
            WHERE id = :id
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
            ":actor" => $actor,
            ":id" => $id
        ]);

        $stmt = $conn->prepare("INSERT INTO gate_driver_action_logs (id, driver_id, action, previous_status, new_status, actor_id) VALUES (:id, :driver_id, 'updated', :previous_status, :new_status, :actor_id)");

        $stmt->execute([
            ":id" => generateId(),
            ":driver_id" => $id,
            ":previous_status" => $driver["status"],
            ":new_status" => $driver["status"],
            ":actor_id" => $actor
        ]);

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Driver updated successfully.",
            "code" => [
                "id" => $id,
                "existing" => false
            ]
        ]);
    } catch (PDOException $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
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

        echo json_encode([
            "error" => true,
            "data" => "Could not update driver.",
            "code" => null
        ]);
    }