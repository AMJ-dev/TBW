<?php
    require_once dirname(__DIR__, 2) . "/include/set-header.php";

    header("Content-Type: application/json; charset=utf-8");

    function quote_string($value, $max = 255) {
        if (!is_scalar($value)) {
            return "";
        }

        return mb_substr(trim((string)$value), 0, $max);
    }

    function quote_number($value, $allowZero = true) {
        if (!is_scalar($value) || trim((string)$value) === "" || !is_numeric($value)) {
            return null;
        }

        $number = (float)$value;

        if (!is_finite($number) || $number < 0 || (!$allowZero && $number <= 0)) {
            return null;
        }

        return $number;
    }

    function quote_reference(PDO $conn) {
        do {
            $reference = "TRN-Q-" . date("Ymd") . "-" . strtoupper(bin2hex(random_bytes(3)));

            $check = $conn->prepare("
                SELECT id
                FROM portal_quote_requests
                WHERE quote_reference = ?
                LIMIT 1
            ");
            $check->execute([$reference]);
        } while ($check->fetch(PDO::FETCH_ASSOC));

        return $reference;
    }

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed.",
            "code" => null
        ]);
        exit;
    }

    $companyName = quote_string($_POST["company_name"] ?? "", 255);
    $contactPerson = quote_string($_POST["contact_person"] ?? "", 255);
    $email = quote_string($_POST["email"] ?? "", 255);
    $phone = quote_string($_POST["phone"] ?? "", 50);
    $billOfLading = quote_string($_POST["bill_of_lading"] ?? "", 150);
    $vesselName = quote_string($_POST["vessel_name"] ?? "", 255);
    $voyageNumber = quote_string($_POST["voyage_number"] ?? "", 100);
    $origin = quote_string($_POST["origin"] ?? "", 255);
    $destination = quote_string($_POST["destination"] ?? "", 255);
    $expectedArrival = quote_string($_POST["expected_arrival"] ?? "", 10);
    $cargoCategory = quote_string($_POST["cargo_category"] ?? "", 100);
    $requirements = quote_string($_POST["requirements"] ?? "", 10000);

    $containers = $_POST["containers"] ?? [];
    $services = $_POST["services"] ?? [];

    if (
        $companyName === "" ||
        $contactPerson === "" ||
        $email === "" ||
        $phone === "" ||
        $billOfLading === ""
    ) {
        echo json_encode([
            "error" => true,
            "data" => "Complete the company, contact, email, phone and bill of lading fields.",
            "code" => null
        ]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            "error" => true,
            "data" => "Enter a valid email address.",
            "code" => null
        ]);
        exit;
    }

    if (!is_array($containers) || count($containers) < 1) {
        echo json_encode([
            "error" => true,
            "data" => "Add at least one container.",
            "code" => null
        ]);
        exit;
    }

    if (count($containers) > 100) {
        echo json_encode([
            "error" => true,
            "data" => "A maximum of 100 containers can be submitted at once.",
            "code" => null
        ]);
        exit;
    }

    if (!is_array($services)) {
        $services = [];
    }

    if ($expectedArrival !== "") {
        $date = DateTime::createFromFormat("Y-m-d", $expectedArrival);

        if (!$date || $date->format("Y-m-d") !== $expectedArrival) {
            echo json_encode([
                "error" => true,
                "data" => "The expected arrival date is invalid.",
                "code" => null
            ]);
            exit;
        }
    } else {
        $expectedArrival = null;
    }

    $normalisedContainers = [];
    $tariffIds = [];

    foreach ($containers as $containerIndex => $container) {
        if (!is_array($container)) {
            echo json_encode([
                "error" => true,
                "data" => "Invalid container details.",
                "code" => null
            ]);
            exit;
        }

        $containerNo = quote_string($container["container_no"] ?? "", 100);
        $containerSize = quote_string($container["size"] ?? "", 30);
        $sealNo = quote_string($container["seal_no"] ?? "", 100);
        $packageCount = quote_number($container["package_count"] ?? "0");
        $grossWeight = quote_number($container["gross_weight"] ?? "0");
        $items = $container["items"] ?? [];

        if ($containerNo === "") {
            echo json_encode([
                "error" => true,
                "data" => "Enter the container number for container " . ($containerIndex + 1) . ".",
                "code" => null
            ]);
            exit;
        }

        if (!is_array($items) || count($items) < 1) {
            echo json_encode([
                "error" => true,
                "data" => "Add at least one cargo item to container " . ($containerIndex + 1) . ".",
                "code" => null
            ]);
            exit;
        }

        if (count($items) > 500) {
            echo json_encode([
                "error" => true,
                "data" => "Too many cargo items in container " . ($containerIndex + 1) . ".",
                "code" => null
            ]);
            exit;
        }

        if ($packageCount === null || $grossWeight === null) {
            echo json_encode([
                "error" => true,
                "data" => "Package count and gross weight must be valid numbers.",
                "code" => null
            ]);
            exit;
        }

        $normalisedItems = [];

        foreach ($items as $itemIndex => $item) {
            if (!is_array($item)) {
                echo json_encode([
                    "error" => true,
                    "data" => "Invalid cargo item in container " . ($containerIndex + 1) . ".",
                    "code" => null
                ]);
                exit;
            }

            $tariffId = quote_string($item["customs_tariff_id"] ?? "", 64);
            $hsCode = quote_string($item["hs_code"] ?? "", 50);
            $description = quote_string($item["item_description"] ?? "", 2000);
            $quantity = quote_number($item["quantity"] ?? null, false);
            $unit = quote_string($item["unit_of_measure"] ?? "", 50);
            $unitValue = quote_number($item["unit_value"] ?? "0");
            $currency = strtoupper(quote_string($item["currency"] ?? "NGN", 3));

            if (
                $tariffId === "" ||
                $hsCode === "" ||
                $description === "" ||
                $quantity === null ||
                $unit === "" ||
                $unitValue === null ||
                !in_array($currency, ["NGN", "USD"], true)
            ) {
                echo json_encode([
                    "error" => true,
                    "data" => "Complete the tariff, description, quantity, unit, value and currency for item " . ($itemIndex + 1) . " in container " . ($containerIndex + 1) . ".",
                    "code" => null
                ]);
                exit;
            }

            $totalValue = round($quantity * $unitValue, 4);

            $normalisedItems[] = [
                "customs_tariff_id" => $tariffId,
                "hs_code" => $hsCode,
                "item_description" => $description,
                "quantity" => $quantity,
                "unit_of_measure" => $unit,
                "unit_value" => $unitValue,
                "currency" => $currency,
                "total_value" => $totalValue
            ];

            $tariffIds[] = $tariffId;
        }

        $normalisedContainers[] = [
            "container_no" => $containerNo,
            "container_size" => $containerSize,
            "seal_no" => $sealNo,
            "package_count" => $packageCount,
            "gross_weight" => $grossWeight,
            "items" => $normalisedItems
        ];
    }

    try {
        $tariffIds = array_values(array_unique($tariffIds));
        $tariffCheck = $conn->prepare("
            SELECT id, hs_code
            FROM customs_tariffs
            WHERE id = ?
            LIMIT 1
        ");

        foreach ($normalisedContainers as $container) {
            foreach ($container["items"] as $item) {
                $tariffCheck->execute([$item["customs_tariff_id"]]);
                $tariff = $tariffCheck->fetch(PDO::FETCH_ASSOC);

                if (!$tariff) {
                    echo json_encode([
                        "error" => true,
                        "data" => "One of the selected customs tariffs could not be found. Refresh the tariff selection and try again.",
                        "code" => null
                    ]);
                    exit;
                }

                if (trim((string)$tariff["hs_code"]) !== $item["hs_code"]) {
                    echo json_encode([
                        "error" => true,
                        "data" => "A selected tariff does not match its HS code. Refresh the tariff selection and try again.",
                        "code" => null
                    ]);
                    exit;
                }
            }
        }

        $conn->beginTransaction();

        $quoteId = generateId();
        $reference = quote_reference($conn);

        $insertQuote = $conn->prepare("
            INSERT INTO portal_quote_requests (
                id,
                quote_reference,
                company_name,
                contact_person,
                email,
                phone,
                bill_of_lading,
                vessel_name,
                voyage_number,
                origin,
                destination,
                expected_arrival,
                cargo_category,
                requirements,
                containers_count,
                status
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED'
            )
        ");

        $insertQuote->execute([
            $quoteId,
            $reference,
            $companyName,
            $contactPerson,
            $email,
            $phone,
            $billOfLading,
            $vesselName !== "" ? $vesselName : null,
            $voyageNumber !== "" ? $voyageNumber : null,
            $origin !== "" ? $origin : null,
            $destination !== "" ? $destination : null,
            $expectedArrival,
            $cargoCategory !== "" ? $cargoCategory : null,
            $requirements !== "" ? $requirements : null,
            count($normalisedContainers)
        ]);

        $insertContainer = $conn->prepare("
            INSERT INTO portal_quote_containers (
                id,
                quote_request_id,
                container_no,
                container_size,
                seal_no,
                package_count,
                gross_weight,
                position
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $insertItem = $conn->prepare("
            INSERT INTO portal_quote_items (
                id,
                container_id,
                customs_tariff_id,
                hs_code,
                item_description,
                quantity,
                unit_of_measure,
                unit_value,
                currency,
                total_value,
                position
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        foreach ($normalisedContainers as $containerIndex => $container) {
            $containerId = generateId();

            $insertContainer->execute([
                $containerId,
                $quoteId,
                $container["container_no"],
                $container["container_size"] !== "" ? $container["container_size"] : null,
                $container["seal_no"] !== "" ? $container["seal_no"] : null,
                $container["package_count"],
                $container["gross_weight"],
                $containerIndex
            ]);

            foreach ($container["items"] as $itemIndex => $item) {
                $insertItem->execute([
                    generateId(),
                    $containerId,
                    $item["customs_tariff_id"],
                    $item["hs_code"],
                    $item["item_description"],
                    $item["quantity"],
                    $item["unit_of_measure"],
                    $item["unit_value"],
                    $item["currency"],
                    $item["total_value"],
                    $itemIndex
                ]);
            }
        }

        $insertService = $conn->prepare("
            INSERT INTO portal_quote_services (
                id,
                quote_request_id,
                service_name
            ) VALUES (?, ?, ?)
        ");

        $savedServices = [];

        foreach ($services as $service) {
            $serviceName = quote_string($service, 255);

            if ($serviceName === "") {
                continue;
            }

            if (in_array($serviceName, $savedServices, true)) {
                continue;
            }

            $insertService->execute([
                generateId(),
                $quoteId,
                $serviceName
            ]);

            $savedServices[] = $serviceName;
        }

        $insertQueue = $conn->prepare("
            INSERT INTO portal_quote_email_queue (
                id,
                quote_request_id,
                recipient_email,
                recipient_name,
                subject,
                status,
                attempts,
                max_attempts,
                next_attempt_at
            ) VALUES (?, ?, ?, ?, ?, 'PENDING', 0, 5, NOW())
        ");

        $insertQueue->execute([
            generateId(),
            $quoteId,
            $email,
            $contactPerson,
            "We received your Trinu quote request - " . $reference
        ]);

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Your quote request has been received successfully.",
            "code" => [
                "id" => $quoteId,
                "quote_reference" => $reference
            ]
        ]);
        exit;

    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log("Quote request save error: " . $e->getMessage());

        http_response_code(500);
        echo json_encode([
            "error" => true,
            "data" => "Could not save your quote request. Please try again.",
            "code" => null
        ]);
        exit;
    }