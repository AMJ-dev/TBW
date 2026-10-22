
<?php

require_once __DIR__ . "/include/conn.php";

header('Content-Type: application/json; charset=utf-8');

if (!isset($conn) || !($conn instanceof PDO)) {
    echo json_encode([
        "error" => true,
        "data" => "Database connection is unavailable.",
        "code" => 500
    ]);
    exit;
}

function pickValue($values)
{
    if (!is_array($values) || empty($values)) {
        return '';
    }

    return $values[array_rand($values)];
}

function makeContainerNumber(): string
{
    $letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $owners = ['MSCU', 'CMAU', 'MAEU', 'HLBU', 'TGHU', 'FSCU', 'BMOU', 'TEMU'];
    $prefix = pickValue($owners);
    $serial = '';

    for ($i = 0; $i < 6; $i++) {
        $serial .= (string) random_int(0, 9);
    }

    $values = [
        'A' => 10, 'B' => 12, 'C' => 13, 'D' => 14,
        'E' => 15, 'F' => 16, 'G' => 17, 'H' => 18,
        'I' => 19, 'J' => 20, 'K' => 21, 'L' => 23,
        'M' => 24, 'N' => 25, 'O' => 26, 'P' => 27,
        'Q' => 28, 'R' => 29, 'S' => 30, 'T' => 31,
        'U' => 32, 'V' => 34, 'W' => 35, 'X' => 36,
        'Y' => 37, 'Z' => 38
    ];

    $input = $prefix . $serial;
    $sum = 0;

    for ($i = 0; $i < strlen($input); $i++) {
        $char = $input[$i];
        $value = ctype_digit($char) ? (int) $char : $values[$char];
        $sum += $value * (2 ** $i);
    }

    return $input . (($sum % 11) % 10);
}

function makeSealNumber(): string
{
    return 'NG' . random_int(100000, 999999) . strtoupper(bin2hex(random_bytes(2)));
}

function makeReference(string $prefix): string
{
    return $prefix . '-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(6)));
}

function isFake(?string $value): bool
{
    if ($value === null || trim($value) === '') {
        return true;
    }

    $value = strtolower(trim($value));

    if (in_array($value, [
        'test', 'testing', 'demo', 'sample', 'unknown',
        'n/a', 'na', 'null', 'undefined', 'none',
        'consignee', 'customer', 'company', 'asas',
        'dsbk', 'ksbk', 'ueywe', 'sdsdv', 'vjhv',
        'hjvj', 'hjvh', 'asda', 'sa', 'svd', 'sd',
        'mskjk', 'kjkj', 'swe-566-sds'
    ], true)) {
        return true;
    }

    if (preg_match('/^(.)\1{2,}$/i', $value)) {
        return true;
    }

    if (preg_match('/^[a-z]{1,4}$/i', $value)) {
        return true;
    }

    return false;
}

function isFakeContainerNumber(?string $value): bool
{
    if ($value === null || !preg_match('/^[A-Z]{3}U[0-9]{7}$/i', trim($value))) {
        return true;
    }

    $value = strtoupper(trim($value));

    $letterValues = [
        'A' => 10, 'B' => 12, 'C' => 13, 'D' => 14,
        'E' => 15, 'F' => 16, 'G' => 17, 'H' => 18,
        'I' => 19, 'J' => 20, 'K' => 21, 'L' => 23,
        'M' => 24, 'N' => 25, 'O' => 26, 'P' => 27,
        'Q' => 28, 'R' => 29, 'S' => 30, 'T' => 31,
        'U' => 32, 'V' => 34, 'W' => 35, 'X' => 36,
        'Y' => 37, 'Z' => 38
    ];

    $sum = 0;

    for ($i = 0; $i < 10; $i++) {
        $char = $value[$i];
        $number = ctype_digit($char) ? (int) $char : $letterValues[$char];
        $sum += $number * (2 ** $i);
    }

    return (string) (($sum % 11) % 10) !== $value[10];
}

function uniqueContainerNumber(PDO $conn, string $shipmentId): string
{
    do {
        $number = makeContainerNumber();

        $stmt = $conn->prepare("
            SELECT COUNT(*)
            FROM portal_shipment_containers
            WHERE shipment_id = :shipment_id
              AND container_no = :container_no
        ");

        $stmt->execute([
            'shipment_id' => $shipmentId,
            'container_no' => $number
        ]);

        $exists = (int) $stmt->fetchColumn() > 0;
    } while ($exists);

    return $number;
}

function uniqueManifestContainerNumber(PDO $conn, string $manifestId): string
{
    do {
        $number = makeContainerNumber();

        $stmt = $conn->prepare("
            SELECT COUNT(*)
            FROM operation_manifest_containers
            WHERE manifest_id = :manifest_id
              AND container_no = :container_no
        ");

        $stmt->execute([
            'manifest_id' => $manifestId,
            'container_no' => $number
        ]);

        $exists = (int) $stmt->fetchColumn() > 0;
    } while ($exists);

    return $number;
}

$shippingLines = [
    'Maersk',
    'MSC',
    'CMA CGM',
    'Hapag-Lloyd',
    'COSCO Shipping',
    'Evergreen Marine'
];

$vessels = [
    'Maersk Edirne',
    'MSC Verona',
    'CMA CGM Jacques Saade',
    'Hapag-Lloyd Jakarta',
    'COSCO Shipping Taurus',
    'MSC Maya',
    'Maersk Seoul'
];

$ports = [
    'Apapa Port, Lagos, Nigeria',
    'Tin Can Island Port, Lagos, Nigeria',
    'Tema Port, Ghana',
    'Durban Port, South Africa',
    'Shanghai Port, China',
    'Singapore Port, Singapore',
    'Rotterdam Port, Netherlands',
    'Jebel Ali Port, UAE',
    'Antwerp Port, Belgium',
    'Port Klang, Malaysia'
];

$consignees = [
    [
        'name' => 'Atlantic Industrial Supplies Ltd',
        'email' => 'logistics@atlantic-industrial.example',
        'phone' => '+2342015550101'
    ],
    [
        'name' => 'Meridian Agricultural Exports Ltd',
        'email' => 'exports@meridian-agri.example',
        'phone' => '+2342015550102'
    ],
    [
        'name' => 'Coastal Engineering Services Ltd',
        'email' => 'cargo@coastal-engineering.example',
        'phone' => '+2342015550103'
    ],
    [
        'name' => 'Prime Packaging and Manufacturing Ltd',
        'email' => 'logistics@prime-packaging.example',
        'phone' => '+2342015550104'
    ],
    [
        'name' => 'West African Consumer Products Ltd',
        'email' => 'shipping@westafrican-consumer.example',
        'phone' => '+2342015550105'
    ]
];

$cargoTypes = [
    [
        'description' => 'Industrial machinery components and spare parts',
        'category' => 'Industrial Equipment',
        'package_type' => 'Pallets',
        'hs_code' => '848390'
    ],
    [
        'description' => 'Packaged consumer goods for commercial distribution',
        'category' => 'Consumer Goods',
        'package_type' => 'Cartons',
        'hs_code' => '392390'
    ],
    [
        'description' => 'Processed agricultural products for export',
        'category' => 'Agricultural Products',
        'package_type' => 'Bags',
        'hs_code' => '120190'
    ],
    [
        'description' => 'Electrical cables and industrial accessories',
        'category' => 'Electrical Equipment',
        'package_type' => 'Pallets',
        'hs_code' => '854449'
    ],
    [
        'description' => 'Plastic packaging materials for manufacturing',
        'category' => 'Packaging Materials',
        'package_type' => 'Cartons',
        'hs_code' => '392020'
    ]
];

$stats = [
    'shipments_checked' => 0,
    'shipments_updated' => 0,
    'manifests_updated' => 0,
    'manifests_linked' => 0,
    'shipment_containers_created' => 0,
    'manifest_containers_created' => 0,
    'container_links_updated' => 0,
    'container_count_mismatches' => []
];

try {
    $conn->beginTransaction();

    $link = $conn->prepare("
        UPDATE operation_manifests m
        INNER JOIN portal_shipments s
            ON UPPER(TRIM(m.bill_of_lading)) =
               UPPER(TRIM(s.bill_of_lading))
        SET m.matched_shipment_id = s.id
        WHERE m.matched_shipment_id IS NULL
          AND m.bill_of_lading IS NOT NULL
          AND TRIM(m.bill_of_lading) <> ''
    ");

    $link->execute();
    $stats['manifests_linked'] = $link->rowCount();

    $shipments = $conn->query("
        SELECT s.*, m.id AS manifest_id,
               m.manifest_ref, m.containers AS manifest_container_count,
               m.packages AS manifest_packages,
               m.gross_weight AS manifest_gross_weight,
               m.consignee AS manifest_consignee,
               m.vessel AS manifest_vessel,
               m.shipping_line AS manifest_shipping_line,
               m.origin_port AS manifest_origin_port,
               m.eta AS manifest_eta,
               m.bill_of_lading AS manifest_bill_of_lading
        FROM portal_shipments s
        LEFT JOIN operation_manifests m
            ON m.matched_shipment_id = s.id
        ORDER BY s.created_at ASC
    ")->fetchAll();

    $updateShipment = $conn->prepare("
        UPDATE portal_shipments
        SET shipping_line = :shipping_line,
            vessel_name = :vessel_name,
            origin_port = :origin_port,
            destination_port = :destination_port,
            expected_arrival = :expected_arrival,
            consignee = :consignee,
            consignee_email = :consignee_email,
            consignee_phone = :consignee_phone,
            cargo_description = :cargo_description,
            cargo_category = :cargo_category,
            package_type = :package_type,
            package_count = :package_count,
            gross_weight = :gross_weight,
            volume = :volume,
            hs_code = :hs_code,
            dangerous_goods = 'no',
            temperature_controlled = 'no',
            temperature = NULL
        WHERE id = :id
    ");

    $insertShipmentContainer = $conn->prepare("
        INSERT INTO portal_shipment_containers
            (id, shipment_id, container_no, size, seal_no,
             package_count, gross_weight, status)
        VALUES
            (:id, :shipment_id, :container_no, :size, :seal_no,
             :package_count, :gross_weight, 'EXPECTED')
    ");

    $insertManifestContainer = $conn->prepare("
        INSERT INTO operation_manifest_containers
            (id, manifest_id, container_no, seal_no, size,
             package_count, gross_weight, matched_shipment_id,
             matched_shipment_container_id)
        VALUES
            (:id, :manifest_id, :container_no, :seal_no, :size,
             :package_count, :gross_weight, :shipment_id, :container_id)
    ");

    $updateManifestContainer = $conn->prepare("
        UPDATE operation_manifest_containers
        SET matched_shipment_id = :shipment_id,
            matched_shipment_container_id = :container_id
        WHERE id = :id
    ");

    $updateManifest = $conn->prepare("
        UPDATE operation_manifests
        SET vessel = :vessel,
            shipping_line = :shipping_line,
            origin_port = :origin_port,
            eta = :eta,
            containers = :containers,
            packages = :packages,
            gross_weight = :gross_weight,
            consignee = :consignee
        WHERE id = :id
    ");

    foreach ($shipments as $shipment) {
        $stats['shipments_checked']++;

        $shipmentId = $shipment['id'];
        $manifestId = $shipment['manifest_id'];

        $consignee = pickValue($consignees);
        $cargo = pickValue($cargoTypes);

        $shippingLine = isFake($shipment['shipping_line'])
            ? pickValue($shippingLines)
            : $shipment['shipping_line'];

        $vessel = isFake($shipment['vessel_name'])
            ? pickValue($vessels)
            : $shipment['vessel_name'];

        $origin = isFake($shipment['origin_port'])
            ? pickValue($ports)
            : $shipment['origin_port'];

        $destination = isFake($shipment['destination_port'])
            ? 'Apapa Port, Lagos, Nigeria'
            : $shipment['destination_port'];

        if (strcasecmp($origin, $destination) === 0) {
            $destination = 'Tema Port, Ghana';
        }

        $consigneeName = isFake($shipment['consignee'])
            ? $consignee['name']
            : $shipment['consignee'];

        $consigneeEmail = filter_var(
            $shipment['consignee_email'],
            FILTER_VALIDATE_EMAIL
        ) && !preg_match('/@(example|test|invalid)\./i', $shipment['consignee_email'])
            ? $shipment['consignee_email']
            : $consignee['email'];

        $consigneePhone = preg_match(
            '/^[+0-9() .-]{10,25}$/',
            (string) $shipment['consignee_phone']
        )
            ? $shipment['consignee_phone']
            : $consignee['phone'];

        $description = isFake($shipment['cargo_description'])
            ? $cargo['description']
            : $shipment['cargo_description'];

        $category = isFake($shipment['cargo_category'])
            ? $cargo['category']
            : $shipment['cargo_category'];

        $packageType = isFake($shipment['package_type'])
            ? $cargo['package_type']
            : $shipment['package_type'];

        $hsCode = isFake($shipment['hs_code'])
            ? $cargo['hs_code']
            : $shipment['hs_code'];

        $packages = (float) $shipment['package_count'];

        if ($packages <= 0) {
            $packages = random_int(120, 1800);
        }

        $weight = (float) $shipment['gross_weight'];

        if ($weight <= 0) {
            $weight = round(random_int(8000, 24000) + random_int(0, 999) / 1000, 3);
        }

        $volume = (float) $shipment['volume'];

        if ($volume <= 0) {
            $volume = round(random_int(18, 65) + random_int(0, 999) / 1000, 3);
        }

        $arrival = $shipment['expected_arrival'];

        if (
            empty($arrival) ||
            strtotime($arrival) === false ||
            strtotime($arrival) < strtotime('-180 days')
        ) {
            $arrival = date(
                'Y-m-d H:i:s',
                strtotime('+' . random_int(3, 24) . ' days')
            );
        }

        $updateShipment->execute([
            'shipping_line' => $shippingLine,
            'vessel_name' => $vessel,
            'origin_port' => $origin,
            'destination_port' => $destination,
            'expected_arrival' => $arrival,
            'consignee' => $consigneeName,
            'consignee_email' => $consigneeEmail,
            'consignee_phone' => $consigneePhone,
            'cargo_description' => $description,
            'cargo_category' => $category,
            'package_type' => $packageType,
            'package_count' => $packages,
            'gross_weight' => $weight,
            'volume' => $volume,
            'hs_code' => $hsCode,
            'id' => $shipmentId
        ]);

        $stats['shipments_updated']++;

        $containerQuery = $conn->prepare("
            SELECT id, container_no, size, seal_no, package_count, gross_weight
            FROM portal_shipment_containers
            WHERE shipment_id = ?
            ORDER BY created_at ASC
        ");
        $containerQuery->execute([$shipmentId]);
        $containerRows = $containerQuery->fetchAll();

        if ($manifestId !== null) {
            $manifestContainerQuery = $conn->prepare("
                SELECT id, container_no, seal_no, size, package_count, gross_weight
                FROM operation_manifest_containers
                WHERE manifest_id = ?
                ORDER BY created_at ASC
            ");
            $manifestContainerQuery->execute([$manifestId]);
            $manifestRows = $manifestContainerQuery->fetchAll();

            $declaredCount = max(0, (int) $shipment['manifest_container_count']);

            $targetCount = max(
                $declaredCount,
                count($manifestRows),
                count($containerRows)
            );

            if ($targetCount === 0) {
                $targetCount = random_int(1, 4);
            }

            while (count($manifestRows) < $targetCount) {
                $containerNo = uniqueContainerNumber($conn, $shipmentId);

                $size = pickValue(['20ft', '40ft', '40ft HC']);
                $sealNo = makeSealNumber();
                $containerPackages = round($packages / $targetCount, 2);
                $containerWeight = round($weight / $targetCount, 3);

                $containerId = generateID();
                $manifestContainerId = generateID();

                $insertShipmentContainer->execute([
                    'id' => $containerId,
                    'shipment_id' => $shipmentId,
                    'container_no' => $containerNo,
                    'size' => $size,
                    'seal_no' => $sealNo,
                    'package_count' => $containerPackages,
                    'gross_weight' => $containerWeight
                ]);

                $insertManifestContainer->execute([
                    'id' => $manifestContainerId,
                    'manifest_id' => $manifestId,
                    'container_no' => $containerNo,
                    'seal_no' => $sealNo,
                    'size' => $size,
                    'package_count' => $containerPackages,
                    'gross_weight' => $containerWeight,
                    'shipment_id' => $shipmentId,
                    'container_id' => $containerId
                ]);

                $containerRows[] = [
                    'id' => $containerId,
                    'container_no' => $containerNo,
                    'size' => $size,
                    'seal_no' => $sealNo,
                    'package_count' => $containerPackages,
                    'gross_weight' => $containerWeight
                ];

                $manifestRows[] = [
                    'id' => $manifestContainerId,
                    'container_no' => $containerNo,
                    'seal_no' => $sealNo,
                    'size' => $size,
                    'package_count' => $containerPackages,
                    'gross_weight' => $containerWeight
                ];

                $stats['shipment_containers_created']++;
                $stats['manifest_containers_created']++;
            }

            foreach ($manifestRows as $index => &$manifestRow) {
                if (isFakeContainerNumber($manifestRow['container_no'])) {
                    $newNumber = uniqueManifestContainerNumber($conn, $manifestId);

                    $change = $conn->prepare("
                        UPDATE operation_manifest_containers
                        SET container_no = ?
                        WHERE id = ?
                    ");
                    $change->execute([$newNumber, $manifestRow['id']]);

                    $manifestRow['container_no'] = $newNumber;
                }
            }
            unset($manifestRow);

            foreach ($containerRows as $index => &$containerRow) {
                if (isFakeContainerNumber($containerRow['container_no'])) {
                    $newNumber = uniqueContainerNumber($conn, $shipmentId);

                    $change = $conn->prepare("
                        UPDATE portal_shipment_containers
                        SET container_no = ?
                        WHERE id = ?
                    ");
                    $change->execute([$newNumber, $containerRow['id']]);

                    $containerRow['container_no'] = $newNumber;
                }
            }
            unset($containerRow);

            foreach ($manifestRows as $manifestRow) {
                $matchedContainer = null;

                foreach ($containerRows as $containerRow) {
                    if (
                        strtoupper(trim($manifestRow['container_no'])) ===
                        strtoupper(trim($containerRow['container_no']))
                    ) {
                        $matchedContainer = $containerRow;
                        break;
                    }
                }

                if ($matchedContainer === null) {
                    $containerNo = $manifestRow['container_no'];
                    $containerId = generateID();

                    $size = $manifestRow['size'] ?: '40ft HC';
                    $sealNo = isFake($manifestRow['seal_no'])
                        ? makeSealNumber()
                        : $manifestRow['seal_no'];

                    $containerPackages = (float) $manifestRow['package_count'];
                    $containerWeight = (float) $manifestRow['gross_weight'];

                    $insertShipmentContainer->execute([
                        'id' => $containerId,
                        'shipment_id' => $shipmentId,
                        'container_no' => $containerNo,
                        'size' => $size,
                        'seal_no' => $sealNo,
                        'package_count' => $containerPackages,
                        'gross_weight' => $containerWeight
                    ]);

                    $containerRows[] = [
                        'id' => $containerId,
                        'container_no' => $containerNo,
                        'size' => $size,
                        'seal_no' => $sealNo,
                        'package_count' => $containerPackages,
                        'gross_weight' => $containerWeight
                    ];

                    $matchedContainer = end($containerRows);
                    $stats['shipment_containers_created']++;
                }

                $updateManifestContainer->execute([
                    'shipment_id' => $shipmentId,
                    'container_id' => $matchedContainer['id'],
                    'id' => $manifestRow['id']
                ]);

                $stats['container_links_updated']++;
            }

            $finalCount = count($containerRows);
            $manifestPackages = (int) round($packages);
            $manifestWeight = number_format($weight, 3, '.', '') . ' kg';

            $manifestVessel = isFake($shipment['manifest_vessel'])
                ? $vessel
                : $shipment['manifest_vessel'];

            $manifestShippingLine = isFake($shipment['manifest_shipping_line'])
                ? $shippingLine
                : $shipment['manifest_shipping_line'];

            $manifestOrigin = isFake($shipment['manifest_origin_port'])
                ? $origin
                : $shipment['manifest_origin_port'];

            $manifestRef = isFake($shipment['manifest_ref'])
                ? makeReference('TRN-MNF')
                : $shipment['manifest_ref'];

            $updateManifest->execute([
                'vessel' => $manifestVessel,
                'shipping_line' => $manifestShippingLine,
                'origin_port' => $manifestOrigin,
                'eta' => $arrival,
                'containers' => $finalCount,
                'packages' => $manifestPackages,
                'gross_weight' => $manifestWeight,
                'consignee' => $consigneeName,
                'id' => $manifestId
            ]);

            $stats['manifests_updated']++;

            $check = $conn->prepare("
                SELECT
                    (SELECT COUNT(*)
                     FROM portal_shipment_containers
                     WHERE shipment_id = ?) AS saved_count,
                    (SELECT COUNT(*)
                     FROM operation_manifest_containers
                     WHERE manifest_id = ?) AS manifest_count
            ");
            $check->execute([$shipmentId, $manifestId]);
            $counts = $check->fetch();

            if ((int) $counts['saved_count'] !== (int) $counts['manifest_count']) {
                $stats['container_count_mismatches'][] = [
                    'shipment_reference' => $shipment['shipment_reference'],
                    'saved_count' => (int) $counts['saved_count'],
                    'manifest_count' => (int) $counts['manifest_count']
                ];
            }
        } elseif (count($containerRows) === 0) {
            $targetCount = random_int(1, 4);

            for ($i = 0; $i < $targetCount; $i++) {
                $containerNo = uniqueContainerNumber($conn, $shipmentId);
                $containerId = generateID();
                $size = pickValue(['20ft', '40ft', '40ft HC']);
                $sealNo = makeSealNumber();

                $insertShipmentContainer->execute([
                    'id' => $containerId,
                    'shipment_id' => $shipmentId,
                    'container_no' => $containerNo,
                    'size' => $size,
                    'seal_no' => $sealNo,
                    'package_count' => round($packages / $targetCount, 2),
                    'gross_weight' => round($weight / $targetCount, 3)
                ]);

                $stats['shipment_containers_created']++;
            }
        }
    }

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => [
            "message" => "Shipment and manifest repair completed.",
            "stats" => $stats,
            "notice" => "Generated shipping details are synthetic and must be checked against source documents before operational use."
        ],
        "code" => 200
    ], JSON_PRETTY_PRINT);

} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Could not repair shipment data.",
        "code" => $e->getMessage()
    ]);
}
