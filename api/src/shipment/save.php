<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
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

    if ($userId === "") {
        http_response_code(401);
        echo json_encode([
            "error" => true,
            "data" => "Authentication required.",
            "code" => null
        ]);
        exit;
    }

    if (($_POST["declaration_accepted"] ?? "0") !== "1") {
        throw new InvalidArgumentException("Please accept the shipment declaration before submitting.");
    }

    $shipmentType = trim($_POST["shipment_type"] ?? "");
    $cargoCategory = trim($_POST["cargo_category"] ?? "");
    $packageType = trim($_POST["package_type"] ?? "");

    if ($shipmentType === "" || $cargoCategory === "" || $packageType === "") {
        throw new InvalidArgumentException(
            "Shipment type, cargo category and packaging type are required."
        );
    }

    $containers = json_decode($_POST["containers"] ?? "[]", true);
    $documents = json_decode($_POST["documents"] ?? "[]", true);

    if (!is_array($containers) || !is_array($documents)) {
        throw new InvalidArgumentException("Invalid container or document data.");
    }

    $consigneeEmail = trim($_POST["consignee_email"] ?? "");

    if ($consigneeEmail !== "" && !filter_var($consigneeEmail, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException("Invalid consignee email.");
    }

    $expectedArrival = trim($_POST["expected_arrival"] ?? "");

    if ($expectedArrival !== "") {
        $arrivalDate = DateTime::createFromFormat("!Y-m-d", $expectedArrival);

        if (!$arrivalDate || $arrivalDate->format("Y-m-d") !== $expectedArrival) {
            throw new InvalidArgumentException("Invalid expected arrival date.");
        }

        $expectedArrival = $arrivalDate->format("Y-m-d 00:00:00");
    } else {
        $expectedArrival = null;
    }

    foreach (["package_count", "gross_weight", "volume"] as $field) {
        $value = $_POST[$field] ?? "";

        if ($value !== "" && (!is_numeric($value) || (float) $value < 0)) {
            throw new InvalidArgumentException(
                "Invalid numeric value for " . $field . "."
            );
        }
    }

    $dangerousGoods = $_POST["dangerous_goods"] ?? "no";
    $temperatureControlled = $_POST["temperature_controlled"] ?? "no";

    if (!in_array($dangerousGoods, ["yes", "no"], true)) {
        throw new InvalidArgumentException("Invalid dangerous goods value.");
    }

    if (!in_array($temperatureControlled, ["yes", "no"], true)) {
        throw new InvalidArgumentException("Invalid temperature-controlled value.");
    }

    $q = $conn->prepare("
        SELECT label
        FROM terminal_shipment_types
        WHERE label = :label AND is_active = 1
        LIMIT 1
    ");
    $q->bindValue(":label", $shipmentType);
    $q->execute();

    if (!$q->fetchColumn()) {
        throw new InvalidArgumentException("Invalid shipment type.");
    }

    $q = $conn->prepare("
        SELECT label
        FROM terminal_cargo_categories
        WHERE label = :label AND is_active = 1
        LIMIT 1
    ");
    $q->bindValue(":label", $cargoCategory);
    $q->execute();

    if (!$q->fetchColumn()) {
        throw new InvalidArgumentException("Invalid cargo category.");
    }

    $q = $conn->prepare("
        SELECT label
        FROM terminal_packaging_types
        WHERE label = :label AND is_active = 1
        LIMIT 1
    ");
    $q->bindValue(":label", $packageType);
    $q->execute();

    if (!$q->fetchColumn()) {
        throw new InvalidArgumentException("Invalid packaging type.");
    }

    $validContainers = [];

    foreach ($containers as $container) {
        if (!is_array($container)) {
            throw new InvalidArgumentException("Invalid container entry.");
        }

        $containerNo = strtoupper(trim(
            $container["containerNo"] ?? $container["container_no"] ?? ""
        ));

        if ($containerNo !== "") {
            $validContainers[] = $container;
        }
    }

    if ($cargoCategory === "Containerised Cargo" && count($validContainers) === 0) {
        throw new InvalidArgumentException(
            "At least one container is required for containerised cargo."
        );
    }

    $rq = $conn->prepare("
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
    $rq->execute();
    $requiredDocuments = $rq->fetchAll(PDO::FETCH_ASSOC);

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
        if (!is_array($document)) {
            throw new InvalidArgumentException("Invalid document entry.");
        }

        $documentKey = trim($document["type"] ?? "");
        $index = filter_var($document["index"] ?? null, FILTER_VALIDATE_INT);

        if ($documentKey === "" || $index === false || $index < 0) {
            throw new InvalidArgumentException("Invalid document type or index.");
        }

        if (isset($documentIndexes[$index])) {
            throw new InvalidArgumentException("Duplicate document upload index.");
        }

        $documentIndexes[$index] = true;

        $documentRuleQuery->bindValue(":document_key", $documentKey);
        $documentRuleQuery->execute();
        $rule = $documentRuleQuery->fetch(PDO::FETCH_ASSOC);

        if (!$rule) {
            throw new InvalidArgumentException(
                "Invalid supporting document type: " . $documentKey . "."
            );
        }

        $documentCounts[$documentKey] = ($documentCounts[$documentKey] ?? 0) + 1;

        if (
            (int) $rule["allow_multiple"] === 0 &&
            $documentCounts[$documentKey] > 1
        ) {
            throw new InvalidArgumentException(
                "Only one file is allowed for " . $rule["label"] . "."
            );
        }
    }

    foreach ($requiredDocuments as $requiredDocument) {
        $key = $requiredDocument["document_key"];

        if (empty($documentCounts[$key])) {
            throw new InvalidArgumentException(
                "Missing required document: " . $requiredDocument["label"] . "."
            );
        }
    }

    $shipmentId = generateId();
    $shipmentReference = "TRN-SHP-" . date("Y") . "-" . strtoupper(bin2hex(random_bytes(6)));

    $conn->beginTransaction();
    $transactionStarted = true;

    $q = $conn->prepare("
        INSERT INTO portal_shipments (
            id, shipment_reference, user_id, organization_id, shipment_type, bill_of_lading, booking_number,
            vessel_name, voyage_number, shipping_line, origin_country,
            origin_port, destination_port, expected_arrival, consignee,
            consignee_email, consignee_phone, cargo_description,
            cargo_category, package_type, package_count, gross_weight,
            volume, hs_code, dangerous_goods, temperature_controlled,
            temperature, special_instructions, customs_reference, status
        ) VALUES (
            :id, :shipment_reference, :user_id, :organization_id, :shipment_type, :bill_of_lading, :booking_number,
            :vessel_name, :voyage_number, :shipping_line, :origin_country,
            :origin_port, :destination_port, :expected_arrival, :consignee,
            :consignee_email, :consignee_phone, :cargo_description,
            :cargo_category, :package_type, :package_count, :gross_weight,
            :volume, :hs_code, :dangerous_goods, :temperature_controlled,
            :temperature, :special_instructions, :customs_reference, 'pending_review'
        )
    ");

    $q->bindValue(":id", $shipmentId);
    $q->bindValue(":shipment_reference", $shipmentReference);
    $q->bindValue(":user_id", $userId);
    $q->bindValue(":organization_id", $my_details->organisation_id);
    $q->bindValue(":shipment_type", $shipmentType);
    $q->bindValue(":bill_of_lading", trim($_POST["bill_of_lading"] ?? "") ?: null);
    $q->bindValue(":booking_number", trim($_POST["booking_number"] ?? "") ?: null);
    $q->bindValue(":vessel_name", trim($_POST["vessel_name"] ?? "") ?: null);
    $q->bindValue(":voyage_number", trim($_POST["voyage_number"] ?? "") ?: null);
    $q->bindValue(":shipping_line", trim($_POST["shipping_line"] ?? "") ?: null);
    $q->bindValue(":origin_country", trim($_POST["origin_country"] ?? "") ?: null);
    $q->bindValue(":origin_port", trim($_POST["origin_port"] ?? "") ?: null);
    $q->bindValue(":destination_port", trim($_POST["destination_port"] ?? "") ?: null);
    $q->bindValue(":expected_arrival", $expectedArrival);
    $q->bindValue(":consignee", trim($_POST["consignee"] ?? "") ?: null);
    $q->bindValue(":consignee_email", $consigneeEmail ?: null);
    $q->bindValue(":consignee_phone", trim($_POST["consignee_phone"] ?? "") ?: null);
    $q->bindValue(":cargo_description", trim($_POST["cargo_description"] ?? "") ?: null);
    $q->bindValue(":cargo_category", $cargoCategory);
    $q->bindValue(":package_type", $packageType);
    $q->bindValue(
        ":package_count",
        ($_POST["package_count"] ?? "") === "" ? null : $_POST["package_count"]
    );
    $q->bindValue(
        ":gross_weight",
        ($_POST["gross_weight"] ?? "") === "" ? null : $_POST["gross_weight"]
    );
    $q->bindValue(
        ":volume",
        ($_POST["volume"] ?? "") === "" ? null : $_POST["volume"]
    );
    $q->bindValue(":hs_code", trim($_POST["hs_code"] ?? "") ?: null);
    $q->bindValue(":dangerous_goods", $dangerousGoods);
    $q->bindValue(":temperature_controlled", $temperatureControlled);
    $q->bindValue(":temperature", trim($_POST["temperature"] ?? "") ?: null);
    $q->bindValue(
        ":special_instructions",
        trim($_POST["special_instructions"] ?? "") ?: null
    );
    $q->bindValue(":customs_reference", trim($_POST["customs_reference"] ?? "") ?: null);
    $q->execute();

    $containerInsert = $conn->prepare("
        INSERT INTO portal_shipment_containers (
            id, shipment_id, container_no, size, seal_no, package_count, gross_weight
        ) VALUES (
            :id, :shipment_id, :container_no, :size, :seal_no, :package_count, :gross_weight
        )
    ");

    $seenContainers = [];

    foreach ($validContainers as $container) {
        $containerNo = strtoupper(trim(
            $container["containerNo"] ?? $container["container_no"] ?? ""
        ));

        if (isset($seenContainers[$containerNo])) {
            throw new InvalidArgumentException("Duplicate container number.");
        }

        $seenContainers[$containerNo] = true;

        $containerSize = trim($container["size"] ?? "") ?: null;

        if ($containerSize !== null) {
            $sizeCheck = $conn->prepare("
                SELECT label
                FROM terminal_container_sizes
                WHERE label = :label AND is_active = 1
                LIMIT 1
            ");
            $sizeCheck->bindValue(":label", $containerSize);
            $sizeCheck->execute();

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
            if ($number !== "" && (!is_numeric($number) || (float) $number < 0)) {
                throw new InvalidArgumentException(
                    "Invalid container quantity or weight."
                );
            }
        }

        $sealNo = trim(
            $container["sealNo"] ?? $container["seal_no"] ?? ""
        ) ?: null;

        $containerInsert->bindValue(":id", generateId());
        $containerInsert->bindValue(":shipment_id", $shipmentId);
        $containerInsert->bindValue(":container_no", $containerNo);
        $containerInsert->bindValue(":size", $containerSize);
        $containerInsert->bindValue(":seal_no", $sealNo);
        $containerInsert->bindValue(
            ":package_count",
            $containerCount === "" ? null : $containerCount
        );
        $containerInsert->bindValue(
            ":gross_weight",
            $containerWeight === "" ? null : $containerWeight
        );
        $containerInsert->execute();
    }

    $documentInsert = $conn->prepare("
        INSERT INTO portal_shipment_documents (
            id, shipment_id, document_type, original_name,
            stored_name, file_path, mime_type, file_size
        ) VALUES (
            :id, :shipment_id, :document_type, :original_name,
            :stored_name, :file_path, :mime_type, :file_size
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
        $index = (int) $document["index"];
        $documentKey = trim($document["type"]);
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

        $documentRuleQuery->bindValue(":document_key", $documentKey);
        $documentRuleQuery->execute();
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
                $upload["data"] ?? "Unable to upload the supporting document."
            );
        }

        $targetPath = $upload["data"] ?? "";

        if (!is_string($targetPath) || $targetPath === "") {
            throw new RuntimeException("The uploaded file path was not returned.");
        }

        $createdFiles[] = $targetPath;
        $storedName = basename($targetPath);

        $documentInsert->bindValue(":id", generateId());
        $documentInsert->bindValue(":shipment_id", $shipmentId);
        $documentInsert->bindValue(":document_type", $documentLabel);
        $documentInsert->bindValue(":original_name", $originalName);
        $documentInsert->bindValue(":stored_name", $storedName);
        $documentInsert->bindValue(":file_path", $targetPath);
        $documentInsert->bindValue(":mime_type", $mimeType);
        $documentInsert->bindValue(":file_size", $file["size"], PDO::PARAM_INT);
        $documentInsert->execute();
    }

    $conn->commit();
    $transactionStarted = false;

    echo json_encode([
        "error" => false,
        "data" => "Shipment declaration submitted for review.",
        "code" => [
            "shipment_id" => $shipmentId,
            "shipment_reference" => $shipmentReference,
            "status" => "pending_review"
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (InvalidArgumentException $e) {
    if ($transactionStarted && $conn->inTransaction()) {
        $conn->rollBack();
    }

    foreach ($createdFiles as $file) {
        delete_file($file);
    }

    http_response_code(422);
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

    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not save the shipment.",
        "code" => null
    ]);
}