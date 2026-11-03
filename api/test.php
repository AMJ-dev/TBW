<?php
require_once __DIR__ . "/include/conn.php";

try {
    $conn->beginTransaction();

    $equipment = [
        [
            "name" => "Kalmar Reach Stacker RS01",
            "code" => "EQ-RS-001",
            "type" => "REACH_STACKER",
            "registration" => "TRN-RS-001",
            "capacity" => 45,
            "unit" => "TONNES",
            "status" => "AVAILABLE",
            "description" => "Heavy-duty reach stacker for loading, unloading and stacking loaded shipping containers."
        ],
        [
            "name" => "Kalmar Reach Stacker RS02",
            "code" => "EQ-RS-002",
            "type" => "REACH_STACKER",
            "registration" => "TRN-RS-002",
            "capacity" => 45,
            "unit" => "TONNES",
            "status" => "IN_USE",
            "description" => "Container handling reach stacker assigned to the main container yard."
        ],
        [
            "name" => "Konecranes Reach Stacker RS03",
            "code" => "EQ-RS-003",
            "type" => "REACH_STACKER",
            "registration" => "TRN-RS-003",
            "capacity" => 45,
            "unit" => "TONNES",
            "status" => "MAINTENANCE",
            "description" => "Reach stacker currently undergoing scheduled hydraulic system maintenance."
        ],
        [
            "name" => "Toyota Forklift FL01",
            "code" => "EQ-FL-001",
            "type" => "FORKLIFT",
            "registration" => "TRN-FL-001",
            "capacity" => 5,
            "unit" => "TONNES",
            "status" => "AVAILABLE",
            "description" => "Medium-duty forklift for handling palletised cargo and warehouse goods."
        ],
        [
            "name" => "Hyster Forklift FL02",
            "code" => "EQ-FL-002",
            "type" => "FORKLIFT",
            "registration" => "TRN-FL-002",
            "capacity" => 7,
            "unit" => "TONNES",
            "status" => "IN_USE",
            "description" => "Heavy-duty forklift assigned to warehouse cargo handling operations."
        ],
        [
            "name" => "Toyota Forklift FL03",
            "code" => "EQ-FL-003",
            "type" => "FORKLIFT",
            "registration" => "TRN-FL-003",
            "capacity" => 3,
            "unit" => "TONNES",
            "status" => "AVAILABLE",
            "description" => "Compact forklift for general warehouse and cargo movement."
        ],
        [
            "name" => "Kalmar Terminal Tractor TT01",
            "code" => "EQ-TT-001",
            "type" => "TERMINAL_TRACTOR",
            "registration" => "TRN-TT-001",
            "capacity" => 30,
            "unit" => "TONNES",
            "status" => "AVAILABLE",
            "description" => "Terminal tractor for moving container trailers between the yard and handling areas."
        ],
        [
            "name" => "Terberg Terminal Tractor TT02",
            "code" => "EQ-TT-002",
            "type" => "TERMINAL_TRACTOR",
            "registration" => "TRN-TT-002",
            "capacity" => 30,
            "unit" => "TONNES",
            "status" => "IN_USE",
            "description" => "Terminal tractor currently assigned to internal container transportation."
        ],
        [
            "name" => "Terberg Terminal Tractor TT03",
            "code" => "EQ-TT-003",
            "type" => "TERMINAL_TRACTOR",
            "registration" => "TRN-TT-003",
            "capacity" => 30,
            "unit" => "TONNES",
            "status" => "OUT_OF_SERVICE",
            "description" => "Terminal tractor temporarily withdrawn from operations pending inspection."
        ],
        [
            "name" => "Liebherr Mobile Crane MC01",
            "code" => "EQ-MC-001",
            "type" => "MOBILE_CRANE",
            "registration" => "TRN-MC-001",
            "capacity" => 100,
            "unit" => "TONNES",
            "status" => "AVAILABLE",
            "description" => "Mobile crane for heavy cargo lifting and specialised terminal handling."
        ],
        [
            "name" => "Grove Mobile Crane MC02",
            "code" => "EQ-MC-002",
            "type" => "MOBILE_CRANE",
            "registration" => "TRN-MC-002",
            "capacity" => 80,
            "unit" => "TONNES",
            "status" => "MAINTENANCE",
            "description" => "Mobile crane undergoing routine inspection and scheduled servicing."
        ],
        [
            "name" => "Rubber Tyred Gantry Crane GC01",
            "code" => "EQ-GC-001",
            "type" => "GANTRY_CRANE",
            "registration" => "TRN-GC-001",
            "capacity" => 40,
            "unit" => "TONNES",
            "status" => "IN_USE",
            "description" => "Rubber-tyred gantry crane used for container stacking and yard operations."
        ],
        [
            "name" => "Rubber Tyred Gantry Crane GC02",
            "code" => "EQ-GC-002",
            "type" => "GANTRY_CRANE",
            "registration" => "TRN-GC-002",
            "capacity" => 40,
            "unit" => "TONNES",
            "status" => "AVAILABLE",
            "description" => "Yard gantry crane available for container stacking assignments."
        ],
        [
            "name" => "MAN Heavy Duty Terminal Truck TR01",
            "code" => "EQ-TR-001",
            "type" => "TRUCK",
            "registration" => "ABC-123-XY",
            "capacity" => 30,
            "unit" => "TONNES",
            "status" => "AVAILABLE",
            "description" => "Heavy-duty truck for authorised cargo transportation within terminal operations."
        ],
        [
            "name" => "Mercedes-Benz Cargo Truck TR02",
            "code" => "EQ-TR-002",
            "type" => "TRUCK",
            "registration" => "ABC-456-XY",
            "capacity" => 20,
            "unit" => "TONNES",
            "status" => "IN_USE",
            "description" => "Cargo truck assigned to terminal logistics and internal transportation."
        ],
        [
            "name" => "Flatbed Container Trailer TL01",
            "code" => "EQ-TL-001",
            "type" => "TRAILER",
            "registration" => "TRL-001-AB",
            "capacity" => 35,
            "unit" => "TONNES",
            "status" => "AVAILABLE",
            "description" => "Flatbed trailer for transporting standard shipping containers."
        ],
        [
            "name" => "Skeletal Container Trailer TL02",
            "code" => "EQ-TL-002",
            "type" => "TRAILER",
            "registration" => "TRL-002-AB",
            "capacity" => 40,
            "unit" => "TONNES",
            "status" => "IN_USE",
            "description" => "Skeletal trailer currently assigned to container transfer operations."
        ],
        [
            "name" => "Skeletal Container Trailer TL03",
            "code" => "EQ-TL-003",
            "type" => "TRAILER",
            "registration" => "TRL-003-AB",
            "capacity" => 40,
            "unit" => "TONNES",
            "status" => "OUT_OF_SERVICE",
            "description" => "Container trailer temporarily unavailable pending mechanical repairs."
        ]
    ];

    $check = $conn->prepare("
        SELECT id
        FROM terminal_equipment
        WHERE equipment_code = :equipment_code
        LIMIT 1
    ");

    $insert = $conn->prepare("
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
            is_active,
            created_at,
            updated_at
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
            :is_active,
            NOW(),
            NOW()
        )
    ");

    $inserted = 0;
    $skipped = 0;

    foreach ($equipment as $item) {
        $check->bindValue(":equipment_code", $item["code"], PDO::PARAM_STR);
        $check->execute();

        if ($check->fetch(PDO::FETCH_ASSOC)) {
            $skipped++;
            continue;
        }

        $id = generateId();

        $insert->bindValue(":id", $id, PDO::PARAM_STR);
        $insert->bindValue(":equipment_name", $item["name"], PDO::PARAM_STR);
        $insert->bindValue(":equipment_code", $item["code"], PDO::PARAM_STR);
        $insert->bindValue(":equipment_type", $item["type"], PDO::PARAM_STR);
        $insert->bindValue(":registration_number", $item["registration"], PDO::PARAM_STR);
        $insert->bindValue(":capacity", $item["capacity"], PDO::PARAM_STR);
        $insert->bindValue(":capacity_unit", $item["unit"], PDO::PARAM_STR);
        $insert->bindValue(":operational_status", $item["status"], PDO::PARAM_STR);
        $insert->bindValue(":description", $item["description"], PDO::PARAM_STR);
        $insert->bindValue(":is_active", 1, PDO::PARAM_INT);

        $insert->execute();

        $inserted++;
    }

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Equipment seed completed successfully.",
        "code" => [
            "inserted" => $inserted,
            "skipped" => $skipped,
            "total" => count($equipment)
        ]
    ]);

} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode([
        "error" => true,
        "data" => "Could not create equipment records.",
        "code" => null
    ]);
}