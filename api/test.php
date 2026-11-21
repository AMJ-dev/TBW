<?php
require_once __DIR__ . "/include/conn.php";

try {
    $conn->beginTransaction();

    $user_id = "53698470-56d3-4848-b65c-097021bd2823";
    $organisation_id = "eee3288a-4560-46e2-a957-31db1b0d8c73";

    $checkUser = $conn->prepare("SELECT id FROM users WHERE id = ? LIMIT 1");
    $checkUser->execute([$user_id]);

    if (!$checkUser->fetch(PDO::FETCH_ASSOC)) {
        throw new Exception("The specified user does not exist.");
    }

    $checkOrganisation = $conn->prepare("SELECT id FROM organisations WHERE id = ? LIMIT 1");
    $checkOrganisation->execute([$organisation_id]);

    if (!$checkOrganisation->fetch(PDO::FETCH_ASSOC)) {
        throw new Exception("The specified organisation does not exist.");
    }

    $newId = function () {
        return generateId();
    };

    $shipmentData = [
        [
            "shipment_type" => "Import",
            "bill_of_lading" => "MSCUABJ26110401",
            "booking_number" => "MSCU-ABJ-261104",
            "vessel_name" => "MSC LORENA",
            "voyage_number" => "6E261N",
            "shipping_line" => "MSC Mediterranean Shipping Company",
            "origin_country" => "China",
            "origin_port" => "Shanghai",
            "destination_port" => "Apapa Port",
            "expected_arrival" => "2026-11-28 08:00:00",
            "consignee" => "Nexus Electronics Limited",
            "consignee_email" => "clearing@nexuselectronics.com",
            "consignee_phone" => "+2348034567812",
            "consignee_contact_person" => "Daniel Okafor",
            "consignee_address" => "12 Industrial Avenue, Ikeja, Lagos",
            "consignee_country" => "Nigeria",
            "cargo_description" => "Smartphones and mobile communication accessories",
            "cargo_category" => "Electronics",
            "package_type" => "Cartons",
            "dangerous_goods" => "no",
            "special_instructions" => "Handle electronic cargo with care. Keep containers dry.",
            "items" => [
                [
                    "hs_code" => "8517130000",
                    "description" => "Smartphones",
                    "quantity" => 420,
                    "unit" => "Cartons",
                    "unit_value" => 185.00
                ],
                [
                    "hs_code" => "8504409000",
                    "description" => "Mobile phone power adapters and chargers",
                    "quantity" => 180,
                    "unit" => "Cartons",
                    "unit_value" => 42.50
                ]
            ],
            "containers" => [
                [
                    "container_no" => "MSCU7428193",
                    "size" => "40ft",
                    "seal_no" => "MSCNG840219",
                    "gross_weight" => 12450.500,
                    "quantities" => [240, 100]
                ],
                [
                    "container_no" => "MSCU6193847",
                    "size" => "40ft",
                    "seal_no" => "MSCNG840220",
                    "gross_weight" => 10820.300,
                    "quantities" => [180, 80]
                ]
            ]
        ],
        [
            "shipment_type" => "Import",
            "bill_of_lading" => "CMDUNG26110872",
            "booking_number" => "CMDU-LAG-261108",
            "vessel_name" => "CMA CGM AMAZON",
            "voyage_number" => "0MX7WE1",
            "shipping_line" => "CMA CGM",
            "origin_country" => "Germany",
            "origin_port" => "Hamburg",
            "destination_port" => "Tin Can Island Port",
            "expected_arrival" => "2026-11-30 12:00:00",
            "consignee" => "Atlantic Home Appliances Limited",
            "consignee_email" => "imports@atlantichomeappliances.com",
            "consignee_phone" => "+2348098765432",
            "consignee_contact_person" => "Michael Adeyemi",
            "consignee_address" => "Plot 18, Apapa-Oshodi Expressway, Lagos",
            "consignee_country" => "Nigeria",
            "cargo_description" => "Household refrigerators and refrigeration equipment",
            "cargo_category" => "Machinery and Equipment",
            "package_type" => "Wooden Crates",
            "dangerous_goods" => "no",
            "special_instructions" => "Keep upright during handling. Do not stack heavy cargo on top.",
            "items" => [
                [
                    "hs_code" => "8418219000",
                    "description" => "Household compression-type refrigerators",
                    "quantity" => 85,
                    "unit" => "Units",
                    "unit_value" => 310.00
                ],
                [
                    "hs_code" => "8504409000",
                    "description" => "Electrical power conversion units",
                    "quantity" => 45,
                    "unit" => "Cartons",
                    "unit_value" => 95.00
                ]
            ],
            "containers" => [
                [
                    "container_no" => "CMAU5819204",
                    "size" => "40ft",
                    "seal_no" => "CMA452819",
                    "gross_weight" => 14200.000,
                    "quantities" => [45, 25]
                ],
                [
                    "container_no" => "CMAU7391826",
                    "size" => "40ft",
                    "seal_no" => "CMA452820",
                    "gross_weight" => 13650.000,
                    "quantities" => [40, 20]
                ]
            ]
        ],
        [
            "shipment_type" => "Import",
            "bill_of_lading" => "OOLU261115903",
            "booking_number" => "OOLU-SHA-115903",
            "vessel_name" => "OOCL TOKYO",
            "voyage_number" => "118E",
            "shipping_line" => "OOCL",
            "origin_country" => "China",
            "origin_port" => "Ningbo",
            "destination_port" => "Apapa Port",
            "expected_arrival" => "2026-12-02 09:30:00",
            "consignee" => "Greenfield Agro Supplies Limited",
            "consignee_email" => "logistics@greenfieldagro.com",
            "consignee_phone" => "+2348023456789",
            "consignee_contact_person" => "Grace Nwosu",
            "consignee_address" => "45 Warehouse Road, Apapa, Lagos",
            "consignee_country" => "Nigeria",
            "cargo_description" => "Milled rice and agricultural food products",
            "cargo_category" => "Agricultural Products",
            "package_type" => "Bags",
            "dangerous_goods" => "no",
            "special_instructions" => "Protect from moisture and water exposure.",
            "items" => [
                [
                    "hs_code" => "1006309000",
                    "description" => "Semi-milled or wholly milled rice",
                    "quantity" => 1200,
                    "unit" => "Bags",
                    "unit_value" => 18.50
                ],
                [
                    "hs_code" => "0713390000",
                    "description" => "Dried beans, other varieties",
                    "quantity" => 350,
                    "unit" => "Bags",
                    "unit_value" => 24.00
                ]
            ],
            "containers" => [
                [
                    "container_no" => "OOLU8291740",
                    "size" => "40ft",
                    "seal_no" => "OOLU918271",
                    "gross_weight" => 25200.000,
                    "quantities" => [650, 180]
                ],
                [
                    "container_no" => "OOLU6138295",
                    "size" => "40ft",
                    "seal_no" => "OOLU918272",
                    "gross_weight" => 24800.000,
                    "quantities" => [550, 170]
                ]
            ]
        ],
        [
            "shipment_type" => "Import",
            "bill_of_lading" => "HLCUABJ2611205",
            "booking_number" => "HLCU-ABJ-261120",
            "vessel_name" => "HAMBURG EXPRESS",
            "voyage_number" => "062W",
            "shipping_line" => "Hapag-Lloyd",
            "origin_country" => "Japan",
            "origin_port" => "Yokohama",
            "destination_port" => "Tin Can Island Port",
            "expected_arrival" => "2026-12-04 14:00:00",
            "consignee" => "Prime Industrial Services Limited",
            "consignee_email" => "procurement@primeindustrial.com",
            "consignee_phone" => "+2348076543210",
            "consignee_contact_person" => "Emeka Obi",
            "consignee_address" => "22 Industrial Estate, Ilupeju, Lagos",
            "consignee_country" => "Nigeria",
            "cargo_description" => "Industrial water pumps and mechanical equipment",
            "cargo_category" => "Industrial Machinery",
            "package_type" => "Wooden Crates",
            "dangerous_goods" => "no",
            "special_instructions" => "Ensure lifting equipment is used for heavy crates.",
            "items" => [
                [
                    "hs_code" => "8413810000",
                    "description" => "Industrial water pumps",
                    "quantity" => 65,
                    "unit" => "Units",
                    "unit_value" => 420.00
                ],
                [
                    "hs_code" => "8413190000",
                    "description" => "Metering pumps and dosing equipment",
                    "quantity" => 35,
                    "unit" => "Units",
                    "unit_value" => 285.00
                ]
            ],
            "containers" => [
                [
                    "container_no" => "HLCU7291845",
                    "size" => "20ft",
                    "seal_no" => "HLCN762819",
                    "gross_weight" => 11800.000,
                    "quantities" => [35, 20]
                ],
                [
                    "container_no" => "HLCU3819274",
                    "size" => "20ft",
                    "seal_no" => "HLCN762820",
                    "gross_weight" => 9650.000,
                    "quantities" => [30, 15]
                ]
            ]
        ],
        [
            "shipment_type" => "Import",
            "bill_of_lading" => "MAEU2611258841",
            "booking_number" => "MAEU-LAG-258841",
            "vessel_name" => "MAERSK NAIROBI",
            "voyage_number" => "645S",
            "shipping_line" => "Maersk Line",
            "origin_country" => "India",
            "origin_port" => "Nhava Sheva",
            "destination_port" => "Apapa Port",
            "expected_arrival" => "2026-12-06 07:00:00",
            "consignee" => "West African Tyre Distributors Limited",
            "consignee_email" => "shipping@watydistributors.com",
            "consignee_phone" => "+2348056789123",
            "consignee_contact_person" => "Ibrahim Musa",
            "consignee_address" => "Plot 7, Trade Fair Complex, Lagos",
            "consignee_country" => "Nigeria",
            "cargo_description" => "New pneumatic rubber tyres and automotive products",
            "cargo_category" => "Automotive Products",
            "package_type" => "Bundles",
            "dangerous_goods" => "no",
            "special_instructions" => "Avoid exposure to excessive heat and sharp objects.",
            "items" => [
                [
                    "hs_code" => "4011900000",
                    "description" => "New pneumatic rubber tyres",
                    "quantity" => 480,
                    "unit" => "Units",
                    "unit_value" => 58.00
                ],
                [
                    "hs_code" => "4016910000",
                    "description" => "Rubber floor mats and vehicle mats",
                    "quantity" => 220,
                    "unit" => "Cartons",
                    "unit_value" => 32.00
                ]
            ],
            "containers" => [
                [
                    "container_no" => "MAEU6182930",
                    "size" => "40ft",
                    "seal_no" => "MAEU928371",
                    "gross_weight" => 15600.000,
                    "quantities" => [260, 120]
                ],
                [
                    "container_no" => "MAEU4728195",
                    "size" => "40ft",
                    "seal_no" => "MAEU928372",
                    "gross_weight" => 14900.000,
                    "quantities" => [220, 100]
                ]
            ]
        ]
    ];

    $hsCodes = [];

    foreach ($shipmentData as $shipment) {
        foreach ($shipment["items"] as $item) {
            $hsCodes[] = $item["hs_code"];
        }
    }

    $hsCodes = array_values(array_unique($hsCodes));
    $placeholders = implode(",", array_fill(0, count($hsCodes), "?"));

    $tariffQuery = $conn->prepare("
        SELECT id, hs_code
        FROM customs_tariffs
        WHERE hs_code IN ($placeholders)
          AND status = 'ACTIVE'
          AND effective_from <= CURDATE()
          AND (effective_to IS NULL OR effective_to >= CURDATE())
        ORDER BY effective_from DESC
    ");

    $tariffQuery->execute($hsCodes);

    $tariffs = [];

    foreach ($tariffQuery->fetchAll(PDO::FETCH_ASSOC) as $tariff) {
        if (!isset($tariffs[$tariff["hs_code"]])) {
            $tariffs[$tariff["hs_code"]] = $tariff["id"];
        }
    }

    foreach ($hsCodes as $hsCode) {
        if (!isset($tariffs[$hsCode])) {
            throw new Exception("No active customs tariff found for HS code: " . $hsCode);
        }
    }

    $insertShipment = $conn->prepare("
        INSERT INTO portal_shipments (
            id,
            shipment_reference,
            user_id,
            organisation_id,
            shipment_type,
            bill_of_lading,
            booking_number,
            vessel_name,
            voyage_number,
            shipping_line,
            origin_country,
            origin_port,
            destination_port,
            expected_arrival,
            consignee,
            consignee_email,
            consignee_phone,
            consignee_type,
            consignee_status,
            consignee_contact_person,
            consignee_address,
            consignee_country,
            cargo_description,
            cargo_category,
            package_type,
            package_count,
            gross_weight,
            dangerous_goods,
            temperature_controlled,
            special_instructions,
            status,
            document_status
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            'organisation', 'unregistered', ?, ?, ?, ?, ?, ?, ?, ?, ?,
            'no', ?, 'EXPECTED', 'PENDING_REVIEW'
        )
    ");

    $insertContainer = $conn->prepare("
        INSERT INTO portal_shipment_containers (
            id,
            shipment_id,
            container_no,
            size,
            seal_no,
            package_count,
            gross_weight,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'EXPECTED')
    ");

    $insertItem = $conn->prepare("
        INSERT INTO portal_shipment_container_items (
            id,
            container_id,
            customs_tariff_id,
            item_description,
            quantity,
            unit_of_measure,
            unit_value,
            currency,
            total_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'USD', ?)
    ");

    $createdShipments = [];

    foreach ($shipmentData as $shipment) {
        $shipmentId = $newId();
        $shipmentReference = "TRN-SHP-" . date("Y") . "-" . strtoupper(bin2hex(random_bytes(6)));

        $totalPackages = 0;
        $totalWeight = 0;

        foreach ($shipment["containers"] as $container) {
            $totalPackages += array_sum($container["quantities"]);
            $totalWeight += $container["gross_weight"];
        }

        $insertShipment->execute([
            $shipmentId,
            $shipmentReference,
            $user_id,
            $organisation_id,
            $shipment["shipment_type"],
            $shipment["bill_of_lading"],
            $shipment["booking_number"],
            $shipment["vessel_name"],
            $shipment["voyage_number"],
            $shipment["shipping_line"],
            $shipment["origin_country"],
            $shipment["origin_port"],
            $shipment["destination_port"],
            $shipment["expected_arrival"],
            $shipment["consignee"],
            $shipment["consignee_email"],
            $shipment["consignee_phone"],
            $shipment["consignee_contact_person"],
            $shipment["consignee_address"],
            $shipment["consignee_country"],
            $shipment["cargo_description"],
            $shipment["cargo_category"],
            $shipment["package_type"],
            $totalPackages,
            $totalWeight,
            $shipment["dangerous_goods"],
            $shipment["special_instructions"]
        ]);

        $createdContainers = [];

        foreach ($shipment["containers"] as $containerIndex => $container) {
            $containerId = $newId();
            $containerPackages = array_sum($container["quantities"]);

            $insertContainer->execute([
                $containerId,
                $shipmentId,
                $container["container_no"],
                $container["size"],
                $container["seal_no"],
                $containerPackages,
                $container["gross_weight"]
            ]);

            $createdItems = [];

            foreach ($shipment["items"] as $itemIndex => $item) {
                $quantity = $container["quantities"][$itemIndex];
                $unitValue = $item["unit_value"];
                $totalValue = round($quantity * $unitValue, 2);

                $insertItem->execute([
                    $newId(),
                    $containerId,
                    $tariffs[$item["hs_code"]],
                    $item["description"],
                    $quantity,
                    $item["unit"],
                    $unitValue,
                    $totalValue
                ]);

                $createdItems[] = [
                    "description" => $item["description"],
                    "hs_code" => $item["hs_code"],
                    "quantity" => $quantity,
                    "unit" => $item["unit"],
                    "unit_value" => $unitValue,
                    "currency" => "USD",
                    "total_value" => $totalValue
                ];
            }

            $createdContainers[] = [
                "container_no" => $container["container_no"],
                "size" => $container["size"],
                "package_count" => $containerPackages,
                "gross_weight" => $container["gross_weight"],
                "items" => $createdItems
            ];
        }

        $createdShipments[] = [
            "id" => $shipmentId,
            "shipment_reference" => $shipmentReference,
            "bill_of_lading" => $shipment["bill_of_lading"],
            "consignee" => $shipment["consignee"],
            "origin" => $shipment["origin_port"] . ", " . $shipment["origin_country"],
            "destination" => $shipment["destination_port"],
            "expected_arrival" => $shipment["expected_arrival"],
            "package_count" => $totalPackages,
            "gross_weight" => $totalWeight,
            "status" => "EXPECTED",
            "containers" => $createdContainers
        ];
    }

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => [
            "message" => "Five shipments created successfully.",
            "total_shipments" => count($createdShipments),
            "shipments" => $createdShipments
        ],
        "code" => null
    ]);

} catch (\Throwable $th) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Could not create sample shipments.",
        "code" => $th->getMessage()
    ]);
}