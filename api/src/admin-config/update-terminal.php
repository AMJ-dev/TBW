<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed",
        "code" => null
    ]);
    exit;
}

try {
    $terminalName = trim($_POST["terminal_name"] ?? "");
    $terminalCode = trim($_POST["terminal_code"] ?? "");
    $operatingHours = trim($_POST["operating_hours"] ?? "");
    $changeReason = trim($_POST["change_reason"] ?? "");

    if ($terminalName === "" || $terminalCode === "") {
        throw new InvalidArgumentException(
            "Terminal name and terminal code are required."
        );
    }

    if (
        strlen($terminalName) > 255 ||
        strlen($terminalCode) > 80 ||
        strlen($operatingHours) > 100 ||
        strlen($changeReason) > 500
    ) {
        throw new InvalidArgumentException(
            "One or more fields exceed the allowed length."
        );
    }

    $locations = $_POST["locations"] ?? [];
    $services = $_POST["cargo_services"] ?? [];
    $holds = $_POST["hold_reasons"] ?? [];
    $areas = $_POST["operational_areas"] ?? [];

    foreach ([
        "locations" => &$locations,
        "cargo_services" => &$services,
        "hold_reasons" => &$holds,
        "operational_areas" => &$areas
    ] as $key => &$value) {
        if (is_string($value)) {
            $decoded = json_decode($value, true);

            if (
                json_last_error() !== JSON_ERROR_NONE ||
                !is_array($decoded)
            ) {
                throw new InvalidArgumentException(
                    "Invalid " . str_replace("_", " ", $key) . " data."
                );
            }

            $value = $decoded;
        }

        if (!is_array($value)) {
            throw new InvalidArgumentException(
                "Invalid " . str_replace("_", " ", $key) . " data."
            );
        }
    }
    unset($value);

    $allowedKinds = ["yard", "warehouse"];
    $allowedStatuses = ["active", "inactive", "maintenance"];
    $allowedUnits = ["TEU", "sqm", "pallets", "positions", "tonnes"];

    $normalisedLocations = [];
    $locationCodes = [];
    $locationIds = [];

    foreach ($locations as $location) {
        if (!is_array($location)) {
            throw new InvalidArgumentException("Invalid location entry.");
        }

        $id = trim((string) ($location["id"] ?? ""));
        $code = trim((string) ($location["code"] ?? ""));
        $name = trim((string) ($location["name"] ?? ""));
        $kind = $location["kind"] ?? "yard";
        $status = $location["status"] ?? "active";
        $capacityUnit = $location["capacity_unit"] ?? "TEU";
        $capacity = $location["capacity"] ?? null;

        if ($code === "" || $name === "") {
            throw new InvalidArgumentException(
                "Every location needs a code and name."
            );
        }

        if (strlen($code) > 80 || strlen($name) > 255) {
            throw new InvalidArgumentException(
                "Location code or name is too long."
            );
        }

        if (!in_array($kind, $allowedKinds, true)) {
            throw new InvalidArgumentException(
                "Invalid location type for " . $code . "."
            );
        }

        if (!in_array($status, $allowedStatuses, true)) {
            throw new InvalidArgumentException(
                "Invalid status for " . $code . "."
            );
        }

        if (!in_array($capacityUnit, $allowedUnits, true)) {
            throw new InvalidArgumentException(
                "Invalid capacity unit for " . $code . "."
            );
        }

        if (isset($locationCodes[strtolower($code)])) {
            throw new InvalidArgumentException(
                "Duplicate location code: " . $code
            );
        }

        $locationCodes[strtolower($code)] = true;

        if (
            !preg_match(
                '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
                $id
            ) ||
            isset($locationIds[$id])
        ) {
            $id = generateId();
        }

        $locationIds[$id] = true;

        if ($capacity === "" || $capacity === null) {
            $capacity = null;
        } elseif (
            !is_numeric($capacity) ||
            !is_finite((float) $capacity) ||
            (float) $capacity < 0
        ) {
            throw new InvalidArgumentException(
                "Invalid capacity for " . $code . "."
            );
        } else {
            $capacity = (float) $capacity;
        }

        $equipmentItems = $location["equipment"] ?? [];

        if (is_string($equipmentItems)) {
            $decodedEquipment = json_decode($equipmentItems, true);

            if (
                json_last_error() === JSON_ERROR_NONE &&
                is_array($decodedEquipment)
            ) {
                $equipmentItems = $decodedEquipment;
            } else {
                $equipmentItems = $equipmentItems === ""
                    ? []
                    : explode(",", $equipmentItems);
            }
        }

        if (!is_array($equipmentItems)) {
            throw new InvalidArgumentException(
                "Invalid equipment for " . $code . "."
            );
        }

        $equipmentLabels = [];
        $equipmentSeen = [];

        foreach ($equipmentItems as $equipment) {
            if (is_array($equipment)) {
                $label = trim((string) (
                    $equipment["label"] ?? $equipment["name"] ?? ""
                ));
            } elseif (is_string($equipment)) {
                $label = trim($equipment);
            } else {
                throw new InvalidArgumentException(
                    "Invalid equipment entry for " . $code . "."
                );
            }

            if ($label === "" || strlen($label) > 255) {
                throw new InvalidArgumentException(
                    "Equipment names must contain between 1 and 255 characters."
                );
            }

            $equipmentKey = strtolower($label);

            if (isset($equipmentSeen[$equipmentKey])) {
                throw new InvalidArgumentException(
                    "Duplicate equipment on location " . $code . "."
                );
            }

            $equipmentSeen[$equipmentKey] = true;
            $equipmentLabels[] = $label;
        }

        $equipmentString = implode(", ", $equipmentLabels);

        if (strlen($equipmentString) > 1000) {
            throw new InvalidArgumentException(
                "Equipment data is too long for " . $code . "."
            );
        }

        $normalisedLocations[] = [
            "id" => $id,
            "code" => $code,
            "name" => $name,
            "kind" => $kind,
            "bonded" => !empty($location["bonded"]) ? 1 : 0,
            "status" => $status,
            "capacity" => $capacity,
            "capacity_unit" => $capacityUnit,
            "cargo_types" => trim((string) ($location["cargo_types"] ?? "")),
            "security" => trim((string) ($location["security"] ?? "")),
            "equipment" => $equipmentString,
            "zone_code" => trim((string) ($location["zone"] ?? "")),
            "block_code" => trim((string) ($location["block"] ?? "")),
            "row_code" => trim((string) ($location["row"] ?? "")),
            "slot_code" => trim((string) ($location["slot"] ?? "")),
            "tier_code" => trim((string) ($location["tier"] ?? "")),
            "aisle_code" => trim((string) ($location["aisle"] ?? "")),
            "rack_code" => trim((string) ($location["rack"] ?? "")),
            "bin_code" => trim((string) ($location["bin"] ?? ""))
        ];
    }

    foreach ($normalisedLocations as $location) {
        foreach ([
            "cargo_types" => 1000,
            "security" => 1000,
            "zone_code" => 80,
            "block_code" => 80,
            "row_code" => 80,
            "slot_code" => 80,
            "tier_code" => 80,
            "aisle_code" => 80,
            "rack_code" => 80,
            "bin_code" => 80
        ] as $field => $maxLength) {
            if (strlen($location[$field]) > $maxLength) {
                throw new InvalidArgumentException(
                    "A location field exceeds the allowed length."
                );
            }
        }

        if ($location["zone_code"] === "") {
            throw new InvalidArgumentException(
                "Every location needs a zone."
            );
        }
    }

    $normaliseGroup = function ($items, $groupName) {
        $result = [];
        $seen = [];
        $ids = [];

        foreach ($items as $item) {
            if (!is_array($item)) {
                throw new InvalidArgumentException(
                    "Invalid entry in " . $groupName . "."
                );
            }

            $label = trim((string) ($item["label"] ?? ""));

            if ($label === "" || strlen($label) > 255) {
                throw new InvalidArgumentException(
                    "Every entry in " . $groupName . " needs a valid label."
                );
            }

            $labelKey = strtolower($label);

            if (isset($seen[$labelKey])) {
                throw new InvalidArgumentException(
                    "Duplicate entry in " . $groupName . ": " . $label
                );
            }

            $seen[$labelKey] = true;

            $id = trim((string) ($item["id"] ?? ""));

            if (
                !preg_match(
                    '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
                    $id
                ) ||
                isset($ids[$id])
            ) {
                $id = generateId();
            }

            $ids[$id] = true;

            $result[] = [
                "id" => $id,
                "label" => $label
            ];
        }

        return $result;
    };

    $services = $normaliseGroup($services, "cargo services");
    $holds = $normaliseGroup($holds, "hold reasons");
    $areas = $normaliseGroup($areas, "operational areas");

    $conn->beginTransaction();

    $q = $conn->prepare("
        SELECT terminal_name, terminal_code, operating_hours
        FROM terminal_configuration
        WHERE id = 1
        FOR UPDATE
    ");
    $q->execute();
    $beforeTerminal = $q->fetch(PDO::FETCH_ASSOC);

    $q = $conn->query("
        SELECT *
        FROM terminal_locations
        ORDER BY code
    ");
    $beforeLocations = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->query("
        SELECT *
        FROM terminal_cargo_services
        ORDER BY label
    ");
    $beforeServices = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->query("
        SELECT *
        FROM terminal_hold_reasons
        ORDER BY label
    ");
    $beforeHolds = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->query("
        SELECT *
        FROM terminal_operational_areas
        ORDER BY label
    ");
    $beforeAreas = $q->fetchAll(PDO::FETCH_ASSOC);

    $beforeData = json_encode([
        "terminal" => $beforeTerminal,
        "locations" => $beforeLocations,
        "cargo_services" => $beforeServices,
        "hold_reasons" => $beforeHolds,
        "operational_areas" => $beforeAreas,
        "change_reason" => $changeReason
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $q = $conn->prepare("
        INSERT INTO terminal_configuration (
            id, terminal_name, terminal_code, operating_hours
        ) VALUES (
            1, :name, :code, :hours
        )
        ON DUPLICATE KEY UPDATE
            terminal_name = VALUES(terminal_name),
            terminal_code = VALUES(terminal_code),
            operating_hours = VALUES(operating_hours)
    ");

    $q->bindValue(":name", $terminalName, PDO::PARAM_STR);
    $q->bindValue(":code", $terminalCode, PDO::PARAM_STR);
    $q->bindValue(":hours", $operatingHours, PDO::PARAM_STR);
    $q->execute();

    $q = $conn->prepare("
        INSERT INTO terminal_locations (
            id, code, name, kind, bonded, status, capacity,
            capacity_unit, cargo_types, security, equipment,
            zone_code, block_code, row_code, slot_code, tier_code,
            aisle_code, rack_code, bin_code
        ) VALUES (
            :id, :code, :name, :kind, :bonded, :status, :capacity,
            :capacity_unit, :cargo_types, :security, :equipment,
            :zone_code, :block_code, :row_code, :slot_code, :tier_code,
            :aisle_code, :rack_code, :bin_code
        )
        ON DUPLICATE KEY UPDATE
            code = VALUES(code),
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
        $q->bindValue(":id", $location["id"], PDO::PARAM_STR);
        $q->bindValue(":code", $location["code"], PDO::PARAM_STR);
        $q->bindValue(":name", $location["name"], PDO::PARAM_STR);
        $q->bindValue(":kind", $location["kind"], PDO::PARAM_STR);
        $q->bindValue(":bonded", $location["bonded"], PDO::PARAM_INT);
        $q->bindValue(":status", $location["status"], PDO::PARAM_STR);

        if ($location["capacity"] === null) {
            $q->bindValue(":capacity", null, PDO::PARAM_NULL);
        } else {
            $q->bindValue(
                ":capacity",
                (string) $location["capacity"],
                PDO::PARAM_STR
            );
        }

        $q->bindValue(
            ":capacity_unit",
            $location["capacity_unit"],
            PDO::PARAM_STR
        );
        $q->bindValue(
            ":cargo_types",
            $location["cargo_types"],
            PDO::PARAM_STR
        );
        $q->bindValue(":security", $location["security"], PDO::PARAM_STR);
        $q->bindValue(":equipment", $location["equipment"], PDO::PARAM_STR);
        $q->bindValue(":zone_code", $location["zone_code"], PDO::PARAM_STR);
        $q->bindValue(":block_code", $location["block_code"], PDO::PARAM_STR);
        $q->bindValue(":row_code", $location["row_code"], PDO::PARAM_STR);
        $q->bindValue(":slot_code", $location["slot_code"], PDO::PARAM_STR);
        $q->bindValue(":tier_code", $location["tier_code"], PDO::PARAM_STR);
        $q->bindValue(":aisle_code", $location["aisle_code"], PDO::PARAM_STR);
        $q->bindValue(":rack_code", $location["rack_code"], PDO::PARAM_STR);
        $q->bindValue(":bin_code", $location["bin_code"], PDO::PARAM_STR);
        $q->execute();
    }

    $savedLocationIds = array_column($normalisedLocations, "id");

    if ($savedLocationIds) {
        $placeholders = implode(
            ", ",
            array_fill(0, count($savedLocationIds), "?")
        );

        $q = $conn->prepare("
            UPDATE terminal_locations
            SET status = 'inactive'
            WHERE id NOT IN ($placeholders)
        ");

        foreach ($savedLocationIds as $index => $id) {
            $q->bindValue($index + 1, $id, PDO::PARAM_STR);
        }

        $q->execute();
    } else {
        $conn->exec("
            UPDATE terminal_locations
            SET status = 'inactive'
        ");
    }

    foreach ([
        [
            "table" => "terminal_cargo_services",
            "items" => $services
        ],
        [
            "table" => "terminal_hold_reasons",
            "items" => $holds
        ],
        [
            "table" => "terminal_operational_areas",
            "items" => $areas
        ]
    ] as $group) {
        $table = $group["table"];

        $conn->exec("UPDATE `$table` SET is_active = 0");

        $find = $conn->prepare("
            SELECT id
            FROM `$table`
            WHERE id = :id OR label = :label
            LIMIT 1
        ");

        $insert = $conn->prepare("
            INSERT INTO `$table` (id, label, is_active)
            VALUES (:id, :label, 1)
        ");

        $update = $conn->prepare("
            UPDATE `$table`
            SET label = :label, is_active = 1
            WHERE id = :id
        ");

        foreach ($group["items"] as $item) {
            $find->bindValue(":id", $item["id"], PDO::PARAM_STR);
            $find->bindValue(":label", $item["label"], PDO::PARAM_STR);
            $find->execute();

            $existingId = $find->fetchColumn();

            if ($existingId !== false) {
                $update->bindValue(":id", $existingId, PDO::PARAM_STR);
                $update->bindValue(
                    ":label",
                    $item["label"],
                    PDO::PARAM_STR
                );
                $update->execute();
            } else {
                $insert->bindValue(":id", $item["id"], PDO::PARAM_STR);
                $insert->bindValue(
                    ":label",
                    $item["label"],
                    PDO::PARAM_STR
                );
                $insert->execute();
            }
        }
    }

    $q = $conn->query("
        SELECT terminal_name, terminal_code, operating_hours
        FROM terminal_configuration
        WHERE id = 1
    ");
    $afterTerminal = $q->fetch(PDO::FETCH_ASSOC);

    $q = $conn->query("
        SELECT *
        FROM terminal_locations
        ORDER BY code
    ");
    $afterLocations = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->query("
        SELECT *
        FROM terminal_cargo_services
        ORDER BY label
    ");
    $afterServices = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->query("
        SELECT *
        FROM terminal_hold_reasons
        ORDER BY label
    ");
    $afterHolds = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->query("
        SELECT *
        FROM terminal_operational_areas
        ORDER BY label
    ");
    $afterAreas = $q->fetchAll(PDO::FETCH_ASSOC);

    $afterData = json_encode([
        "terminal" => $afterTerminal,
        "locations" => $afterLocations,
        "cargo_services" => $afterServices,
        "hold_reasons" => $afterHolds,
        "operational_areas" => $afterAreas
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $q = $conn->prepare("
        INSERT INTO terminal_configuration_audit (
            id,
            actor_id,
            action,
            before_data,
            after_data,
            ip_address,
            user_agent
        ) VALUES (
            :id,
            :actor_id,
            :action,
            :before_data,
            :after_data,
            :ip_address,
            :user_agent
        )
    ");

    $q->bindValue(":id", generateId(), PDO::PARAM_STR);
    $q->bindValue(":actor_id", (string) $my_details->id, PDO::PARAM_STR);
    $q->bindValue(
        ":action",
        "terminal_configuration_updated",
        PDO::PARAM_STR
    );
    $q->bindValue(":before_data", $beforeData, PDO::PARAM_STR);
    $q->bindValue(":after_data", $afterData, PDO::PARAM_STR);

    $ipAddress = $_SERVER["REMOTE_ADDR"] ?? null;

    if ($ipAddress === null) {
        $q->bindValue(":ip_address", null, PDO::PARAM_NULL);
    } else {
        $q->bindValue(":ip_address", $ipAddress, PDO::PARAM_STR);
    }

    $q->bindValue(
        ":user_agent",
        substr($_SERVER["HTTP_USER_AGENT"] ?? "", 0, 500),
        PDO::PARAM_STR
    );
    $q->execute();

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
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(422);
    echo json_encode([
        "error" => true,
        "data" => $e->getMessage(),
        "code" => null
    ]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => $e->getMessage(),
        "code" => null
    ]);
}