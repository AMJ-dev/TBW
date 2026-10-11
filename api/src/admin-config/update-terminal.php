<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => true, "data" => "Method not allowed", "code" => null]);
    exit;
}

try {
    $terminalName = trim($_POST["terminal_name"] ?? "");
    $terminalCode = strtoupper(trim($_POST["terminal_code"] ?? ""));
    $operatingHours = trim($_POST["operating_hours"] ?? "");
    $changeReason = trim($_POST["change_reason"] ?? "");

    if ($terminalName === "" || $terminalCode === "") {
        throw new InvalidArgumentException("Terminal name and terminal code are required.");
    }

    if (
        strlen($terminalName) > 255 ||
        strlen($terminalCode) > 80 ||
        strlen($operatingHours) > 100 ||
        strlen($changeReason) > 500
    ) {
        throw new InvalidArgumentException("One or more fields exceed the allowed length.");
    }

    $readArray = function ($key) {
        $value = $_POST[$key] ?? [];

        if (is_string($value)) {
            $value = json_decode($value, true);

            if (json_last_error() !== JSON_ERROR_NONE || !is_array($value)) {
                throw new InvalidArgumentException("Invalid " . str_replace("_", " ", $key) . " data.");
            }
        }

        if (!is_array($value)) {
            throw new InvalidArgumentException("Invalid " . str_replace("_", " ", $key) . " data.");
        }

        return $value;
    };

    $locations = $readArray("locations");
    $services = $readArray("cargo_services");
    $holds = $readArray("hold_reasons");
    $areas = $readArray("operational_areas");
    $categories = $readArray("cargo_categories");
    $packagingTypes = $readArray("packaging_types");

    $normaliseGroup = function ($items, $groupName) {
        $result = [];
        $seen = [];

        foreach ($items as $item) {
            if (!is_array($item)) {
                throw new InvalidArgumentException("Invalid entry in " . $groupName . ".");
            }

            $label = trim((string) ($item["label"] ?? ""));

            if ($label === "" || strlen($label) > 255) {
                throw new InvalidArgumentException("Every entry in " . $groupName . " needs a valid label.");
            }

            $key = mb_strtolower($label);

            if (isset($seen[$key])) {
                throw new InvalidArgumentException("Duplicate entry in " . $groupName . ": " . $label);
            }

            $seen[$key] = true;
            $id = trim((string) ($item["id"] ?? ""));

            if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $id)) {
                $id = generateId();
            }

            $result[] = ["id" => $id, "label" => $label];
        }

        return $result;
    };

    $services = $normaliseGroup($services, "cargo services");
    $holds = $normaliseGroup($holds, "hold reasons");
    $areas = $normaliseGroup($areas, "operational areas");
    $categories = $normaliseGroup($categories, "cargo categories");
    $packagingTypes = $normaliseGroup($packagingTypes, "packaging types");

    $allowedKinds = ["yard", "warehouse"];
    $allowedStatuses = ["active", "inactive", "maintenance"];
    $allowedUnits = ["TEU", "sqm", "pallets", "positions", "tonnes"];
    $normalisedLocations = [];
    $locationCodes = [];

    foreach ($locations as $location) {
        if (!is_array($location)) {
            throw new InvalidArgumentException("Invalid location entry.");
        }

        $code = strtoupper(trim((string) ($location["code"] ?? "")));
        $name = trim((string) ($location["name"] ?? ""));
        $kind = $location["kind"] ?? "yard";
        $status = $location["status"] ?? "active";
        $capacityUnit = $location["capacity_unit"] ?? "TEU";
        $capacity = $location["capacity"] ?? null;

        if ($code === "" || $name === "") {
            throw new InvalidArgumentException("Every location needs a code and name.");
        }

        if (strlen($code) > 80 || strlen($name) > 255) {
            throw new InvalidArgumentException("Location code or name is too long.");
        }

        if (!in_array($kind, $allowedKinds, true) ||
            !in_array($status, $allowedStatuses, true) ||
            !in_array($capacityUnit, $allowedUnits, true)) {
            throw new InvalidArgumentException("Invalid type, status, or capacity unit for location " . $code . ".");
        }

        if (isset($locationCodes[strtolower($code)])) {
            throw new InvalidArgumentException("Duplicate location code: " . $code);
        }

        $locationCodes[strtolower($code)] = true;

        if ($capacity === "" || $capacity === null) {
            $capacity = null;
        } elseif (!is_numeric($capacity) || !is_finite((float) $capacity) || (float) $capacity < 0) {
            throw new InvalidArgumentException("Invalid capacity for location " . $code . ".");
        } else {
            $capacity = (float) $capacity;
        }

        $equipment = $location["equipment"] ?? [];

        if (is_string($equipment)) {
            $decoded = json_decode($equipment, true);
            $equipment = is_array($decoded) ? $decoded : ($equipment === "" ? [] : explode(",", $equipment));
        }

        if (!is_array($equipment)) {
            throw new InvalidArgumentException("Invalid equipment for location " . $code . ".");
        }

        $equipmentLabels = [];

        foreach ($equipment as $item) {
            $label = is_array($item)
                ? trim((string) ($item["label"] ?? $item["name"] ?? ""))
                : trim((string) $item);

            if ($label !== "") {
                if (strlen($label) > 255) {
                    throw new InvalidArgumentException("Equipment names cannot exceed 255 characters.");
                }

                $equipmentLabels[mb_strtolower($label)] = $label;
            }
        }

        $equipmentString = implode(", ", array_values($equipmentLabels));

        if (strlen($equipmentString) > 1000) {
            throw new InvalidArgumentException("Equipment data is too long for location " . $code . ".");
        }

        $fields = [
            "cargo_types" => trim((string) ($location["cargo_types"] ?? "")),
            "security" => trim((string) ($location["security"] ?? "")),
            "zone_code" => trim((string) ($location["zone"] ?? "")),
            "block_code" => trim((string) ($location["block"] ?? "")),
            "row_code" => trim((string) ($location["row"] ?? "")),
            "slot_code" => trim((string) ($location["slot"] ?? "")),
            "tier_code" => trim((string) ($location["tier"] ?? "")),
            "aisle_code" => trim((string) ($location["aisle"] ?? "")),
            "rack_code" => trim((string) ($location["rack"] ?? "")),
            "bin_code" => trim((string) ($location["bin"] ?? ""))
        ];

        foreach ($fields as $field => $value) {
            $limit = in_array($field, ["cargo_types", "security"], true) ? 1000 : 80;

            if (strlen($value) > $limit) {
                throw new InvalidArgumentException("A location field exceeds the allowed length.");
            }
        }

        if ($fields["zone_code"] === "") {
            throw new InvalidArgumentException("Every location needs a zone.");
        }

        $id = trim((string) ($location["id"] ?? ""));

        if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $id)) {
            $id = generateId();
        }

        $normalisedLocations[] = array_merge([
            "id" => $id,
            "code" => $code,
            "name" => $name,
            "kind" => $kind,
            "bonded" => !empty($location["bonded"]) ? 1 : 0,
            "status" => $status,
            "capacity" => $capacity,
            "capacity_unit" => $capacityUnit,
            "equipment" => $equipmentString
        ], $fields);
    }

    $conn->beginTransaction();

    $q = $conn->query("SELECT * FROM terminal_configuration WHERE id = 1");
    $beforeTerminal = $q->fetch(PDO::FETCH_ASSOC);

    $before = ["terminal" => $beforeTerminal];

    foreach ([
        "locations" => "terminal_locations",
        "cargo_services" => "terminal_cargo_services",
        "hold_reasons" => "terminal_hold_reasons",
        "operational_areas" => "terminal_operational_areas",
        "cargo_categories" => "terminal_cargo_categories",
        "packaging_types" => "terminal_packaging_types"
    ] as $key => $table) {
        $q = $conn->query("SELECT * FROM `$table` ORDER BY id");
        $before[$key] = $q->fetchAll(PDO::FETCH_ASSOC);
    }

    $q = $conn->prepare("
        INSERT INTO terminal_configuration (id, terminal_name, terminal_code, operating_hours)
        VALUES (1, :name, :code, :hours)
        ON DUPLICATE KEY UPDATE
            terminal_name = VALUES(terminal_name),
            terminal_code = VALUES(terminal_code),
            operating_hours = VALUES(operating_hours)
    ");
    $q->execute([
        ":name" => $terminalName,
        ":code" => $terminalCode,
        ":hours" => $operatingHours
    ]);

    $q = $conn->prepare("
        INSERT INTO terminal_locations (
            id, code, name, kind, bonded, status, capacity, capacity_unit,
            cargo_types, security, equipment, zone_code, block_code,
            row_code, slot_code, tier_code, aisle_code, rack_code, bin_code
        ) VALUES (
            :id, :code, :name, :kind, :bonded, :status, :capacity, :capacity_unit,
            :cargo_types, :security, :equipment, :zone_code, :block_code,
            :row_code, :slot_code, :tier_code, :aisle_code, :rack_code, :bin_code
        )
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            kind = VALUES(kind),
            bonded = VALUES(bonded),
            status = VALUES(status),
            capacity = VALUES(capacity),
            capacity_unit = VALUES(capacity_unit),
            cargo_types = VALUES(cargo_types),
            security = VALUES(security),
            equipment = VALUES(equipment),
            zone_code = VALUES(zone_code),
            block_code = VALUES(block_code),
            row_code = VALUES(row_code),
            slot_code = VALUES(slot_code),
            tier_code = VALUES(tier_code),
            aisle_code = VALUES(aisle_code),
            rack_code = VALUES(rack_code),
            bin_code = VALUES(bin_code)
    ");

    foreach ($normalisedLocations as $location) {
        foreach ($location as $key => $value) {
            $q->bindValue(":" . $key, $value, $value === null ? PDO::PARAM_NULL : (is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR));
        }
        $q->execute();
    }

    $savedCodes = array_column($normalisedLocations, "code");

    if ($savedCodes) {
        $placeholders = implode(",", array_fill(0, count($savedCodes), "?"));
        $q = $conn->prepare("UPDATE terminal_locations SET status = 'inactive' WHERE code NOT IN ($placeholders)");
        $q->execute($savedCodes);
    } else {
        $conn->exec("UPDATE terminal_locations SET status = 'inactive'");
    }

    foreach ([
        "terminal_cargo_services" => $services,
        "terminal_hold_reasons" => $holds,
        "terminal_operational_areas" => $areas,
        "terminal_cargo_categories" => $categories,
        "terminal_packaging_types" => $packagingTypes
    ] as $table => $items) {
        $conn->exec("UPDATE `$table` SET is_active = 0");

        $find = $conn->prepare("SELECT id FROM `$table` WHERE id = :id OR label = :label LIMIT 1");
        $insert = $conn->prepare("INSERT INTO `$table` (id, label, is_active) VALUES (:id, :label, 1)");
        $update = $conn->prepare("UPDATE `$table` SET label = :label, is_active = 1 WHERE id = :id");

        foreach ($items as $item) {
            $find->execute([
                ":id" => $item["id"],
                ":label" => $item["label"]
            ]);

            $existingId = $find->fetchColumn();

            if ($existingId !== false) {
                $update->execute([
                    ":id" => $existingId,
                    ":label" => $item["label"]
                ]);
            } else {
                $insert->execute([
                    ":id" => $item["id"],
                    ":label" => $item["label"]
                ]);
            }
        }
    }

    $q = $conn->query("SELECT * FROM terminal_configuration WHERE id = 1");
    $after = ["terminal" => $q->fetch(PDO::FETCH_ASSOC)];

    foreach ([
        "locations" => "terminal_locations",
        "cargo_services" => "terminal_cargo_services",
        "hold_reasons" => "terminal_hold_reasons",
        "operational_areas" => "terminal_operational_areas",
        "cargo_categories" => "terminal_cargo_categories",
        "packaging_types" => "terminal_packaging_types"
    ] as $key => $table) {
        $q = $conn->query("SELECT * FROM `$table` ORDER BY id");
        $after[$key] = $q->fetchAll(PDO::FETCH_ASSOC);
    }

    $q = $conn->prepare("
        INSERT INTO terminal_configuration_audit (
            id, actor_id, action, before_data, after_data, ip_address, user_agent
        ) VALUES (
            :id, :actor_id, :action, :before_data, :after_data, :ip_address, :user_agent
        )
    ");

    $q->execute([
        ":id" => generateId(),
        ":actor_id" => (string) $my_details->id,
        ":action" => "terminal_configuration_updated",
        ":before_data" => json_encode([
            "configuration" => $before,
            "change_reason" => $changeReason
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ":after_data" => json_encode($after, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ":ip_address" => $_SERVER["REMOTE_ADDR"] ?? null,
        ":user_agent" => substr($_SERVER["HTTP_USER_AGENT"] ?? "", 0, 500)
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Terminal configuration updated successfully",
        "code" => [
            "terminal_name" => $terminalName,
            "terminal_code" => $terminalCode,
            "operating_hours" => $operatingHours
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (InvalidArgumentException $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(422);
    echo json_encode([
        "error" => true,
        "data" => $e->getMessage(),
        "code" => null
    ]);
} catch (Throwable $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Unable to update terminal configuration",
        "code" => null
    ]);
}