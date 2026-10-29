<?php
    require_once __DIR__ . "/include/conn.php";

    try {
        $conn->beginTransaction();

        $locations = [
            [
                "code" => "REC-01",
                "name" => "Main Receiving Area",
                "kind" => "RECEIVING",
                "description" => "Dedicated area for recording arrivals and verifying cargo before it is moved to storage or inspection.",
                "capacity" => 100,
                "children" => [
                    [
                        "code" => "REC-01-CNT",
                        "name" => "Container Receiving Bay",
                        "description" => "Area for checking incoming containers, container numbers, seals, and physical condition.",
                        "capacity" => 60
                    ],
                    [
                        "code" => "REC-01-CGO",
                        "name" => "General Cargo Receiving Bay",
                        "description" => "Area for receiving and verifying general cargo before warehouse put-away.",
                        "capacity" => 40
                    ]
                ]
            ],
            [
                "code" => "YRD-01",
                "name" => "Main Container Yard",
                "kind" => "YARD",
                "description" => "Primary container storage yard for import, export, and transshipment containers.",
                "capacity" => 2500,
                "children" => [
                    [
                        "code" => "YRD-01-IMP",
                        "name" => "Import Container Yard",
                        "description" => "Storage area for discharged import containers awaiting clearance and collection.",
                        "capacity" => 800
                    ],
                    [
                        "code" => "YRD-01-EXP",
                        "name" => "Export Container Yard",
                        "description" => "Staging area for export containers awaiting vessel loading.",
                        "capacity" => 600
                    ],
                    [
                        "code" => "YRD-01-TRS",
                        "name" => "Transshipment Container Yard",
                        "description" => "Temporary storage area for containers awaiting onward shipment.",
                        "capacity" => 450
                    ],
                    [
                        "code" => "YRD-01-EMT",
                        "name" => "Empty Container Yard",
                        "description" => "Designated storage area for empty containers awaiting repositioning.",
                        "capacity" => 400
                    ],
                    [
                        "code" => "YRD-01-DMG",
                        "name" => "Damaged Container Holding Yard",
                        "description" => "Segregated holding area for damaged containers pending inspection or repair.",
                        "capacity" => 100
                    ],
                    [
                        "code" => "YRD-01-RFR",
                        "name" => "Reefer Container Yard",
                        "description" => "Refrigerated container storage area with access to electrical reefer points.",
                        "capacity" => 150
                    ]
                ]
            ],
            [
                "code" => "YRD-02",
                "name" => "Heavy Cargo Yard",
                "kind" => "YARD",
                "description" => "Open storage and handling area for oversized, heavy, and project cargo.",
                "capacity" => 350,
                "children" => [
                    [
                        "code" => "YRD-02-OOG",
                        "name" => "Out-of-Gauge Cargo Area",
                        "description" => "Storage area for cargo exceeding standard container dimensions.",
                        "capacity" => 100
                    ],
                    [
                        "code" => "YRD-02-BRK",
                        "name" => "Breakbulk Cargo Area",
                        "description" => "Handling and storage area for non-containerized general cargo.",
                        "capacity" => 150
                    ],
                    [
                        "code" => "YRD-02-PRJ",
                        "name" => "Project Cargo Holding Area",
                        "description" => "Dedicated area for heavy machinery and project cargo awaiting dispatch.",
                        "capacity" => 100
                    ]
                ]
            ],
            [
                "code" => "WH-01",
                "name" => "Main Bonded Warehouse",
                "kind" => "WAREHOUSE",
                "description" => "Bonded warehouse for imported goods pending customs clearance.",
                "capacity" => 1200,
                "children" => [
                    [
                        "code" => "WH-01-GEN",
                        "name" => "General Cargo Section",
                        "description" => "Warehouse section for general imported cargo awaiting clearance.",
                        "capacity" => 500
                    ],
                    [
                        "code" => "WH-01-HVL",
                        "name" => "High-Value Cargo Section",
                        "description" => "Restricted-access storage for valuable goods requiring enhanced security.",
                        "capacity" => 150
                    ],
                    [
                        "code" => "WH-01-DNG",
                        "name" => "Dangerous Goods Section",
                        "description" => "Designated storage section for permitted dangerous goods under applicable safety controls.",
                        "capacity" => 100
                    ],
                    [
                        "code" => "WH-01-CLD",
                        "name" => "Temperature-Controlled Warehouse",
                        "description" => "Controlled-temperature storage for cargo requiring specific environmental conditions.",
                        "capacity" => 200
                    ],
                    [
                        "code" => "WH-01-OVF",
                        "name" => "Overflow Storage Section",
                        "description" => "Additional storage capacity for general cargo during peak operations.",
                        "capacity" => 250
                    ]
                ]
            ],
            [
                "code" => "WH-02",
                "name" => "Export Cargo Warehouse",
                "kind" => "WAREHOUSE",
                "description" => "Warehouse for export cargo awaiting documentation checks and dispatch.",
                "capacity" => 800,
                "children" => [
                    [
                        "code" => "WH-02-EXP",
                        "name" => "Export Consolidation Section",
                        "description" => "Area for consolidating export consignments before dispatch.",
                        "capacity" => 350
                    ],
                    [
                        "code" => "WH-02-PKG",
                        "name" => "Packing and Repacking Section",
                        "description" => "Cargo packing, repacking, labeling, and preparation area.",
                        "capacity" => 200
                    ],
                    [
                        "code" => "WH-02-REL",
                        "name" => "Export Release Holding Section",
                        "description" => "Holding area for export cargo cleared for release or onward movement.",
                        "capacity" => 250
                    ]
                ]
            ],
            [
                "code" => "WH-03",
                "name" => "General Cargo Warehouse",
                "kind" => "WAREHOUSE",
                "description" => "Warehouse for general cargo requiring covered storage and handling.",
                "capacity" => 1000,
                "children" => [
                    [
                        "code" => "WH-03-REC",
                        "name" => "Cargo Receiving Section",
                        "description" => "Receiving area for newly arrived cargo awaiting verification and put-away.",
                        "capacity" => 300
                    ],
                    [
                        "code" => "WH-03-STO",
                        "name" => "General Storage Section",
                        "description" => "Main storage section for verified general cargo.",
                        "capacity" => 500
                    ],
                    [
                        "code" => "WH-03-DSP",
                        "name" => "Dispatch Staging Section",
                        "description" => "Staging area for cargo prepared for collection or dispatch.",
                        "capacity" => 200
                    ]
                ]
            ],
            [
                "code" => "INSP-01",
                "name" => "Primary Customs Inspection Bay",
                "kind" => "INSPECTION_BAY",
                "description" => "Primary inspection area for cargo selected for customs examination.",
                "capacity" => 30,
                "children" => [
                    [
                        "code" => "INSP-01-DOC",
                        "name" => "Document Verification Bay",
                        "description" => "Inspection bay for cargo documentation and declaration verification.",
                        "capacity" => 10
                    ],
                    [
                        "code" => "INSP-01-PHY",
                        "name" => "Physical Examination Bay",
                        "description" => "Bay for physical examination of selected cargo and containers.",
                        "capacity" => 10
                    ],
                    [
                        "code" => "INSP-01-SCN",
                        "name" => "Container Scanning Holding Bay",
                        "description" => "Holding area for containers scheduled for scanning.",
                        "capacity" => 10
                    ]
                ]
            ],
            [
                "code" => "INSP-02",
                "name" => "Joint Agency Inspection Area",
                "kind" => "INSPECTION_BAY",
                "description" => "Inspection area for coordinated examinations involving relevant government agencies.",
                "capacity" => 20,
                "children" => [
                    [
                        "code" => "INSP-02-AG1",
                        "name" => "Agency Inspection Bay A",
                        "description" => "Dedicated bay for coordinated cargo inspections.",
                        "capacity" => 10
                    ],
                    [
                        "code" => "INSP-02-AG2",
                        "name" => "Agency Inspection Bay B",
                        "description" => "Additional bay for joint agency cargo inspections.",
                        "capacity" => 10
                    ]
                ]
            ],
            [
                "code" => "INSP-03",
                "name" => "Quarantine Inspection Bay",
                "kind" => "INSPECTION_BAY",
                "description" => "Designated inspection area for cargo requiring quarantine or regulatory assessment.",
                "capacity" => 12,
                "children" => []
            ]
        ];

        $findLocation = $conn->prepare("
            SELECT id
            FROM terminal_locations
            WHERE code = ?
            LIMIT 1
        ");

        $insertLocation = $conn->prepare("
            INSERT INTO terminal_locations (
                id,
                parent_location_id,
                code,
                name,
                description,
                kind,
                status,
                capacity,
                change_reason
            ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
        ");

        $inserted = 0;
        $existing = 0;

        foreach ($locations as $location) {
            $findLocation->execute([$location["code"]]);
            $parentId = $findLocation->fetchColumn();

            if (!$parentId) {
                $parentId = generateId();

                $insertLocation->execute([
                    $parentId,
                    null,
                    $location["code"],
                    $location["name"],
                    $location["description"],
                    $location["kind"],
                    $location["capacity"],
                    "Initial terminal location setup"
                ]);

                $inserted++;
            } else {
                $existing++;
            }

            foreach ($location["children"] as $child) {
                $findLocation->execute([$child["code"]]);
                $childId = $findLocation->fetchColumn();

                if ($childId) {
                    $existing++;
                    continue;
                }

                $childId = generateId();

                $insertLocation->execute([
                    $childId,
                    $parentId,
                    $child["code"],
                    $child["name"],
                    $child["description"],
                    $location["kind"],
                    $child["capacity"],
                    "Initial terminal location setup"
                ]);

                $inserted++;
            }
        }

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Terminal locations seeded successfully.",
            "code" => [
                "inserted" => $inserted,
                "existing" => $existing
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not seed terminal locations.",
            "code" => null
        ]);
    }