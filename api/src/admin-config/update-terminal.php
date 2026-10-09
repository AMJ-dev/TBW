<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    function terminalConfigString(mixed $value, int $max = 255): string {
        if (!is_string($value) && !is_numeric($value)) {
            return "";
        }

        return mb_substr(trim((string)$value), 0, $max);
    }

    try {
        if ($_SERVER["REQUEST_METHOD"] !== "POST") {
            http_response_code(405);
            echo json_encode(["error" => true, "data" => "Method not allowed", "code" => null]);
            exit;
        }

        $name = terminalConfigString($_POST["terminal_name"] ?? "", 255);
        $code = strtoupper(terminalConfigString($_POST["terminal_code"] ?? "", 80));
        $hours = terminalConfigString($_POST["operating_hours"] ?? "", 100);
        $locations = $_POST["locations"] ?? null;
        $services = $_POST["cargo_services"] ?? null;
        $holds = $_POST["hold_reasons"] ?? null;

        if ($name === "" || $code === "") {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "Terminal name and terminal code are required", "code" => null]);
            exit;
        }

        if (!is_array($locations) || !is_array($services) || !is_array($holds)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "Locations, cargo services, and hold reasons must be submitted as arrays", "code" => null]);
            exit;
        }

        $locationRows = [];
        $locationCodes = [];
        $allowedKinds = ["yard", "warehouse"];
        $allowedStatuses = ["active", "inactive", "maintenance"];
        $allowedUnits = ["TEU", "sqm", "pallets", "positions", "tonnes"];

        foreach ($locations as $item) {
            if (!is_array($item)) {
                http_response_code(422);
                echo json_encode(["error" => true, "data" => "Invalid location entry", "code" => null]);
                exit;
            }

            $locationCode = strtoupper(terminalConfigString($item["code"] ?? "", 80));
            $locationName = terminalConfigString($item["name"] ?? "", 255);
            $kind = terminalConfigString($item["kind"] ?? "yard", 20);
            $status = terminalConfigString($item["status"] ?? "active", 20);
            $unit = terminalConfigString($item["capacity_unit"] ?? "TEU", 20);
            $capacity = $item["capacity"] ?? null;

            if ($locationCode === "" || $locationName === "") {
                http_response_code(422);
                echo json_encode(["error" => true, "data" => "Every location requires a code and name", "code" => null]);
                exit;
            }

            if (!in_array($kind, $allowedKinds, true) || !in_array($status, $allowedStatuses, true) || !in_array($unit, $allowedUnits, true)) {
                http_response_code(422);
                echo json_encode(["error" => true, "data" => "A location contains an invalid type, status, or capacity unit", "code" => null]);
                exit;
            }

            if ($capacity !== null && $capacity !== "" && (!is_numeric($capacity) || (float)$capacity < 0)) {
                http_response_code(422);
                echo json_encode(["error" => true, "data" => "Location capacity must be a non-negative number", "code" => null]);
                exit;
            }

            $locationKey = strtolower($locationCode);

            if (isset($locationCodes[$locationKey])) {
                http_response_code(422);
                echo json_encode(["error" => true, "data" => "Duplicate location code: " . $locationCode, "code" => null]);
                exit;
            }

            $locationCodes[$locationKey] = true;

            $locationRows[] = [
                "code" => $locationCode,
                "name" => $locationName,
                "kind" => $kind,
                "bonded" => filter_var($item["bonded"] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
                "status" => $status,
                "capacity" => $capacity === null || $capacity === "" ? null : (float)$capacity,
                "capacity_unit" => $unit,
                "cargo_types" => terminalConfigString($item["cargo_types"] ?? "", 1000),
                "security" => terminalConfigString($item["security"] ?? "", 1000),
                "equipment" => terminalConfigString($item["equipment"] ?? "", 1000),
                "block_code" => terminalConfigString($item["block"] ?? "", 80),
                "row_code" => terminalConfigString($item["row"] ?? "", 80),
                "slot_code" => terminalConfigString($item["slot"] ?? "", 80),
                "tier_code" => terminalConfigString($item["tier"] ?? "", 80),
                "aisle_code" => terminalConfigString($item["aisle"] ?? "", 80),
                "rack_code" => terminalConfigString($item["rack"] ?? "", 80),
                "bin_code" => terminalConfigString($item["bin"] ?? "", 80)
            ];
        }

        $serviceRows = [];
        $serviceLabels = [];

        foreach ($services as $item) {
            if (!is_array($item)) {
                http_response_code(422);
                echo json_encode(["error" => true, "data" => "Invalid cargo service entry", "code" => null]);
                exit;
            }

            $label = terminalConfigString($item["label"] ?? "", 255);

            if ($label === "") {
                http_response_code(422);
                echo json_encode(["error" => true, "data" => "Every cargo service requires a label", "code" => null]);
                exit;
            }

            $key = mb_strtolower($label);

            if (isset($serviceLabels[$key])) {
                http_response_code(422);
                echo json_encode(["error" => true, "data" => "Duplicate cargo service: " . $label, "code" => null]);
                exit;
            }

            $serviceLabels[$key] = true;
            $serviceRows[] = $label;
        }

        $holdRows = [];
        $holdLabels = [];

        foreach ($holds as $item) {
            if (!is_array($item)) {
                http_response_code(422);
                echo json_encode(["error" => true, "data" => "Invalid hold reason entry", "code" => null]);
                exit;
            }

            $label = terminalConfigString($item["label"] ?? "", 255);

            if ($label === "") {
                http_response_code(422);
                echo json_encode(["error" => true, "data" => "Every hold reason requires a label", "code" => null]);
                exit;
            }

            $key = mb_strtolower($label);

            if (isset($holdLabels[$key])) {
                http_response_code(422);
                echo json_encode(["error" => true, "data" => "Duplicate hold reason: " . $label, "code" => null]);
                exit;
            }

            $holdLabels[$key] = true;
            $holdRows[] = $label;
        }

        $q = $conn->prepare("SELECT terminal_name, terminal_code, operating_hours FROM terminal_configuration WHERE id = 1 LIMIT 1");
        $q->execute();
        $before = $q->fetch(PDO::FETCH_ASSOC) ?: [];

        $q = $conn->prepare("SELECT code, name, kind, bonded, status, capacity, capacity_unit, cargo_types, security, equipment, block_code, row_code, slot_code, tier_code, aisle_code, rack_code, bin_code FROM terminal_locations ORDER BY code");
        $q->execute();
        $before["locations"] = $q->fetchAll(PDO::FETCH_ASSOC);

        $q = $conn->prepare("SELECT label FROM terminal_cargo_services WHERE is_active = 1 ORDER BY label");
        $q->execute();
        $before["cargo_services"] = $q->fetchAll(PDO::FETCH_COLUMN);

        $q = $conn->prepare("SELECT label FROM terminal_hold_reasons WHERE is_active = 1 ORDER BY label");
        $q->execute();
        $before["hold_reasons"] = $q->fetchAll(PDO::FETCH_COLUMN);

        $conn->beginTransaction();

        $q = $conn->prepare("INSERT INTO terminal_configuration (id, terminal_name, terminal_code, operating_hours) VALUES (1, :name, :code, :hours) ON DUPLICATE KEY UPDATE terminal_name = VALUES(terminal_name), terminal_code = VALUES(terminal_code), operating_hours = VALUES(operating_hours)");
        $q->bindValue(":name", $name, PDO::PARAM_STR);
        $q->bindValue(":code", $code, PDO::PARAM_STR);
        $q->bindValue(":hours", $hours, PDO::PARAM_STR);
        $q->execute();

        $q = $conn->prepare("UPDATE terminal_locations SET status = 'inactive'");
        $q->execute();

        foreach ($locationRows as $item) {
            $q = $conn->prepare("SELECT id FROM terminal_locations WHERE code = :code LIMIT 1");
            $q->bindValue(":code", $item["code"], PDO::PARAM_STR);
            $q->execute();
            $existingId = $q->fetchColumn();

            if ($existingId) {
                $q = $conn->prepare("UPDATE terminal_locations SET name = :name, kind = :kind, bonded = :bonded, status = :status, capacity = :capacity, capacity_unit = :capacity_unit, cargo_types = :cargo_types, security = :security, equipment = :equipment, block_code = :block_code, row_code = :row_code, slot_code = :slot_code, tier_code = :tier_code, aisle_code = :aisle_code, rack_code = :rack_code, bin_code = :bin_code WHERE id = :id");
                $q->bindValue(":id", $existingId, PDO::PARAM_STR);
            } else {
                $q = $conn->prepare("INSERT INTO terminal_locations (id, code, name, kind, bonded, status, capacity, capacity_unit, cargo_types, security, equipment, block_code, row_code, slot_code, tier_code, aisle_code, rack_code, bin_code) VALUES (:id, :code, :name, :kind, :bonded, :status, :capacity, :capacity_unit, :cargo_types, :security, :equipment, :block_code, :row_code, :slot_code, :tier_code, :aisle_code, :rack_code, :bin_code)");
                $q->bindValue(":id", generateId(), PDO::PARAM_STR);
                $q->bindValue(":code", $item["code"], PDO::PARAM_STR);
            }

            $q->bindValue(":name", $item["name"], PDO::PARAM_STR);
            $q->bindValue(":kind", $item["kind"], PDO::PARAM_STR);
            $q->bindValue(":bonded", $item["bonded"], PDO::PARAM_INT);
            $q->bindValue(":status", $item["status"], PDO::PARAM_STR);
            $q->bindValue(":capacity", $item["capacity"], $item["capacity"] === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $q->bindValue(":capacity_unit", $item["capacity_unit"], PDO::PARAM_STR);
            $q->bindValue(":cargo_types", $item["cargo_types"], PDO::PARAM_STR);
            $q->bindValue(":security", $item["security"], PDO::PARAM_STR);
            $q->bindValue(":equipment", $item["equipment"], PDO::PARAM_STR);
            $q->bindValue(":block_code", $item["block_code"], PDO::PARAM_STR);
            $q->bindValue(":row_code", $item["row_code"], PDO::PARAM_STR);
            $q->bindValue(":slot_code", $item["slot_code"], PDO::PARAM_STR);
            $q->bindValue(":tier_code", $item["tier_code"], PDO::PARAM_STR);
            $q->bindValue(":aisle_code", $item["aisle_code"], PDO::PARAM_STR);
            $q->bindValue(":rack_code", $item["rack_code"], PDO::PARAM_STR);
            $q->bindValue(":bin_code", $item["bin_code"], PDO::PARAM_STR);
            $q->execute();
        }

        $q = $conn->prepare("UPDATE terminal_cargo_services SET is_active = 0");
        $q->execute();

        foreach ($serviceRows as $label) {
            $q = $conn->prepare("INSERT INTO terminal_cargo_services (id, label, is_active) VALUES (:id, :label, 1) ON DUPLICATE KEY UPDATE is_active = 1");
            $q->bindValue(":id", generateId(), PDO::PARAM_STR);
            $q->bindValue(":label", $label, PDO::PARAM_STR);
            $q->execute();
        }

        $q = $conn->prepare("UPDATE terminal_hold_reasons SET is_active = 0");
        $q->execute();

        foreach ($holdRows as $label) {
            $q = $conn->prepare("INSERT INTO terminal_hold_reasons (id, label, is_active) VALUES (:id, :label, 1) ON DUPLICATE KEY UPDATE is_active = 1");
            $q->bindValue(":id", generateId(), PDO::PARAM_STR);
            $q->bindValue(":label", $label, PDO::PARAM_STR);
            $q->execute();
        }

        $after = [
            "terminal_name" => $name,
            "terminal_code" => $code,
            "operating_hours" => $hours,
            "locations" => $locationRows,
            "cargo_services" => $serviceRows,
            "hold_reasons" => $holdRows
        ];

        $actorId = isset($my_details->id) ? (string)$my_details->id : null;
        $ip = $_SERVER["REMOTE_ADDR"] ?? null;
        $agent = substr((string)($_SERVER["HTTP_USER_AGENT"] ?? ""), 0, 500);

        $q = $conn->prepare("INSERT INTO terminal_configuration_audit (id, actor_id, action, before_data, after_data, ip_address, user_agent) VALUES (:id, :actor_id, 'terminal_configuration_updated', :before_data, :after_data, :ip_address, :user_agent)");
        $q->bindValue(":id", generateId(), PDO::PARAM_STR);
        $q->bindValue(":actor_id", $actorId, $actorId === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $q->bindValue(":before_data", json_encode($before, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), PDO::PARAM_STR);
        $q->bindValue(":after_data", json_encode($after, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), PDO::PARAM_STR);
        $q->bindValue(":ip_address", $ip, $ip === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $q->bindValue(":user_agent", $agent, PDO::PARAM_STR);
        $q->execute();

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Terminal configuration saved successfully",
            "code" => [
                "terminal_name" => $name,
                "terminal_code" => $code,
                "operating_hours" => $hours
            ]
        ]);
    } catch (Throwable $e) {
        if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(500);
        echo json_encode(["error" => true, "data" => "Unable to save terminal configuration", "code" => null]);
    }