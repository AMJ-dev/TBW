<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=utf-8");

try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed.",
            "code" => null
        ]);
        exit;
    }

    $id = trim($_POST["id"] ?? "");
    $name = trim($_POST["location_name"] ?? $_POST["name"] ?? "");
    $code = strtoupper(trim($_POST["location_code"] ?? $_POST["code"] ?? ""));
    $type = strtoupper(trim($_POST["location_type"] ?? $_POST["kind"] ?? "YARD"));
    $parentLocationId = trim($_POST["parent_location_id"] ?? "") ?: null;
    $description = trim($_POST["description"] ?? "");
    $capacityInput = $_POST["capacity"] ?? "";
    $bonded = filter_var($_POST["bonded"] ?? true, FILTER_VALIDATE_BOOLEAN);
    $statusInput = strtolower(trim($_POST["status"] ?? ""));
    $isActiveInput = $_POST["is_active"] ?? null;
    $changeReason = trim($_POST["change_reason"] ?? "");

    $cargoTypes = trim($_POST["cargo_types"] ?? "");
    $security = trim($_POST["security"] ?? "");
    $equipment = trim($_POST["equipment"] ?? "");

    $zoneCode = trim($_POST["zone_code"] ?? "");
    $blockCode = trim($_POST["block_code"] ?? "");
    $rowCode = trim($_POST["row_code"] ?? "");
    $slotCode = trim($_POST["slot_code"] ?? "");
    $tierCode = trim($_POST["tier_code"] ?? "");
    $aisleCode = trim($_POST["aisle_code"] ?? "");
    $rackCode = trim($_POST["rack_code"] ?? "");
    $binCode = trim($_POST["bin_code"] ?? "");

    if ($name === "" || $code === "") {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Location name and location code are required.",
            "code" => null
        ]);
        exit;
    }

    if (strlen($name) > 255 || strlen($code) > 80 || strlen($description) > 1000) {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Location name, code or description exceeds the permitted length.",
            "code" => null
        ]);
        exit;
    }

    if (!preg_match('/^[A-Z0-9_-]+$/', $code)) {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Location code may contain only letters, numbers, hyphens and underscores.",
            "code" => null
        ]);
        exit;
    }

    $kindMap = [
        "TERMINAL" => "terminal",
        "RECEIVING_AREA" => "receiving_area",
        "YARD" => "yard",
        "BLOCK" => "block",
        "SLOT" => "slot",
        "WAREHOUSE" => "warehouse",
        "WAREHOUSE_ZONE" => "warehouse_zone",
        "INSPECTION_BAY" => "inspection_bay",
        "DISCREPANCY_HOLDING_AREA" => "discrepancy_holding_area",
        "OTHER" => "other",
        "yard" => "yard",
        "warehouse" => "warehouse"
    ];

    if (!isset($kindMap[$type])) {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Invalid location type.",
            "code" => null
        ]);
        exit;
    }

    $kind = $kindMap[$type];

    if ($capacityInput === "" || $capacityInput === null) {
        $capacity = null;
    } elseif (!is_numeric($capacityInput) || (float) $capacityInput < 0) {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Capacity (TEU) must be a non-negative number.",
            "code" => null
        ]);
        exit;
    } else {
        $capacity = (float) $capacityInput;
    }

    if ($statusInput !== "") {
        if (!in_array($statusInput, ["active", "inactive", "maintenance"], true)) {
            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "Invalid location status.",
                "code" => null
            ]);
            exit;
        }
        $status = $statusInput;
    } elseif ($isActiveInput !== null) {
        $status = filter_var($isActiveInput, FILTER_VALIDATE_BOOLEAN) ? "active" : "inactive";
    } else {
        $status = "active";
    }

    if ($id !== "" && ($changeReason === "" || strlen($changeReason) > 500)) {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "A change reason of 1 to 500 characters is required.",
            "code" => null
        ]);
        exit;
    }

    if (
        strlen($cargoTypes) > 1000 ||
        strlen($security) > 1000 ||
        strlen($equipment) > 1000
    ) {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Cargo types, security and equipment values cannot exceed 1000 characters.",
            "code" => null
        ]);
        exit;
    }

    if ($parentLocationId !== null) {
        if ($parentLocationId === $id) {
            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "A location cannot be its own parent.",
                "code" => null
            ]);
            exit;
        }

        $parentQuery = $conn->prepare("SELECT id FROM terminal_locations WHERE id = :id LIMIT 1");
        $parentQuery->execute([":id" => $parentLocationId]);

        if (!$parentQuery->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "The selected parent location does not exist.",
                "code" => null
            ]);
            exit;
        }
    }

    $duplicateQuery = $conn->prepare("
        SELECT id
        FROM terminal_locations
        WHERE code = :code
          AND id <> :id
        LIMIT 1
    ");
    $duplicateQuery->execute([
        ":code" => $code,
        ":id" => $id
    ]);

    if ($duplicateQuery->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(409);
        echo json_encode([
            "error" => true,
            "data" => "A location with this code already exists.",
            "code" => null
        ]);
        exit;
    }

    if ($id !== "") {
        $existsQuery = $conn->prepare("SELECT id FROM terminal_locations WHERE id = :id LIMIT 1");
        $existsQuery->execute([":id" => $id]);

        if (!$existsQuery->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(404);
            echo json_encode([
                "error" => true,
                "data" => "Location not found.",
                "code" => null
            ]);
            exit;
        }

        $query = $conn->prepare("
            UPDATE terminal_locations
            SET
                parent_location_id = :parent_location_id,
                code = :code,
                name = :name,
                description = :description,
                change_reason = :change_reason,
                kind = :kind,
                bonded = :bonded,
                status = :status,
                capacity = :capacity,
                capacity_unit = 'TEU',
                cargo_types = :cargo_types,
                security = :security,
                equipment = :equipment,
                zone_code = :zone_code,
                block_code = :block_code,
                row_code = :row_code,
                slot_code = :slot_code,
                tier_code = :tier_code,
                aisle_code = :aisle_code,
                rack_code = :rack_code,
                bin_code = :bin_code
            WHERE id = :id
        ");

        $query->execute([
            ":parent_location_id" => $parentLocationId,
            ":code" => $code,
            ":name" => $name,
            ":description" => $description,
            ":change_reason" => $changeReason !== "" ? $changeReason : null,
            ":kind" => $kind,
            ":bonded" => $bonded ? 1 : 0,
            ":status" => $status,
            ":capacity" => $capacity,
            ":cargo_types" => $cargoTypes,
            ":security" => $security,
            ":equipment" => $equipment,
            ":zone_code" => $zoneCode,
            ":block_code" => $blockCode,
            ":row_code" => $rowCode,
            ":slot_code" => $slotCode,
            ":tier_code" => $tierCode,
            ":aisle_code" => $aisleCode,
            ":rack_code" => $rackCode,
            ":bin_code" => $binCode,
            ":id" => $id
        ]);

        echo json_encode([
            "error" => false,
            "data" => "Location updated successfully.",
            "code" => [
                "id" => $id,
                "location_code" => $code
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $id = generateId();

    $query = $conn->prepare("
        INSERT INTO terminal_locations (
            id,
            parent_location_id,
            code,
            name,
            description,
            change_reason,
            kind,
            bonded,
            status,
            capacity,
            capacity_unit,
            cargo_types,
            security,
            equipment,
            zone_code,
            block_code,
            row_code,
            slot_code,
            tier_code,
            aisle_code,
            rack_code,
            bin_code
        ) VALUES (
            :id,
            :parent_location_id,
            :code,
            :name,
            :description,
            :change_reason,
            :kind,
            :bonded,
            :status,
            :capacity,
            'TEU',
            :cargo_types,
            :security,
            :equipment,
            :zone_code,
            :block_code,
            :row_code,
            :slot_code,
            :tier_code,
            :aisle_code,
            :rack_code,
            :bin_code
        )
    ");

    $query->execute([
        ":id" => $id,
        ":parent_location_id" => $parentLocationId,
        ":code" => $code,
        ":name" => $name,
        ":description" => $description,
        ":change_reason" => $changeReason !== "" ? $changeReason : null,
        ":kind" => $kind,
        ":bonded" => $bonded ? 1 : 0,
        ":status" => $status,
        ":capacity" => $capacity,
        ":cargo_types" => $cargoTypes,
        ":security" => $security,
        ":equipment" => $equipment,
        ":zone_code" => $zoneCode,
        ":block_code" => $blockCode,
        ":row_code" => $rowCode,
        ":slot_code" => $slotCode,
        ":tier_code" => $tierCode,
        ":aisle_code" => $aisleCode,
        ":rack_code" => $rackCode,
        ":bin_code" => $binCode
    ]);

    echo json_encode([
        "error" => false,
        "data" => "Location created successfully.",
        "code" => [
            "id" => $id,
            "location_code" => $code
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not save the location. Check the supplied values and database constraints.",
        "code" => null
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "An unexpected error occurred while saving the location.",
        "code" => null
    ]);
}
