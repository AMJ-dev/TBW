<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json");

try {
    $id = trim($_POST["id"] ?? "");
    $equipment_name = trim($_POST["equipment_name"] ?? "");
    $equipment_code = strtoupper(trim($_POST["equipment_code"] ?? ""));
    $equipment_type = strtoupper(trim($_POST["equipment_type"] ?? ""));
    $registration_number = strtoupper(trim($_POST["registration_number"] ?? ""));
    $capacity = $_POST["capacity"] ?? null;
    $capacity_unit = strtoupper(trim($_POST["capacity_unit"] ?? "TONNES"));
    $operational_status = strtoupper(trim($_POST["operational_status"] ?? "AVAILABLE"));
    $description = trim($_POST["description"] ?? "");
    $is_active = isset($_POST["is_active"]) ? (int) $_POST["is_active"] : 1;

    $equipment_types = [
        "REACH_STACKER",
        "FORKLIFT",
        "TERMINAL_TRACTOR",
        "MOBILE_CRANE",
        "GANTRY_CRANE",
        "TRUCK",
        "TRAILER",
        "OTHER"
    ];

    $operational_statuses = [
        "AVAILABLE",
        "IN_USE",
        "MAINTENANCE",
        "OUT_OF_SERVICE"
    ];

    $capacity_units = [
        "TONNES",
        "KG",
        "TEU",
        "CONTAINERS",
        "PALLETS",
        "TRIPS"
    ];

    if (
        $equipment_name === "" ||
        $equipment_code === "" ||
        $equipment_type === ""
    ) {
        echo json_encode([
            "error" => true,
            "data" => "Equipment name, equipment code and equipment type are required.",
            "code" => null
        ]);
        exit;
    }

    if (!preg_match('/^[A-Z0-9][A-Z0-9_-]*$/', $equipment_code)) {
        echo json_encode([
            "error" => true,
            "data" => "Invalid equipment code.",
            "code" => null
        ]);
        exit;
    }

    if (!in_array($equipment_type, $equipment_types, true)) {
        echo json_encode([
            "error" => true,
            "data" => "Invalid equipment type.",
            "code" => null
        ]);
        exit;
    }

    if (!in_array($operational_status, $operational_statuses, true)) {
        echo json_encode([
            "error" => true,
            "data" => "Invalid operational status.",
            "code" => null
        ]);
        exit;
    }

    if (!in_array($capacity_unit, $capacity_units, true)) {
        echo json_encode([
            "error" => true,
            "data" => "Invalid capacity unit.",
            "code" => null
        ]);
        exit;
    }

    if ($capacity === "" || $capacity === null) {
        $capacity = null;
    } elseif (
        !is_numeric($capacity) ||
        !is_finite((float) $capacity) ||
        (float) $capacity < 0
    ) {
        echo json_encode([
            "error" => true,
            "data" => "Capacity must be a valid non-negative number.",
            "code" => null
        ]);
        exit;
    } else {
        $capacity = (string) (float) $capacity;
    }

    if (!in_array($is_active, [0, 1], true)) {
        echo json_encode([
            "error" => true,
            "data" => "Invalid equipment active status.",
            "code" => null
        ]);
        exit;
    }

    $is_new = $id === "";

    if ($is_new) {
        $id = generateId();
    }

    $duplicate = $conn->prepare("
        SELECT id
        FROM terminal_equipment
        WHERE equipment_code = :equipment_code
        AND id <> :id
        LIMIT 1
    ");

    $duplicate->bindValue(":equipment_code", $equipment_code, PDO::PARAM_STR);
    $duplicate->bindValue(":id", $id, PDO::PARAM_STR);
    $duplicate->execute();

    if ($duplicate->fetch(PDO::FETCH_ASSOC)) {
        echo json_encode([
            "error" => true,
            "data" => "An equipment record with this code already exists.",
            "code" => null
        ]);
        exit;
    }

    if (!$is_new) {
        $check = $conn->prepare("
            SELECT id
            FROM terminal_equipment
            WHERE id = :id
            LIMIT 1
        ");

        $check->bindValue(":id", $id, PDO::PARAM_STR);
        $check->execute();

        if (!$check->fetch(PDO::FETCH_ASSOC)) {
            echo json_encode([
                "error" => true,
                "data" => "Equipment record not found.",
                "code" => null
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            UPDATE terminal_equipment SET
                equipment_name = :equipment_name,
                equipment_code = :equipment_code,
                equipment_type = :equipment_type,
                registration_number = :registration_number,
                capacity = :capacity,
                capacity_unit = :capacity_unit,
                operational_status = :operational_status,
                description = :description,
                is_active = :is_active,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ");

        $stmt->bindValue(":equipment_name", $equipment_name, PDO::PARAM_STR);
        $stmt->bindValue(":equipment_code", $equipment_code, PDO::PARAM_STR);
        $stmt->bindValue(":equipment_type", $equipment_type, PDO::PARAM_STR);

        $stmt->bindValue(
            ":registration_number",
            $registration_number !== "" ? $registration_number : null,
            $registration_number !== "" ? PDO::PARAM_STR : PDO::PARAM_NULL
        );

        $stmt->bindValue(
            ":capacity",
            $capacity,
            $capacity === null ? PDO::PARAM_NULL : PDO::PARAM_STR
        );

        $stmt->bindValue(":capacity_unit", $capacity_unit, PDO::PARAM_STR);
        $stmt->bindValue(":operational_status", $operational_status, PDO::PARAM_STR);

        $stmt->bindValue(
            ":description",
            $description !== "" ? $description : null,
            $description !== "" ? PDO::PARAM_STR : PDO::PARAM_NULL
        );

        $stmt->bindValue(":is_active", $is_active, PDO::PARAM_INT);
        $stmt->bindValue(":id", $id, PDO::PARAM_STR);

        $stmt->execute();

        $message = "Equipment updated successfully.";

    } else {
        $stmt = $conn->prepare("
            INSERT INTO terminal_equipment (
                id,
                equipment_name,
                equipment_code,
                equipment_type,
                registration_number,
                capacity,
                capacity_unit,
                operational_status,
                description,
                is_active
            ) VALUES (
                :id,
                :equipment_name,
                :equipment_code,
                :equipment_type,
                :registration_number,
                :capacity,
                :capacity_unit,
                :operational_status,
                :description,
                :is_active
            )
        ");

        $stmt->bindValue(":id", $id, PDO::PARAM_STR);
        $stmt->bindValue(":equipment_name", $equipment_name, PDO::PARAM_STR);
        $stmt->bindValue(":equipment_code", $equipment_code, PDO::PARAM_STR);
        $stmt->bindValue(":equipment_type", $equipment_type, PDO::PARAM_STR);

        $stmt->bindValue(
            ":registration_number",
            $registration_number !== "" ? $registration_number : null,
            $registration_number !== "" ? PDO::PARAM_STR : PDO::PARAM_NULL
        );

        $stmt->bindValue(
            ":capacity",
            $capacity,
            $capacity === null ? PDO::PARAM_NULL : PDO::PARAM_STR
        );

        $stmt->bindValue(":capacity_unit", $capacity_unit, PDO::PARAM_STR);
        $stmt->bindValue(":operational_status", $operational_status, PDO::PARAM_STR);

        $stmt->bindValue(
            ":description",
            $description !== "" ? $description : null,
            $description !== "" ? PDO::PARAM_STR : PDO::PARAM_NULL
        );

        $stmt->bindValue(":is_active", $is_active, PDO::PARAM_INT);

        $stmt->execute();

        $message = "Equipment registered successfully.";
    }

    $fetch = $conn->prepare("
        SELECT
            id,
            equipment_name,
            equipment_code,
            equipment_type,
            registration_number,
            capacity,
            capacity_unit,
            operational_status,
            description,
            is_active,
            created_at,
            updated_at
        FROM terminal_equipment
        WHERE id = :id
        LIMIT 1
    ");

    $fetch->bindValue(":id", $id, PDO::PARAM_STR);
    $fetch->execute();

    $saved_equipment = $fetch->fetch(PDO::FETCH_ASSOC);

    if ($saved_equipment) {
        $saved_equipment["capacity"] = $saved_equipment["capacity"] !== null
            ? (float) $saved_equipment["capacity"]
            : null;

        $saved_equipment["is_active"] = (bool) $saved_equipment["is_active"];
    }

    echo json_encode([
        "error" => false,
        "data" => $message,
        "code" => $saved_equipment
    ]);

} catch (Throwable $e) {
    echo json_encode([
        "error" => true,
        "data" => "Could not save equipment.",
        "code" => null
    ]);
}