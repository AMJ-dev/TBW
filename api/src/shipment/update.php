<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed",
            "code" => null
        ]);
        exit;
    }

    $createdFiles = [];
    $transactionStarted = false;

    try {
        $userId = (string) ($my_details->id ?? "");
        $organisationId = (string) ($my_details->organisation_id ?? "");

        if ($userId === "" || $organisationId === "") {
            echo json_encode([
                "error" => true,
                "data" => "Authentication required.",
                "code" => null
            ]);
            exit;
        }

        $shipmentId = trim((string) ($_GET["id"] ?? ""));

        if ($shipmentId === "") {
            echo json_encode([
                "error" => true,
                "data" => "Shipment ID is required.",
                "code" => null
            ]);
            exit;
        }

        $ownership = $conn->prepare("
            SELECT id, status, shipment_reference
            FROM portal_shipments
            WHERE id = :id
            AND organisation_id = :organisation_id
            LIMIT 1
        ");

        $ownership->execute([
            ":id" => $shipmentId,
            ":organisation_id" => $organisationId
        ]);

        $existingShipment = $ownership->fetch(PDO::FETCH_ASSOC);

        if (!$existingShipment) {
            echo json_encode([
                "error" => true,
                "data" => "Shipment not found or you do not have permission to update it.",
                "code" => null
            ]);
            exit;
        }

        if (!in_array($existingShipment["status"], ["DRAFT", "PENDING_REVIEW", "CHANGES_REQUESTED"], true)) {
            echo json_encode([
                "error" => true,
                "data" => "This shipment can no longer be edited.",
                "code" => ["status" => $existingShipment["status"]]
            ]);
            exit;
        }

        $requestedStatus = trim((string) ($_POST["status"] ?? "PENDING_REVIEW"));

        $status = in_array($requestedStatus, ["DRAFT", "PENDING_REVIEW"], true)
            ? $requestedStatus
            : "PENDING_REVIEW";

        $declarationAccepted = strtolower(trim((string) (
            $_POST["declaration_accepted"] ?? $_POST["declarationAccepted"] ?? "0"
        )));

        if (
            $status === "PENDING_REVIEW" &&
            !in_array($declarationAccepted, ["1", "true", "yes", "on"], true)
        ) {
            throw new InvalidArgumentException(
                "Please accept the shipment declaration before submitting."
            );
        }

        $shipmentType = trim((string) ($_POST["shipment_type"] ?? $_POST["shipmentType"] ?? ""));
        $cargoCategory = trim((string) ($_POST["cargo_category"] ?? $_POST["cargoCategory"] ?? ""));
        $packageType = trim((string) ($_POST["package_type"] ?? $_POST["packageType"] ?? ""));

        if ($shipmentType === "" || $cargoCategory === "" || $packageType === "") {
            throw new InvalidArgumentException(
                "Shipment type, cargo category and packaging type are required."
            );
        }

        $decodeArray = static function ($value, string $field): array {
            if (is_array($value)) {
                return $value;
            }

            if (!is_string($value) || trim($value) === "") {
                return [];
            }

            $decoded = json_decode($value, true);

            if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
                throw new InvalidArgumentException("Invalid " . $field . " data.");
            }

            return $decoded;
        };

        $containers = $decodeArray($_POST["containers"] ?? "[]", "container");
        $documents = $decodeArray($_POST["documents"] ?? "[]", "document");

        $containers = array_map(static function ($item): array {
            if (is_object($item)) {
                $item = (array) $item;
            }

            if (!is_array($item)) {
                throw new InvalidArgumentException("Invalid container entry.");
            }

            return $item;
        }, $containers);

        $documents = array_map(static function ($item): array {
            if (is_object($item)) {
                $item = (array) $item;
            }

            if (!is_array($item)) {
                throw new InvalidArgumentException("Invalid document entry.");
            }

            return $item;
        }, $documents);

        $consignee = trim((string) ($_POST["consignee"] ?? ""));
        $consigneeEmail = trim((string) (
            $_POST["consignee_email"] ?? $_POST["consigneeEmail"] ?? ""
        ));
        $consigneePhone = trim((string) (
            $_POST["consignee_phone"] ?? $_POST["consigneePhone"] ?? ""
        ));

        if (
            $consigneeEmail !== "" &&
            !filter_var($consigneeEmail, FILTER_VALIDATE_EMAIL)
        ) {
            throw new InvalidArgumentException("Invalid consignee email.");
        }

        if ($status === "PENDING_REVIEW" && $consignee === "") {
            throw new InvalidArgumentException("Consignee name is required.");
        }

        $consigneeType = trim((string) (
            $_POST["consignee_type"] ?? $_POST["consigneeType"] ?? "organisation"
        ));

        if (!in_array($consigneeType, ["organisation", "individual"], true)) {
            throw new InvalidArgumentException("Invalid consignee type.");
        }

        $consigneeOrganisationId = trim((string) (
            $_POST["consignee_organisation_id"]
            ?? $_POST["consigneeOrganisationId"]
            ?? ""
        ));

        if (
            $status === "PENDING_REVIEW" &&
            $consigneeType === "organisation" &&
            $consigneeOrganisationId === "" &&
            $consigneeEmail === "" &&
            $consigneePhone === ""
        ) {
            throw new InvalidArgumentException(
                "For an unregistered consignee, provide an email address or phone number."
            );
        }

        $expectedArrival = trim((string) (
            $_POST["expected_arrival"] ?? $_POST["expectedArrival"] ?? ""
        ));

        if ($expectedArrival !== "") {
            $arrivalDate = DateTime::createFromFormat("!Y-m-d", $expectedArrival);

            if (!$arrivalDate || $arrivalDate->format("Y-m-d") !== $expectedArrival) {
                throw new InvalidArgumentException("Invalid expected arrival date.");
            }

            $expectedArrival = $arrivalDate->format("Y-m-d 00:00:00");
        } else {
            $expectedArrival = null;
        }

        $packageCount = $_POST["package_count"] ?? $_POST["packageCount"] ?? "";
        $grossWeight = $_POST["gross_weight"] ?? $_POST["grossWeight"] ?? "";
        $volume = $_POST["volume"] ?? "";

        foreach ([$packageCount, $grossWeight, $volume] as $value) {
            if ($value !== "" && (!is_numeric($value) || (float) $value < 0)) {
                throw new InvalidArgumentException(
                    "Invalid shipment quantity, weight or volume."
                );
            }
        }

        $dangerousGoods = strtolower(trim((string) (
            $_POST["dangerous_goods"] ?? $_POST["dangerousGoods"] ?? "no"
        )));

        $temperatureControlled = strtolower(trim((string) (
            $_POST["temperature_controlled"]
            ?? $_POST["temperatureControlled"]
            ?? "no"
        )));

        if (!in_array($dangerousGoods, ["yes", "no"], true)) {
            throw new InvalidArgumentException("Invalid dangerous goods value.");
        }

        if (!in_array($temperatureControlled, ["yes", "no"], true)) {
            throw new InvalidArgumentException("Invalid temperature-controlled value.");
        }

        $validationQueries = [
            [
                "sql" => "
                    SELECT label
                    FROM terminal_shipment_types
                    WHERE label = :label AND is_active = 1
                    LIMIT 1
                ",
                "value" => $shipmentType,
                "message" => "Invalid shipment type."
            ],
            [
                "sql" => "
                    SELECT label
                    FROM terminal_cargo_categories
                    WHERE label = :label AND is_active = 1
                    LIMIT 1
                ",
                "value" => $cargoCategory,
                "message" => "Invalid cargo category."
            ],
            [
                "sql" => "
                    SELECT label
                    FROM terminal_packaging_types
                    WHERE label = :label AND is_active = 1
                    LIMIT 1
                ",
                "value" => $packageType,
                "message" => "Invalid packaging type."
            ]
        ];

        foreach ($validationQueries as $validation) {
            $query = $conn->prepare($validation["sql"]);
            $query->execute([":label" => $validation["value"]]);

            if (!$query->fetchColumn()) {
                throw new InvalidArgumentException($validation["message"]);
            }
        }

        $validContainers = [];

        foreach ($containers as $container) {
            $containerNo = strtoupper(trim((string) (
                $container["containerNo"] ?? $container["container_no"] ?? ""
            )));

            if ($containerNo !== "") {
                $container["containerNo"] = $containerNo;
                $validContainers[] = $container;
            }
        }

        if (
            $cargoCategory === "Containerised Cargo" &&
            count($validContainers) === 0
        ) {
            throw new InvalidArgumentException(
                "At least one container is required for containerised cargo."
            );
        }

        $requiredDocumentQuery = $conn->prepare("
            SELECT dt.document_key, dt.label
            FROM document_types dt
            INNER JOIN document_upload_location_types dult
                ON dult.document_key = dt.document_key
            INNER JOIN document_upload_locations dul
                ON dul.id = dult.location_id
            WHERE dul.location_key = 'shipment_documents'
            AND dul.is_active = 1
            AND dult.is_required = 1
        ");

        $requiredDocumentQuery->execute();
        $requiredDocuments = $requiredDocumentQuery->fetchAll(PDO::FETCH_ASSOC);

        $documentRuleQuery = $conn->prepare("
            SELECT dt.document_key, dt.label, dult.is_required, dult.allow_multiple
            FROM document_types dt
            INNER JOIN document_upload_location_types dult
                ON dult.document_key = dt.document_key
            INNER JOIN document_upload_locations dul
                ON dul.id = dult.location_id
            WHERE dul.location_key = 'shipment_documents'
            AND dul.is_active = 1
            AND dt.document_key = :document_key
            LIMIT 1
        ");

        $documentCounts = [];
        $documentIndexes = [];

        foreach ($documents as $document) {
            if (
                !empty($document["existing"]) ||
                (!empty($document["id"]) && !array_key_exists("index", $document))
            ) {
                continue;
            }

            $documentKey = trim((string) (
                $document["type"] ?? $document["document_key"] ?? ""
            ));

            $index = filter_var(
                $document["index"] ?? null,
                FILTER_VALIDATE_INT
            );

            if ($documentKey === "" || $index === false || $index < 0) {
                throw new InvalidArgumentException("Invalid document type or index.");
            }

            if (isset($documentIndexes[$index])) {
                throw new InvalidArgumentException("Duplicate document upload index.");
            }

            $documentIndexes[$index] = true;

            $documentRuleQuery->execute([
                ":document_key" => $documentKey
            ]);

            $rule = $documentRuleQuery->fetch(PDO::FETCH_ASSOC);

            if (!$rule) {
                throw new InvalidArgumentException(
                    "Invalid supporting document type: " . $documentKey . "."
                );
            }

            $documentCounts[$documentKey] =
                ($documentCounts[$documentKey] ?? 0) + 1;

            if (
                (int) $rule["allow_multiple"] === 0 &&
                $documentCounts[$documentKey] > 1
            ) {
                throw new InvalidArgumentException(
                    "Only one file is allowed for " . $rule["label"] . "."
                );
            }
        }

        if ($status === "PENDING_REVIEW") {
            foreach ($requiredDocuments as $requiredDocument) {
                $key = $requiredDocument["document_key"];
                $alreadyUploaded = false;

                if (empty($documentCounts[$key])) {
                    $existingDoc = $conn->prepare("
                        SELECT 1
                        FROM portal_shipment_documents
                        WHERE shipment_id = :shipment_id
                        AND document_type = :document_type
                        LIMIT 1
                    ");

                    $existingDoc->execute([
                        ":shipment_id" => $shipmentId,
                        ":document_type" => $requiredDocument["label"]
                    ]);

                    $alreadyUploaded = (bool) $existingDoc->fetchColumn();
                }

                if (empty($documentCounts[$key]) && !$alreadyUploaded) {
                    throw new InvalidArgumentException(
                        "Missing required document: " .
                        $requiredDocument["label"] . "."
                    );
                }
            }
        }

        $licensedAgentId = trim((string) (
            $_POST["agentId"]
            ?? $_POST["licensed_agent_id"]
            ?? $_POST["licensedAgentId"]
            ?? ""
        ));

        $licensedAgentName = trim((string) (
            $_POST["agent"]
            ?? $_POST["licensed_agent"]
            ?? $_POST["licensed_agent_name"]
            ?? $_POST["licensedAgentName"]
            ?? ""
        ));

        $conn->beginTransaction();
        $transactionStarted = true;

        $updateShipment = $conn->prepare("
            UPDATE portal_shipments
            SET
                shipment_type = :shipment_type,
                bill_of_lading = :bill_of_lading,
                booking_number = :booking_number,
                vessel_name = :vessel_name,
                voyage_number = :voyage_number,
                shipping_line = :shipping_line,
                origin_port = :origin_port,
                destination_port = :destination_port,
                expected_arrival = :expected_arrival,
                consignee = :consignee,
                consignee_email = :consignee_email,
                consignee_phone = :consignee_phone,
                consignee_type = :consignee_type,
                consignee_organisation_id = :consignee_organisation_id,
                licensed_agent_id = :licensed_agent_id,
                licensed_agent_name = :licensed_agent_name,
                cargo_description = :cargo_description,
                cargo_category = :cargo_category,
                package_type = :package_type,
                package_count = :package_count,
                gross_weight = :gross_weight,
                volume = :volume,
                dangerous_goods = :dangerous_goods,
                temperature_controlled = :temperature_controlled,
                temperature = :temperature,
                special_instructions = :special_instructions,
                status = :status,
                updated_at = NOW()
            WHERE id = :shipment_id
            AND organisation_id = :organisation_id
        ");

        $updateShipment->execute([
            ":shipment_type" => $shipmentType,
            ":bill_of_lading" => $_POST["bill_of_lading"] ?? "",
            ":booking_number" => $_POST["booking_number"] ?? "",
            ":vessel_name" => $_POST["vessel_name"] ?? "",
            ":voyage_number" => $_POST["voyage_number"] ?? "",
            ":shipping_line" => $_POST["shipping_line"] ?? "",
            ":origin_port" => $_POST["origin_port"] ?? "",
            ":destination_port" => $_POST["destination_port"] ?? "",
            ":expected_arrival" => $expectedArrival,
            ":consignee" => $consignee,
            ":consignee_email" => $consigneeEmail,
            ":consignee_phone" => $consigneePhone,
            ":consignee_type" => $consigneeType,
            ":consignee_organisation_id" => $consigneeOrganisationId !== "" ? $consigneeOrganisationId : null,
            ":licensed_agent_id" => $licensedAgentId !== "" ? $licensedAgentId : null,
            ":licensed_agent_name" => $licensedAgentName !== "" ? $licensedAgentName : null,
            ":cargo_description" => $_POST["cargo_description"] ?? "",
            ":cargo_category" => $cargoCategory,
            ":package_type" => $packageType,
            ":package_count" => $packageCount === "" ? 0 : $packageCount,
            ":gross_weight" => $grossWeight === "" ? 0 : $grossWeight,
            ":volume" => $volume === "" ? 0 : $volume,
            ":dangerous_goods" => $dangerousGoods,
            ":temperature_controlled" => $temperatureControlled,
            ":temperature" => $_POST["temperature"] ?? null,
            ":special_instructions" => $_POST["special_instructions"] ?? "",
            ":status" => $status,
            ":shipment_id" => $shipmentId,
            ":organisation_id" => $organisationId
        ]);

        $existingContainersQuery = $conn->prepare("
            SELECT id, container_no
            FROM portal_shipment_containers
            WHERE shipment_id = :shipment_id
        ");

        $existingContainersQuery->execute([
            ":shipment_id" => $shipmentId
        ]);

        $existingContainers = $existingContainersQuery->fetchAll(PDO::FETCH_ASSOC);
        $existingContainerNumbers = [];

        foreach ($existingContainers as $existingContainer) {
            $existingContainerNumbers[
                strtoupper(trim((string) $existingContainer["container_no"]))
            ] = $existingContainer["id"];
        }

        $containerInsert = $conn->prepare("
            INSERT INTO portal_shipment_containers (
                id,
                shipment_id,
                container_no,
                size,
                seal_no,
                package_count,
                gross_weight,
                customs_tariff_id,
                cargo_description,
                package_type,
                hs_code,
                item_quantity,
                unit_of_measure,
                unit_value,
                currency,
                total_value
            ) VALUES (
                :id,
                :shipment_id,
                :container_no,
                :size,
                :seal_no,
                :package_count,
                :gross_weight,
                :customs_tariff_id,
                :cargo_description,
                :package_type,
                :hs_code,
                :item_quantity,
                :unit_of_measure,
                :unit_value,
                :currency,
                :total_value
            )
        ");

        $containerUpdate = $conn->prepare("
            UPDATE portal_shipment_containers SET
                container_no = :container_no,
                size = :size,
                seal_no = :seal_no,
                package_count = :package_count,
                gross_weight = :gross_weight,
                customs_tariff_id = :customs_tariff_id,
                cargo_description = :cargo_description,
                package_type = :package_type,
                hs_code = :hs_code,
                item_quantity = :item_quantity,
                unit_of_measure = :unit_of_measure,
                unit_value = :unit_value,
                currency = :currency,
                total_value = :total_value
            WHERE id = :id
            AND shipment_id = :shipment_id
        ");

        $tariffByIdQuery = $conn->prepare("
            SELECT id, hs_code, description
            FROM customs_tariffs
            WHERE id = :id
            AND status = 'ACTIVE'
            AND effective_from <= CURDATE()
            AND (effective_to IS NULL OR effective_to >= CURDATE())
            LIMIT 1
        ");

        $tariffByHsCodeQuery = $conn->prepare("
            SELECT id, hs_code, description
            FROM customs_tariffs
            WHERE hs_code = :hs_code
            AND status = 'ACTIVE'
            AND effective_from <= CURDATE()
            AND (effective_to IS NULL OR effective_to >= CURDATE())
            ORDER BY effective_from DESC
            LIMIT 1
        ");

        $containerNumbers = [];
        $processedContainerIds = [];

        foreach ($validContainers as $container) {
            $containerNo = strtoupper(trim((string) (
                $container["containerNo"] ?? $container["container_no"] ?? ""
            )));

            if (isset($containerNumbers[$containerNo])) {
                throw new InvalidArgumentException("Duplicate container number.");
            }

            $containerNumbers[$containerNo] = true;

            $containerSize = trim((string) (
                $container["size"] ?? $container["containerSize"] ?? ""
            )) ?: null;

            if ($containerSize !== null) {
                $sizeCheck = $conn->prepare("
                    SELECT label
                    FROM terminal_container_sizes
                    WHERE label = :label
                    AND is_active = 1
                    LIMIT 1
                ");

                $sizeCheck->execute([
                    ":label" => $containerSize
                ]);

                if (!$sizeCheck->fetchColumn()) {
                    throw new InvalidArgumentException(
                        "Invalid container size: " . $containerSize . "."
                    );
                }
            }

            $containerCount = $container["packageCount"]
                ?? $container["package_count"]
                ?? "";

            $containerWeight = $container["grossWeight"]
                ?? $container["gross_weight"]
                ?? "";

            foreach ([$containerCount, $containerWeight] as $number) {
                if (
                    $number !== "" &&
                    (!is_numeric($number) || (float) $number < 0)
                ) {
                    throw new InvalidArgumentException(
                        "Invalid container quantity or weight."
                    );
                }
            }

            $sealNo = trim((string) (
                $container["sealNo"] ?? $container["seal_no"] ?? ""
            )) ?: null;

            $cargoDescription = trim((string) (
                $container["cargoDescription"]
                ?? $container["cargo_description"]
                ?? ""
            ));

            $containerPackageType = trim((string) (
                $container["packageType"]
                ?? $container["package_type"]
                ?? $packageType
            ));

            $hsCode = trim((string) (
                $container["hsCode"] ?? $container["hs_code"] ?? ""
            ));

            $tariffId = trim((string) (
                $container["customsTariffId"]
                ?? $container["customs_tariff_id"]
                ?? ""
            ));

            $itemQuantity = $container["itemQuantity"]
                ?? $container["item_quantity"]
                ?? $containerCount;

            $unitOfMeasure = trim((string) (
                $container["unitOfMeasure"]
                ?? $container["unit_of_measure"]
                ?? $containerPackageType
            ));

            $unitValue = $container["unitValue"]
                ?? $container["unit_value"]
                ?? 0;

            $currency = strtoupper(trim((string) (
                $container["currency"] ?? "NGN"
            )));

            if (
                $itemQuantity !== "" &&
                (!is_numeric($itemQuantity) || (float) $itemQuantity < 0)
            ) {
                throw new InvalidArgumentException(
                    "Invalid cargo quantity for container " . $containerNo . "."
                );
            }

            if (!is_numeric($unitValue) || (float) $unitValue < 0) {
                throw new InvalidArgumentException(
                    "Invalid cargo unit value for container " . $containerNo . "."
                );
            }

            if (!preg_match('/^[A-Z]{3}$/', $currency)) {
                throw new InvalidArgumentException(
                    "Use a valid three-letter currency code for container " .
                    $containerNo . "."
                );
            }

            $tariff = null;

            if ($tariffId !== "") {
                $tariffByIdQuery->execute([
                    ":id" => $tariffId
                ]);

                $tariff = $tariffByIdQuery->fetch(PDO::FETCH_ASSOC) ?: null;
            } elseif ($hsCode !== "") {
                $tariffByHsCodeQuery->execute([
                    ":hs_code" => $hsCode
                ]);

                $tariff = $tariffByHsCodeQuery->fetch(PDO::FETCH_ASSOC) ?: null;
            }

            if ($tariffId !== "" && !$tariff) {
                throw new InvalidArgumentException(
                    "The selected customs tariff is invalid, inactive, or outside its effective dates for container " .
                    $containerNo . "."
                );
            }

            if (
                $status === "PENDING_REVIEW" &&
                $cargoCategory === "Containerised Cargo"
            ) {
                if ($cargoDescription === "") {
                    throw new InvalidArgumentException(
                        "Cargo description is required for container " .
                        $containerNo . "."
                    );
                }

                if (!$tariff) {
                    throw new InvalidArgumentException(
                        "Select a valid customs tariff for container " .
                        $containerNo . "."
                    );
                }

                if (
                    $hsCode !== "" &&
                    strcasecmp($hsCode, (string) $tariff["hs_code"]) !== 0
                ) {
                    throw new InvalidArgumentException(
                        "The HS code does not match the selected customs tariff for container " .
                        $containerNo . "."
                    );
                }
            }

            if ($tariff) {
                $tariffId = (string) $tariff["id"];
                $hsCode = (string) $tariff["hs_code"];

                if ($cargoDescription === "") {
                    $cargoDescription = (string) $tariff["description"];
                }
            } else {
                $tariffId = "";
            }

            $itemQuantityValue = $itemQuantity === ""
                ? null
                : (float) $itemQuantity;

            $unitValueNumber = (float) $unitValue;

            $totalValue = round(
                ($itemQuantityValue ?? 0) * $unitValueNumber,
                2
            );

            $containerData = [
                ":shipment_id" => $shipmentId,
                ":container_no" => $containerNo,
                ":size" => $containerSize,
                ":seal_no" => $sealNo,
                ":package_count" => $containerCount === "" ? null : $containerCount,
                ":gross_weight" => $containerWeight === "" ? null : $containerWeight,
                ":customs_tariff_id" => $tariffId !== "" ? $tariffId : null,
                ":cargo_description" => $cargoDescription !== "" ? $cargoDescription : null,
                ":package_type" => $containerPackageType !== "" ? $containerPackageType : null,
                ":hs_code" => $hsCode !== "" ? $hsCode : null,
                ":item_quantity" => $itemQuantityValue,
                ":unit_of_measure" => $unitOfMeasure !== "" ? $unitOfMeasure : null,
                ":unit_value" => $unitValueNumber,
                ":currency" => $currency,
                ":total_value" => $totalValue
            ];

            if (isset($existingContainerNumbers[$containerNo])) {
                $containerId = $existingContainerNumbers[$containerNo];
                $containerData[":id"] = $containerId;
                $containerUpdate->execute($containerData);
            } else {
                $containerId = generateId();
                $containerData[":id"] = $containerId;
                $containerInsert->execute($containerData);
            }

            $processedContainerIds[] = $containerId;
        }

        if (count($processedContainerIds) > 0) {
            $placeholders = implode(
                ",",
                array_fill(0, count($processedContainerIds), "?")
            );

            $deleteRemovedContainers = $conn->prepare("
                DELETE FROM portal_shipment_containers
                WHERE shipment_id = ?
                AND id NOT IN ($placeholders)
            ");

            $deleteRemovedContainers->execute([
                $shipmentId,
                ...$processedContainerIds
            ]);
        } else {
            $deleteRemovedContainers = $conn->prepare("
                DELETE FROM portal_shipment_containers
                WHERE shipment_id = ?
            ");

            $deleteRemovedContainers->execute([$shipmentId]);
        }

        $documentInsert = $conn->prepare("
            INSERT INTO portal_shipment_documents (
                id,
                shipment_id,
                document_type,
                original_name,
                stored_name,
                file_path,
                mime_type,
                file_size
            ) VALUES (
                :id,
                :shipment_id,
                :document_type,
                :original_name,
                :stored_name,
                :file_path,
                :mime_type,
                :file_size
            )
        ");

        $finfo = new finfo(FILEINFO_MIME_TYPE);

        $allowedMimeTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png"
        ];

        $maxFileSize = 10 * 1024 * 1024;

        foreach ($documents as $document) {
            if (
                !empty($document["existing"]) ||
                (!empty($document["id"]) && !array_key_exists("index", $document))
            ) {
                continue;
            }

            $index = filter_var(
                $document["index"] ?? null,
                FILTER_VALIDATE_INT
            );

            if ($index === false || $index < 0) {
                throw new InvalidArgumentException("Invalid document upload index.");
            }

            $documentKey = trim((string) (
                $document["type"] ?? $document["document_key"] ?? ""
            ));

            $uploadKey = "document_file_" . $index;

            if (!isset($_FILES[$uploadKey])) {
                throw new InvalidArgumentException(
                    "A supporting document was not uploaded."
                );
            }

            if ($_FILES[$uploadKey]["error"] !== UPLOAD_ERR_OK) {
                throw new InvalidArgumentException(
                    "The supporting document upload failed."
                );
            }

            $file = $_FILES[$uploadKey];

            if (
                !is_uploaded_file($file["tmp_name"]) ||
                $file["size"] <= 0 ||
                $file["size"] > $maxFileSize
            ) {
                throw new InvalidArgumentException(
                    "Each supporting document must be no larger than 10 MB."
                );
            }

            $mimeType = $finfo->file($file["tmp_name"]);

            if (!in_array($mimeType, $allowedMimeTypes, true)) {
                throw new InvalidArgumentException(
                    "Only PDF, JPEG and PNG documents are allowed."
                );
            }

            $documentRuleQuery->execute([
                ":document_key" => $documentKey
            ]);

            $rule = $documentRuleQuery->fetch(PDO::FETCH_ASSOC);

            if (!$rule) {
                throw new InvalidArgumentException(
                    "Invalid supporting document type."
                );
            }

            $documentLabel = $rule["label"];
            $originalName = basename($file["name"]);

            $upload = upload_files($file, $allowedMimeTypes);

            if (!is_array($upload) || !empty($upload["error"])) {
                throw new InvalidArgumentException(
                    is_array($upload)
                        ? ($upload["data"] ?? "Unable to upload the supporting document.")
                        : "Unable to upload the supporting document."
                );
            }

            $targetPath = $upload["data"] ?? "";

            if (!is_string($targetPath) || $targetPath === "") {
                throw new RuntimeException(
                    "The uploaded file path was not returned."
                );
            }

            $createdFiles[] = $targetPath;
            $storedName = basename($targetPath);

            $documentInsert->execute([
                ":id" => generateId(),
                ":shipment_id" => $shipmentId,
                ":document_type" => $documentLabel,
                ":original_name" => $originalName,
                ":stored_name" => $storedName,
                ":file_path" => $targetPath,
                ":mime_type" => $mimeType,
                ":file_size" => $file["size"]
            ]);
        }

        $reviewStmt = $conn->prepare("
            UPDATE operation_manifests
            SET status = 'Review required'
            WHERE matched_shipment_id = :shipment_id
            AND status = 'Discrepancy'
        ");

        $reviewStmt->execute([
            ":shipment_id" => $shipmentId
        ]);

        $conn->commit();
        $transactionStarted = false;

        echo json_encode([
            "error" => false,
            "data" => "Shipment updated successfully.",
            "code" => [
                "id" => $shipmentId,
                "shipment_id" => $shipmentId,
                "shipment_reference" => $existingShipment["shipment_reference"] ?? null,
                "status" => $status
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    } catch (InvalidArgumentException $e) {
        if ($transactionStarted && $conn->inTransaction()) {
            $conn->rollBack();
        }

        foreach ($createdFiles as $file) {
            delete_file($file);
        }

        echo json_encode([
            "error" => true,
            "data" => $e->getMessage(),
            "code" => null
        ]);

    } catch (Throwable $e) {
        if ($transactionStarted && $conn->inTransaction()) {
            $conn->rollBack();
        }

        foreach ($createdFiles as $file) {
            delete_file($file);
        }

        echo json_encode([
            "error" => true,
            "data" => "Could not save the shipment.",
            "code" => $e->getMessage()
        ]);
    }