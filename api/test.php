<?php
require_once __DIR__ . "/include/conn.php";

try {
    $conn->beginTransaction();

    $locations = [
        [
            "code" => "YARD-A",
            "name" => "Main Container Yard A",
            "description" => "Primary container storage area for import and export containers.",
            "kind" => "YARD",
            "status" => "active",
            "capacity" => 2500,
            "parent" => null
        ],
        [
            "code" => "YARD-B",
            "name" => "Container Yard B",
            "description" => "Secondary container storage area for overflow and general container stacking.",
            "kind" => "YARD",
            "status" => "active",
            "capacity" => 1800,
            "parent" => null
        ],
        [
            "code" => "YARD-C",
            "name" => "Empty Container Yard",
            "description" => "Dedicated storage area for empty shipping containers.",
            "kind" => "YARD",
            "status" => "active",
            "capacity" => 1200,
            "parent" => null
        ],
        [
            "code" => "YARD-D",
            "name" => "Export Container Yard",
            "description" => "Designated storage area for export containers awaiting dispatch.",
            "kind" => "YARD",
            "status" => "active",
            "capacity" => 1500,
            "parent" => null
        ],
        [
            "code" => "YARD-E",
            "name" => "Reefer Container Yard",
            "description" => "Specialised container yard with power connections for refrigerated containers.",
            "kind" => "YARD",
            "status" => "active",
            "capacity" => 350,
            "parent" => null
        ],
        [
            "code" => "YARD-A-01",
            "name" => "Yard A Block 01",
            "description" => "First container stacking block in Main Container Yard A.",
            "kind" => "YARD",
            "status" => "active",
            "capacity" => 300,
            "parent" => "YARD-A"
        ],
        [
            "code" => "YARD-A-02",
            "name" => "Yard A Block 02",
            "description" => "Second container stacking block in Main Container Yard A.",
            "kind" => "YARD",
            "status" => "active",
            "capacity" => 300,
            "parent" => "YARD-A"
        ],
        [
            "code" => "YARD-A-03",
            "name" => "Yard A Block 03",
            "description" => "Third container stacking block in Main Container Yard A.",
            "kind" => "YARD",
            "status" => "active",
            "capacity" => 300,
            "parent" => "YARD-A"
        ],
        [
            "code" => "YARD-B-01",
            "name" => "Yard B Block 01",
            "description" => "First stacking block in Container Yard B.",
            "kind" => "YARD",
            "status" => "active",
            "capacity" => 300,
            "parent" => "YARD-B"
        ],
        [
            "code" => "YARD-B-02",
            "name" => "Yard B Block 02",
            "description" => "Second stacking block in Container Yard B.",
            "kind" => "YARD",
            "status" => "maintenance",
            "capacity" => 300,
            "parent" => "YARD-B"
        ],
        [
            "code" => "WH-MAIN",
            "name" => "Main General Warehouse",
            "description" => "Primary covered warehouse for general cargo, palletised goods and consolidated shipments.",
            "kind" => "WAREHOUSE",
            "status" => "active",
            "capacity" => 5000,
            "parent" => null
        ],
        [
            "code" => "WH-BONDED",
            "name" => "Bonded Cargo Warehouse",
            "description" => "Secure warehouse for cargo held under customs control.",
            "kind" => "WAREHOUSE",
            "status" => "active",
            "capacity" => 3500,
            "parent" => null
        ],
        [
            "code" => "WH-EXPORT",
            "name" => "Export Cargo Warehouse",
            "description" => "Warehouse for export cargo awaiting documentation and dispatch.",
            "kind" => "WAREHOUSE",
            "status" => "active",
            "capacity" => 2500,
            "parent" => null
        ],
        [
            "code" => "WH-01",
            "name" => "Main Warehouse Section 01",
            "description" => "First storage section in the Main General Warehouse.",
            "kind" => "WAREHOUSE",
            "status" => "active",
            "capacity" => 1000,
            "parent" => "WH-MAIN"
        ],
        [
            "code" => "WH-02",
            "name" => "Main Warehouse Section 02",
            "description" => "Second storage section in the Main General Warehouse.",
            "kind" => "WAREHOUSE",
            "status" => "active",
            "capacity" => 1000,
            "parent" => "WH-MAIN"
        ],
        [
            "code" => "WH-03",
            "name" => "Main Warehouse Section 03",
            "description" => "Third storage section in the Main General Warehouse.",
            "kind" => "WAREHOUSE",
            "status" => "active",
            "capacity" => 1000,
            "parent" => "WH-MAIN"
        ],
        [
            "code" => "EXAM-01",
            "name" => "Primary Examination Bay",
            "description" => "Main examination area for physical cargo inspection and customs examination.",
            "kind" => "EXAMINATION_BAY",
            "status" => "active",
            "capacity" => 20,
            "parent" => null
        ],
        [
            "code" => "EXAM-02",
            "name" => "Secondary Examination Bay",
            "description" => "Secondary examination area for additional cargo inspections.",
            "kind" => "EXAMINATION_BAY",
            "status" => "active",
            "capacity" => 15,
            "parent" => null
        ],
        [
            "code" => "EXAM-03",
            "name" => "Scanning Examination Bay",
            "description" => "Designated examination area for cargo scanning and non-intrusive inspection.",
            "kind" => "EXAMINATION_BAY",
            "status" => "active",
            "capacity" => 10,
            "parent" => null
        ],
        [
            "code" => "EXAM-04",
            "name" => "Special Cargo Examination Bay",
            "description" => "Dedicated examination area for cargo requiring specialised inspection.",
            "kind" => "EXAMINATION_BAY",
            "status" => "maintenance",
            "capacity" => 8,
            "parent" => null
        ]
    ];

    $existing = $conn->prepare("
        SELECT id
        FROM terminal_locations
        WHERE code = :code
        LIMIT 1
    ");

    $insert = $conn->prepare("
        INSERT INTO terminal_locations (
            id,
            parent_location_id,
            code,
            name,
            description,
            kind,
            status,
            capacity,
            capacity_unit,
            change_reason
        ) VALUES (
            :id,
            :parent_location_id,
            :code,
            :name,
            :description,
            :kind,
            :status,
            :capacity,
            'TEU',
            :change_reason
        )
    ");

    $locationIds = [];
    $inserted = 0;
    $skipped = 0;

    foreach ($locations as $location) {
        $existing->bindValue(":code", $location["code"], PDO::PARAM_STR);
        $existing->execute();

        $existingRecord = $existing->fetch(PDO::FETCH_ASSOC);

        if ($existingRecord) {
            $locationIds[$location["code"]] = $existingRecord["id"];
            $skipped++;
            continue;
        }

        $id = generateId();

        $parentId = $location["parent"]
            ? ($locationIds[$location["parent"]] ?? null)
            : null;

        if ($location["parent"] && !$parentId) {
            throw new RuntimeException(
                "Parent location not found for " . $location["code"]
            );
        }

        $insert->bindValue(":id", $id, PDO::PARAM_STR);

        $insert->bindValue(
            ":parent_location_id",
            $parentId,
            $parentId === null ? PDO::PARAM_NULL : PDO::PARAM_STR
        );

        $insert->bindValue(":code", $location["code"], PDO::PARAM_STR);
        $insert->bindValue(":name", $location["name"], PDO::PARAM_STR);
        $insert->bindValue(":description", $location["description"], PDO::PARAM_STR);
        $insert->bindValue(":kind", $location["kind"], PDO::PARAM_STR);
        $insert->bindValue(":status", $location["status"], PDO::PARAM_STR);
        $insert->bindValue(":capacity", (string) $location["capacity"], PDO::PARAM_STR);

        $insert->bindValue(
            ":change_reason",
            "Initial terminal location configuration",
            PDO::PARAM_STR
        );

        $insert->execute();

        $locationIds[$location["code"]] = $id;
        $inserted++;
    }

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Terminal locations created successfully.",
        "code" => [
            "inserted" => $inserted,
            "skipped" => $skipped,
            "total" => count($locations)
        ]
    ]);

} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode([
        "error" => true,
        "data" => "Could not create terminal locations.",
        "code" => null
    ]);
}