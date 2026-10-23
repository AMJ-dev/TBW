<?php

require_once __DIR__ . "/include/conn.php";

header("Content-Type: application/json; charset=utf-8");

if (!isset($conn) || !($conn instanceof PDO)) {
    http_response_code(500);
    echo json_encode(["error" => true, "data" => "Database connection is unavailable.", "code" => 500]);
    exit;
}

$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

function repairId(): string
{
    if (function_exists("generateID")) {
        return (string) generateID();
    }
    return bin2hex(random_bytes(16));
}

function repairPick(array $items)
{
    if ($items === []) {
        throw new RuntimeException("Cannot choose a value from an empty list.");
    }

    return $items[random_int(0, count($items) - 1)];
}

function repairPlaceholder($value): bool
{
    if ($value === null) {
        return true;
    }

    $v = trim((string) $value);
    if ($v === "") {
        return true;
    }

    $lower = strtolower($v);
    $known = [
        "test", "testing", "demo", "sample", "unknown", "n/a", "na", "null",
        "undefined", "none", "consignee", "customer", "company", "asdf",
        "qwerty", "asdfgh", "test test", "your name", "enter name",
        "tbd", "to be confirmed", "not available", "not applicable",
        "kjvkdjfvf", "dsbk", "ksbk", "ueywe", "sdsdv", "vjhv", "hjvj",
        "hjvh", "asda", "sa", "svd", "sd", "mskjk", "kjkj", "swe-566-sds"
    ];

    if (in_array($lower, $known, true)) {
        return true;
    }

    if (preg_match('/^(.)\1{2,}$/iu', $v)) {
        return true;
    }

    if (preg_match('/^(?:[a-z]{1,4}|[0-9]{1,4})$/i', $v)) {
        return true;
    }

    $letters = preg_replace('/[^a-z]/i', '', $v);
    if (strlen($letters) >= 7) {
        $vowels = preg_match_all('/[aeiou]/i', $letters);
        if ($vowels === 0) {
            return true;
        }
        if (strlen($letters) >= 9 && ($vowels / strlen($letters)) < 0.18) {
            return true;
        }
    }

    if (preg_match('/^(.){1,2}(?:[^aeiou\s]){4,}$/i', $v)) {
        return true;
    }

    return false;
}

function repairContainerNumber(): string
{
    $owners = ["MSCU", "CMAU", "MAEU", "HLBU", "TGHU", "FSCU", "BMOU", "TEMU"];
    $prefix = repairPick($owners);
    $base = $prefix . str_pad((string) random_int(0, 999999), 6, "0", STR_PAD_LEFT);

    $values = [
        "A" => 10, "B" => 12, "C" => 13, "D" => 14, "E" => 15,
        "F" => 16, "G" => 17, "H" => 18, "I" => 19, "J" => 20,
        "K" => 21, "L" => 23, "M" => 24, "N" => 25, "O" => 26,
        "P" => 27, "Q" => 28, "R" => 29, "S" => 30, "T" => 31,
        "U" => 32, "V" => 34, "W" => 35, "X" => 36, "Y" => 37, "Z" => 38
    ];

    $sum = 0;
    for ($i = 0; $i < strlen($base); $i++) {
        $char = $base[$i];
        $sum += (ctype_digit($char) ? (int) $char : $values[$char]) * (2 ** $i);
    }

    return $base . (string) (($sum % 11) % 10);
}

function repairContainerFormat($value): bool
{
    $value = strtoupper(trim((string) $value));
    if (!preg_match('/^[A-Z]{3}U[0-9]{7}$/', $value)) {
        return false;
    }

    $values = [
        "A" => 10, "B" => 12, "C" => 13, "D" => 14, "E" => 15,
        "F" => 16, "G" => 17, "H" => 18, "I" => 19, "J" => 20,
        "K" => 21, "L" => 23, "M" => 24, "N" => 25, "O" => 26,
        "P" => 27, "Q" => 28, "R" => 29, "S" => 30, "T" => 31,
        "U" => 32, "V" => 34, "W" => 35, "X" => 36, "Y" => 37, "Z" => 38
    ];

    $sum = 0;
    for ($i = 0; $i < 10; $i++) {
        $char = $value[$i];
        $sum += (ctype_digit($char) ? (int) $char : $values[$char]) * (2 ** $i);
    }

    return (string) (($sum % 11) % 10) === $value[10];
}

function repairSealNumber(): string
{
    return "TST-" . strtoupper(bin2hex(random_bytes(4)));
}

function repairUniqueValue(PDO $conn, string $table, string $column, string $value): bool
{
    $allowed = [
        "portal_shipment_containers" => ["container_no", "seal_no"],
        "operation_manifest_containers" => ["container_no", "seal_no"]
    ];

    if (!isset($allowed[$table]) || !in_array($column, $allowed[$table], true)) {
        throw new RuntimeException("Unsupported uniqueness check.");
    }

    $stmt = $conn->prepare("SELECT COUNT(*) FROM {$table} WHERE {$column} = ?");
    $stmt->execute([$value]);
    return (int) $stmt->fetchColumn() === 0;
}

function repairUniqueContainer(PDO $conn): string
{
    for ($i = 0; $i < 100; $i++) {
        $value = repairContainerNumber();
        $a = $conn->prepare("SELECT COUNT(*) FROM portal_shipment_containers WHERE container_no = ?");
        $a->execute([$value]);
        $b = $conn->prepare("SELECT COUNT(*) FROM operation_manifest_containers WHERE container_no = ?");
        $b->execute([$value]);
        if ((int) $a->fetchColumn() === 0 && (int) $b->fetchColumn() === 0) {
            return $value;
        }
    }
    throw new RuntimeException("Unable to generate a unique test container number.");
}

function repairUniqueSeal(PDO $conn): string
{
    for ($i = 0; $i < 100; $i++) {
        $value = repairSealNumber();
        if (
            repairUniqueValue($conn, "portal_shipment_containers", "seal_no", $value) &&
            repairUniqueValue($conn, "operation_manifest_containers", "seal_no", $value)
        ) {
            return $value;
        }
    }
    throw new RuntimeException("Unable to generate a unique test seal number.");
}

$lines = [
    "Maersk", "MSC", "CMA CGM", "Hapag-Lloyd", "COSCO Shipping", "Evergreen Marine"
];

$vesselsByLine = [
    "Maersk" => ["Maersk Edirne", "Maersk Seoul"],
    "MSC" => ["MSC Verona", "MSC Maya"],
    "CMA CGM" => ["CMA CGM Jacques Saade", "CMA CGM Antoine de Saint Exupery"],
    "Hapag-Lloyd" => ["Hapag-Lloyd Jakarta", "Hapag-Lloyd Berlin Express"],
    "COSCO Shipping" => ["COSCO Shipping Taurus", "COSCO Shipping Aquarius"],
    "Evergreen Marine" => ["Ever Ace", "Ever Given"]
];

$routes = [
    ["origin_country" => "Nigeria", "origin_port" => "Apapa Port, Lagos", "destination_port" => "Port of Rotterdam, Netherlands"],
    ["origin_country" => "Nigeria", "origin_port" => "Tin Can Island Port, Lagos", "destination_port" => "Port of Antwerp-Bruges, Belgium"],
    ["origin_country" => "Nigeria", "origin_port" => "Lekki Deep Sea Port, Lagos", "destination_port" => "Port of Hamburg, Germany"],
    ["origin_country" => "Nigeria", "origin_port" => "Onne Port, Rivers State", "destination_port" => "Port of Shanghai, China"],
    ["origin_country" => "Nigeria", "origin_port" => "Calabar Port, Cross River State", "destination_port" => "Port of Singapore, Singapore"],
    ["origin_country" => "Ghana", "origin_port" => "Port of Tema, Ghana", "destination_port" => "Port of Rotterdam, Netherlands"],
    ["origin_country" => "South Africa", "origin_port" => "Port of Durban, South Africa", "destination_port" => "Port of Jebel Ali, United Arab Emirates"],
    ["origin_country" => "China", "origin_port" => "Port of Shanghai, China", "destination_port" => "Port Klang, Malaysia"],
    ["origin_country" => "Singapore", "origin_port" => "Port of Singapore, Singapore", "destination_port" => "Port of Rotterdam, Netherlands"],
    ["origin_country" => "Netherlands", "origin_port" => "Port of Rotterdam, Netherlands", "destination_port" => "Port of New York and New Jersey, United States"]
];

$portCountries = [
    "Apapa Port, Lagos" => "Nigeria",
    "Tin Can Island Port, Lagos" => "Nigeria",
    "Lekki Deep Sea Port, Lagos" => "Nigeria",
    "Onne Port, Rivers State" => "Nigeria",
    "Calabar Port, Cross River State" => "Nigeria",
    "Port of Tema, Ghana" => "Ghana",
    "Port of Durban, South Africa" => "South Africa",
    "Port of Shanghai, China" => "China",
    "Port of Singapore, Singapore" => "Singapore",
    "Port of Rotterdam, Netherlands" => "Netherlands",
    "Port of Antwerp-Bruges, Belgium" => "Belgium",
    "Port of Hamburg, Germany" => "Germany",
    "Port of Jebel Ali, United Arab Emirates" => "United Arab Emirates",
    "Port Klang, Malaysia" => "Malaysia",
    "Port of New York and New Jersey, United States" => "United States"
];

$cargoTypes = [
    ["description" => "Industrial machinery components and spare parts", "category" => "Industrial Equipment", "package_type" => "Pallets", "hs_code" => "848390"],
    ["description" => "Packaged consumer goods for commercial distribution", "category" => "Consumer Goods", "package_type" => "Cartons", "hs_code" => "392390"],
    ["description" => "Processed agricultural products for export", "category" => "Agricultural Products", "package_type" => "Bags", "hs_code" => "120190"],
    ["description" => "Electrical cables and industrial accessories", "category" => "Electrical Equipment", "package_type" => "Pallets", "hs_code" => "854449"],
    ["description" => "Plastic packaging materials for manufacturing", "category" => "Packaging Materials", "package_type" => "Cartons", "hs_code" => "392020"]
];

$demoConsignees = [
    ["name" => "Atlantic Industrial Supplies Ltd", "email" => "logistics@atlantic-industrial.test", "phone" => "+2348000000101"],
    ["name" => "Meridian Agricultural Exports Ltd", "email" => "exports@meridian-agri.test", "phone" => "+2348000000102"],
    ["name" => "Coastal Engineering Services Ltd", "email" => "cargo@coastal-engineering.test", "phone" => "+2348000000103"],
    ["name" => "Prime Packaging and Manufacturing Ltd", "email" => "logistics@prime-packaging.test", "phone" => "+2348000000104"],
    ["name" => "West African Consumer Products Ltd", "email" => "shipping@westafrican-consumer.test", "phone" => "+2348000000105"]
];

$stats = [
    "shipments_checked" => 0,
    "shipments_updated" => 0,
    "manifests_updated" => 0,
    "manifests_linked" => 0,
    "shipment_containers_created" => 0,
    "manifest_containers_created" => 0,
    "container_numbers_repaired" => 0,
    "seal_numbers_repaired" => 0,
    "container_links_updated" => 0,
    "ambiguous_manifests" => [],
    "unresolved_container_mismatches" => [],
    "generated_values_are_test_data" => true
];

try {
    $conn->beginTransaction();

    $unlinked = $conn->query("
        SELECT id, bill_of_lading
        FROM operation_manifests
        WHERE matched_shipment_id IS NULL
          AND bill_of_lading IS NOT NULL
          AND TRIM(bill_of_lading) <> ''
    ")->fetchAll();

    $findShipment = $conn->prepare("
        SELECT id
        FROM portal_shipments
        WHERE UPPER(TRIM(bill_of_lading)) = UPPER(TRIM(?))
    ");

    $linkManifest = $conn->prepare("
        UPDATE operation_manifests
        SET matched_shipment_id = ?
        WHERE id = ? AND matched_shipment_id IS NULL
    ");

    foreach ($unlinked as $manifest) {
        $findShipment->execute([$manifest["bill_of_lading"]]);
        $matches = $findShipment->fetchAll();

        if (count($matches) === 1) {
            $linkManifest->execute([$matches[0]["id"], $manifest["id"]]);
            $stats["manifests_linked"] += $linkManifest->rowCount();
        } elseif (count($matches) > 1) {
            $stats["ambiguous_manifests"][] = [
                "manifest_id" => $manifest["id"],
                "bill_of_lading" => $manifest["bill_of_lading"],
                "matching_shipments" => count($matches)
            ];
        }
    }

    $shipments = $conn->query("SELECT * FROM portal_shipments ORDER BY id ASC")->fetchAll();

    $updateShipment = $conn->prepare("
        UPDATE portal_shipments
        SET shipment_reference = :shipment_reference,
            bill_of_lading = :bill_of_lading,
            shipping_line = :shipping_line,
            vessel_name = :vessel_name,
            origin_country = :origin_country,
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
            hs_code = :hs_code
        WHERE id = :id
    ");

    $insertShipmentContainer = $conn->prepare("
        INSERT INTO portal_shipment_containers
            (id, shipment_id, container_no, size, seal_no, package_count, gross_weight, status)
        VALUES
            (:id, :shipment_id, :container_no, :size, :seal_no, :package_count, :gross_weight, 'EXPECTED')
    ");

    $insertManifestContainer = $conn->prepare("
        INSERT INTO operation_manifest_containers
            (id, manifest_id, container_no, seal_no, size, package_count, gross_weight,
             matched_shipment_id, matched_shipment_container_id)
        VALUES
            (:id, :manifest_id, :container_no, :seal_no, :size, :package_count, :gross_weight,
             :shipment_id, :container_id)
    ");

    $updateShipmentContainer = $conn->prepare("
        UPDATE portal_shipment_containers
        SET container_no = :container_no, seal_no = :seal_no, size = :size
        WHERE id = :id
    ");

    $updateManifestContainer = $conn->prepare("
        UPDATE operation_manifest_containers
        SET container_no = :container_no,
            seal_no = :seal_no,
            size = :size,
            matched_shipment_id = :shipment_id,
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
        $stats["shipments_checked"]++;
        $shipmentId = (string) $shipment["id"];

        $line = $shipment["shipping_line"] ?? "";
        if (repairPlaceholder($line)) {
            $line = repairPick($lines);
        }

        $vessel = $shipment["vessel_name"] ?? "";
        if (repairPlaceholder($vessel)) {
            $vessel = repairPick($vesselsByLine[$line] ?? $vesselsByLine[repairPick($lines)]);
        }

        $originCountry = trim((string) ($shipment["origin_country"] ?? ""));
        $origin = trim((string) ($shipment["origin_port"] ?? ""));
        $destination = trim((string) ($shipment["destination_port"] ?? ""));

        $knownOrigin = isset($portCountries[$origin]);
        $knownDestination = in_array($destination, array_keys($portCountries), true);
        $badRoute = repairPlaceholder($origin) || repairPlaceholder($destination)
            || !$knownOrigin || !$knownDestination
            || strcasecmp($origin, $destination) === 0;

        if ($badRoute) {
            $route = repairPick($routes);
            $originCountry = $route["origin_country"];
            $origin = $route["origin_port"];
            $destination = $route["destination_port"];
        } else {
            $originCountry = $portCountries[$origin];
            if (repairPlaceholder($originCountry)) {
                $originCountry = $portCountries[$origin];
            }
        }

        $consignee = $shipment["consignee"] ?? "";
        $consigneeEmail = $shipment["consignee_email"] ?? "";
        $consigneePhone = $shipment["consignee_phone"] ?? "";

        if (repairPlaceholder($consignee)) {
            $demo = repairPick($demoConsignees);
            $consignee = $demo["name"];
            if (repairPlaceholder($consigneeEmail)) {
                $consigneeEmail = $demo["email"];
            }
            if (repairPlaceholder($consigneePhone)) {
                $consigneePhone = $demo["phone"];
            }
        }

        if (repairPlaceholder($consigneeEmail) || !filter_var($consigneeEmail, FILTER_VALIDATE_EMAIL)) {
            $consigneeEmail = repairPick($demoConsignees)["email"];
        }

        if (repairPlaceholder($consigneePhone) || !preg_match('/^[+0-9() .-]{10,25}$/', (string) $consigneePhone)) {
            $consigneePhone = repairPick($demoConsignees)["phone"];
        }

        $cargo = repairPick($cargoTypes);
        $description = repairPlaceholder($shipment["cargo_description"] ?? null) ? $cargo["description"] : $shipment["cargo_description"];
        $category = repairPlaceholder($shipment["cargo_category"] ?? null) ? $cargo["category"] : $shipment["cargo_category"];
        $packageType = repairPlaceholder($shipment["package_type"] ?? null) ? $cargo["package_type"] : $shipment["package_type"];
        $hsCode = repairPlaceholder($shipment["hs_code"] ?? null) ? $cargo["hs_code"] : $shipment["hs_code"];

        $packages = (float) ($shipment["package_count"] ?? 0);
        if ($packages <= 0) {
            $packages = (float) random_int(120, 1800);
        }

        $weight = (float) ($shipment["gross_weight"] ?? 0);
        if ($weight <= 0) {
            $weight = round(random_int(8000, 24000) + random_int(0, 999) / 1000, 3);
        }

        $volume = (float) ($shipment["volume"] ?? 0);
        if ($volume <= 0) {
            $volume = round(random_int(18, 65) + random_int(0, 999) / 1000, 3);
        }

        $arrival = $shipment["expected_arrival"] ?? null;
        if (empty($arrival) || strtotime((string) $arrival) === false || strtotime((string) $arrival) < strtotime("-180 days")) {
            $arrival = date("Y-m-d H:i:s", strtotime("+" . random_int(3, 24) . " days"));
        }

        $shipmentRef = trim((string) ($shipment["shipment_reference"] ?? ""));
        if (repairPlaceholder($shipmentRef) || preg_match('/^[a-z]{5,}$/i', $shipmentRef)) {
            $shipmentRef = "TRN-SHP-DEMO-" . strtoupper(bin2hex(random_bytes(5)));
        }

        $bol = trim((string) ($shipment["bill_of_lading"] ?? ""));
        if (repairPlaceholder($bol) || preg_match('/^[a-z]{6,}$/i', $bol)) {
            $bol = "DEMO-BOL-" . strtoupper(bin2hex(random_bytes(4)));
        }

        $updateShipment->execute([
            "shipment_reference" => $shipmentRef,
            "bill_of_lading" => $bol,
            "shipping_line" => $line,
            "vessel_name" => $vessel,
            "origin_country" => $originCountry,
            "origin_port" => $origin,
            "destination_port" => $destination,
            "expected_arrival" => $arrival,
            "consignee" => $consignee,
            "consignee_email" => $consigneeEmail,
            "consignee_phone" => $consigneePhone,
            "cargo_description" => $description,
            "cargo_category" => $category,
            "package_type" => $packageType,
            "package_count" => $packages,
            "gross_weight" => $weight,
            "volume" => $volume,
            "hs_code" => $hsCode,
            "id" => $shipmentId
        ]);

        $stats["shipments_updated"]++;

        $manifestQuery = $conn->prepare("
            SELECT *
            FROM operation_manifests
            WHERE matched_shipment_id = ?
            ORDER BY id ASC
        ");
        $manifestQuery->execute([$shipmentId]);
        $manifests = $manifestQuery->fetchAll();

        if (count($manifests) > 1) {
            $stats["ambiguous_manifests"][] = [
                "shipment_id" => $shipmentId,
                "reason" => "More than one manifest is linked to this shipment; automatic container reconciliation was skipped."
            ];
            continue;
        }

        $manifest = $manifests[0] ?? null;
        $shipmentContainerQuery = $conn->prepare("
            SELECT id, shipment_id, container_no, size, seal_no, package_count, gross_weight, status
            FROM portal_shipment_containers
            WHERE shipment_id = ?
            ORDER BY id ASC
        ");
        $shipmentContainerQuery->execute([$shipmentId]);
        $shipmentContainers = $shipmentContainerQuery->fetchAll();

        $manifestContainers = [];
        if ($manifest) {
            $manifestContainerQuery = $conn->prepare("
                SELECT id, manifest_id, container_no, seal_no, size, package_count, gross_weight,
                       matched_shipment_id, matched_shipment_container_id
                FROM operation_manifest_containers
                WHERE manifest_id = ?
                ORDER BY id ASC
            ");
            $manifestContainerQuery->execute([$manifest["id"]]);
            $manifestContainers = $manifestContainerQuery->fetchAll();
        }

        if (count($shipmentContainers) === 0 && count($manifestContainers) > 0) {
            foreach ($manifestContainers as $mc) {
                $containerNo = strtoupper(trim((string) ($mc["container_no"] ?? "")));
                if (!repairContainerFormat($containerNo)) {
                    $containerNo = repairUniqueContainer($conn);
                    $stats["container_numbers_repaired"]++;
                }

                $sealNo = trim((string) ($mc["seal_no"] ?? ""));
                if (repairPlaceholder($sealNo) || strlen($sealNo) < 6) {
                    $sealNo = repairUniqueSeal($conn);
                    $stats["seal_numbers_repaired"]++;
                }

                $size = in_array($mc["size"] ?? "", ["20ft", "40ft", "40ft HC"], true) ? $mc["size"] : "40ft HC";
                $containerId = repairId();

                $insertShipmentContainer->execute([
                    "id" => $containerId,
                    "shipment_id" => $shipmentId,
                    "container_no" => $containerNo,
                    "size" => $size,
                    "seal_no" => $sealNo,
                    "package_count" => (float) ($mc["package_count"] ?? 0),
                    "gross_weight" => (float) ($mc["gross_weight"] ?? 0)
                ]);

                $updateManifestContainer->execute([
                    "container_no" => $containerNo,
                    "seal_no" => $sealNo,
                    "size" => $size,
                    "shipment_id" => $shipmentId,
                    "container_id" => $containerId,
                    "id" => $mc["id"]
                ]);

                $stats["shipment_containers_created"]++;
                $stats["container_links_updated"]++;
            }

            $shipmentContainerQuery->execute([$shipmentId]);
            $shipmentContainers = $shipmentContainerQuery->fetchAll();
        }

        if (count($shipmentContainers) === 0 && !$manifest) {
            $targetCount = random_int(1, 4);
            for ($i = 0; $i < $targetCount; $i++) {
                $containerNo = repairUniqueContainer($conn);
                $sealNo = repairUniqueSeal($conn);
                $containerId = repairId();
                $size = repairPick(["20ft", "40ft", "40ft HC"]);

                $insertShipmentContainer->execute([
                    "id" => $containerId,
                    "shipment_id" => $shipmentId,
                    "container_no" => $containerNo,
                    "size" => $size,
                    "seal_no" => $sealNo,
                    "package_count" => round($packages / $targetCount, 2),
                    "gross_weight" => round($weight / $targetCount, 3)
                ]);

                $stats["shipment_containers_created"]++;
            }

            $shipmentContainerQuery->execute([$shipmentId]);
            $shipmentContainers = $shipmentContainerQuery->fetchAll();
        }

        if ($manifest) {
            $manifestId = (string) $manifest["id"];
            $usedShipmentContainers = [];

            foreach ($manifestContainers as $mc) {
                $matchIndex = null;
                $manifestNumber = strtoupper(trim((string) ($mc["container_no"] ?? "")));

                foreach ($shipmentContainers as $index => $sc) {
                    if (isset($usedShipmentContainers[(string) $sc["id"]])) {
                        continue;
                    }

                    if ($manifestNumber !== "" && strtoupper(trim((string) $sc["container_no"])) === $manifestNumber) {
                        $matchIndex = $index;
                        break;
                    }
                }

                if ($matchIndex === null && count($manifestContainers) === 1 && count($shipmentContainers) === 1) {
                    $matchIndex = 0;
                }

                if ($matchIndex === null) {
                    $stats["unresolved_container_mismatches"][] = [
                        "shipment_id" => $shipmentId,
                        "manifest_id" => $manifestId,
                        "manifest_container_id" => $mc["id"],
                        "reason" => "No unique match by container number."
                    ];
                    continue;
                }

                $sc = $shipmentContainers[$matchIndex];
                $usedShipmentContainers[(string) $sc["id"]] = true;

                $containerNo = strtoupper(trim((string) ($sc["container_no"] ?? "")));
                if (!repairContainerFormat($containerNo)) {
                    $containerNo = repairUniqueContainer($conn);
                    $stats["container_numbers_repaired"]++;
                }

                $sealNo = trim((string) ($sc["seal_no"] ?? ""));
                if (repairPlaceholder($sealNo) || strlen($sealNo) < 6) {
                    $sealNo = repairUniqueSeal($conn);
                    $stats["seal_numbers_repaired"]++;
                }

                $size = in_array($sc["size"] ?? "", ["20ft", "40ft", "40ft HC"], true) ? $sc["size"] : "40ft HC";

                $updateShipmentContainer->execute([
                    "container_no" => $containerNo,
                    "seal_no" => $sealNo,
                    "size" => $size,
                    "id" => $sc["id"]
                ]);

                $updateManifestContainer->execute([
                    "container_no" => $containerNo,
                    "seal_no" => $sealNo,
                    "size" => $size,
                    "shipment_id" => $shipmentId,
                    "container_id" => $sc["id"],
                    "id" => $mc["id"]
                ]);

                $stats["container_links_updated"]++;
            }

            if (count($manifestContainers) === 0 && count($shipmentContainers) > 0) {
                foreach ($shipmentContainers as $sc) {
                    $mcId = repairId();
                    $insertManifestContainer->execute([
                        "id" => $mcId,
                        "manifest_id" => $manifestId,
                        "container_no" => $sc["container_no"],
                        "seal_no" => $sc["seal_no"],
                        "size" => $sc["size"],
                        "package_count" => $sc["package_count"],
                        "gross_weight" => $sc["gross_weight"],
                        "shipment_id" => $shipmentId,
                        "container_id" => $sc["id"]
                    ]);
                    $stats["manifest_containers_created"]++;
                }
                $manifestContainers = [];
            }

            $manifestVessel = repairPlaceholder($manifest["vessel"] ?? null) ? $vessel : $manifest["vessel"];
            $manifestLine = repairPlaceholder($manifest["shipping_line"] ?? null) ? $line : $manifest["shipping_line"];
            $manifestOrigin = repairPlaceholder($manifest["origin_port"] ?? null) ? $origin : $manifest["origin_port"];
            $manifestConsignee = repairPlaceholder($manifest["consignee"] ?? null) ? $consignee : $manifest["consignee"];

            $countStmt = $conn->prepare("SELECT COUNT(*) FROM operation_manifest_containers WHERE manifest_id = ?");
            $countStmt->execute([$manifestId]);
            $manifestCount = (int) $countStmt->fetchColumn();

            $updateManifest->execute([
                "vessel" => $manifestVessel,
                "shipping_line" => $manifestLine,
                "origin_port" => $manifestOrigin,
                "eta" => $arrival,
                "containers" => $manifestCount,
                "packages" => (int) round($packages),
                "gross_weight" => number_format($weight, 3, ".", "") . " kg",
                "consignee" => $manifestConsignee,
                "id" => $manifestId
            ]);

            $stats["manifests_updated"]++;

            if ($manifestCount !== count($shipmentContainers)) {
                $stats["unresolved_container_mismatches"][] = [
                    "shipment_id" => $shipmentId,
                    "manifest_id" => $manifestId,
                    "shipment_container_count" => count($shipmentContainers),
                    "manifest_container_count" => $manifestCount
                ];
            }
        }
    }

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => [
            "message" => "Test shipment records were repaired.",
            "stats" => $stats,
            "notice" => "Values generated by this script are synthetic test data. Do not use them as verified shipping records."
        ],
        "code" => 200
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not repair shipment data.",
        "code" => $e->getMessage()
    ], JSON_UNESCAPED_SLASHES);
}
