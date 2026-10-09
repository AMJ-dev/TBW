<?php
    require_once __DIR__ . '/include/conn.php';

    try {
        $conn->beginTransaction();

        $q = $conn->prepare("INSERT INTO terminal_configuration (id, terminal_name, terminal_code, operating_hours) VALUES (1, :name, :code, :hours) ON DUPLICATE KEY UPDATE terminal_name = VALUES(terminal_name), terminal_code = VALUES(terminal_code), operating_hours = VALUES(operating_hours)");
        $q->bindValue(":name", "Abuja Flagship Facility", PDO::PARAM_STR);
        $q->bindValue(":code", "TRN-ABJ-01", PDO::PARAM_STR);
        $q->bindValue(":hours", "08:00–18:00", PDO::PARAM_STR);
        $q->execute();

        $locations = [
            [
                "code" => "CY-A",
                "name" => "Container Yard A",
                "kind" => "yard",
                "bonded" => 1,
                "status" => "active",
                "capacity" => 120,
                "capacity_unit" => "TEU",
                "cargo_types" => "Import containers, export containers, transit cargo, refrigerated containers",
                "security" => "24-hour CCTV surveillance, controlled entry gate, perimeter fencing, security patrols",
                "equipment" => "Reach stacker, terminal tractor, container handler, forklift",
                "block_code" => "A",
                "row_code" => "01",
                "slot_code" => "01",
                "tier_code" => "Ground",
                "aisle_code" => "CY-A-ACCESS",
                "rack_code" => "STACK-A01",
                "bin_code" => "POSITION-A-01"
            ],
            [
                "code" => "BW-1",
                "name" => "Bonded Warehouse 1",
                "kind" => "warehouse",
                "bonded" => 1,
                "status" => "active",
                "capacity" => 2400,
                "capacity_unit" => "sqm",
                "cargo_types" => "General cargo, palletised goods, agricultural products, industrial goods",
                "security" => "CCTV surveillance, controlled access, fire detection system, intruder alarm",
                "equipment" => "Forklift, electric pallet truck, platform weighing scale, loading dock equipment",
                "block_code" => "WH-B",
                "row_code" => "01",
                "slot_code" => "01",
                "tier_code" => "Ground",
                "aisle_code" => "A",
                "rack_code" => "R01",
                "bin_code" => "B01"
            ]
        ];

        foreach ($locations as $item) {
            $q = $conn->prepare("INSERT INTO terminal_locations (id, code, name, kind, bonded, status, capacity, capacity_unit, cargo_types, security, equipment, block_code, row_code, slot_code, tier_code, aisle_code, rack_code, bin_code) VALUES (:id, :code, :name, :kind, :bonded, :status, :capacity, :capacity_unit, :cargo_types, :security, :equipment, :block_code, :row_code, :slot_code, :tier_code, :aisle_code, :rack_code, :bin_code) ON DUPLICATE KEY UPDATE name = VALUES(name), kind = VALUES(kind), bonded = VALUES(bonded), status = VALUES(status), capacity = VALUES(capacity), capacity_unit = VALUES(capacity_unit), cargo_types = VALUES(cargo_types), security = VALUES(security), equipment = VALUES(equipment), block_code = VALUES(block_code), row_code = VALUES(row_code), slot_code = VALUES(slot_code), tier_code = VALUES(tier_code), aisle_code = VALUES(aisle_code), rack_code = VALUES(rack_code), bin_code = VALUES(bin_code)");
            $q->bindValue(":id", generateId(), PDO::PARAM_STR);
            $q->bindValue(":code", $item["code"], PDO::PARAM_STR);
            $q->bindValue(":name", $item["name"], PDO::PARAM_STR);
            $q->bindValue(":kind", $item["kind"], PDO::PARAM_STR);
            $q->bindValue(":bonded", $item["bonded"], PDO::PARAM_INT);
            $q->bindValue(":status", $item["status"], PDO::PARAM_STR);
            $q->bindValue(":capacity", $item["capacity"], PDO::PARAM_STR);
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

        $services = [
            "General cargo",
            "Containerised cargo",
            "Agricultural cargo",
            "Industrial cargo",
            "Automotive cargo",
            "Project cargo",
            "Special cargo"
        ];

        foreach ($services as $label) {
            $q = $conn->prepare("INSERT INTO terminal_cargo_services (id, label, is_active) VALUES (:id, :label, 1) ON DUPLICATE KEY UPDATE is_active = 1");
            $q->bindValue(":id", generateId(), PDO::PARAM_STR);
            $q->bindValue(":label", $label, PDO::PARAM_STR);
            $q->execute();
        }

        $holds = [
            "Customs inspection hold",
            "Regulatory agency hold",
            "Seal mismatch",
            "Outstanding charges",
            "Cargo damage",
            "Missing documentation"
        ];

        foreach ($holds as $label) {
            $q = $conn->prepare("INSERT INTO terminal_hold_reasons (id, label, is_active) VALUES (:id, :label, 1) ON DUPLICATE KEY UPDATE is_active = 1");
            $q->bindValue(":id", generateId(), PDO::PARAM_STR);
            $q->bindValue(":label", $label, PDO::PARAM_STR);
            $q->execute();
        }

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Terminal configuration saved successfully",
            "code" => [
                "terminal_name" => "Abuja Flagship Facility",
                "terminal_code" => "TRN-ABJ-01",
                "locations_saved" => count($locations),
                "cargo_services_saved" => count($services),
                "hold_reasons_saved" => count($holds)
            ]
        ]);
    } catch (Throwable $e) {
        if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Unable to save terminal configuration",
            "code" => null
        ]);
    }