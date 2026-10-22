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

    if ($userId === "") {
        echo json_encode([
            "error" => true,
            "data" => "Authentication required.",
            "code" => null
        ]);
        exit;
    }

    $shipmentId = trim((string) ($_GET["id"] ?? $_POST["id"] ?? ""));
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
        WHERE id = :id AND organisation_id = :organisation_id
        LIMIT 1
    "); 
    $ownership->execute([
        ":id" => $shipmentId,
        ":organisation_id" => $my_details->organisation_id
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

    if (!in_array($existingShipment["status"], ["draft", "pending_review", "CHANGES_REQUESTED"], true)) {
        echo json_encode([
            "error" => true,
            "data" => "This shipment can no longer be edited.",
            "code" => ["status" => $existingShipment["status"]]
        ]);
        exit;
    }

    $requestedStatus = trim($_POST["status"] ?? "pending_review");
    $status = in_array($requestedStatus, ["draft", "pending_review"], true)
        ? $requestedStatus
        : "pending_review";

    if ($status === "pending_review" && ($_POST["declaration_accepted"] ?? "0") !== "1") {
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

    if ($status === "pending_review") {
        foreach ($requiredDocuments as $requiredDocument) {
        $key = $requiredDocument["document_key"];
        $alreadyUploaded = false;

        if (empty($documentCounts[$key])) {
            $existingDoc = $conn->prepare("
                SELECT 1
                FROM portal_shipment_documents
                WHERE shipment_id = :shipment_id AND document_type = :document_type
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
                "Missing required document: " . $requiredDocument["label"] . "."
            );
        }
        }
    }

    $conn->beginTransaction();
    $transactionStarted = true;

    $q = $conn->prepare("
        UPDATE portal_shipments SET
            shipment_type = :shipment_type,
            bill_of_lading = :bill_of_lading,
            booking_number = :booking_number,
            vessel_name = :vessel_name,
            voyage_number = :voyage_number,
            shipping_line = :shipping_line,
            origin_country = :origin_country,
            origin_port = :origin_port,
            destination_port = :destination_port,
            expected_arrival = :expected_arrival,
            consignee = :consignee,
            consignee_email = :consignee_email,
            consignee_phone = :consignee_phone,
            consignee_type = :consignee_type,
            consignee_organisation_id = :consignee_organisation_id,
            consignee_status = :consignee_status,
            consignee_contact_person = :consignee_contact_person,
            consignee_address = :consignee_address,
            consignee_country = :consignee_country,
            licensed_agent_id = :licensed_agent_id,
            licensed_agent_name = :licensed_agent_name,
            cargo_description = :cargo_description,
            cargo_category = :cargo_category,
            package_type = :package_type,
            package_count = :package_count,
            gross_weight = :gross_weight,
            volume = :volume,
            hs_code = :hs_code,
            dangerous_goods = :dangerous_goods,
            temperature_controlled = :temperature_controlled,
            temperature = :temperature,
            special_instructions = :special_instructions,
            customs_reference = :customs_reference,
            status = :status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id AND organisation_id = :organisation_id
    ");

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

    $consigneeType = trim($_POST["consignee_type"] ?? "organisation");
    if (!in_array($consigneeType, ["organisation", "individual"], true)) {
        throw new InvalidArgumentException("Invalid consignee type.");
    }

    $consigneeOrganisationId = trim($_POST["consignee_organisation_id"] ?? "") ?: null;
    $consigneeStatus = $consigneeOrganisationId ? "linked" : "unregistered";
    $licensedAgentId = trim($_POST["agentId"] ?? $_POST["licensed_agent_id"] ?? "") ?: null;
    $licensedAgentName = trim($_POST["agent"] ?? $_POST["licensed_agent_name"] ?? "") ?: null;

    $q->bindValue(":consignee_type", $consigneeType);
    $q->bindValue(":consignee_organisation_id", $consigneeOrganisationId);
    $q->bindValue(":consignee_status", $consigneeStatus);
    $q->bindValue(":consignee_contact_person", trim($_POST["consignee_contact_person"] ?? "") ?: null);
    $q->bindValue(":consignee_address", trim($_POST["consignee_address"] ?? "") ?: null);
    $q->bindValue(":consignee_country", trim($_POST["consignee_country"] ?? "") ?: null);
    $q->bindValue(":licensed_agent_id", $licensedAgentId);
    $q->bindValue(":licensed_agent_name", $licensedAgentName);

    $q->bindValue(":cargo_description", trim($_POST["cargo_description"] ?? "") ?: null);
    $q->bindValue(":cargo_category", $cargoCategory);
    $q->bindValue(":package_type", $packageType);
    $q->bindValue(":package_count", ($_POST["package_count"] ?? "") === "" ? null : $_POST["package_count"]);
    $q->bindValue(":gross_weight", ($_POST["gross_weight"] ?? "") === "" ? null : $_POST["gross_weight"]);
    $q->bindValue(":volume", ($_POST["volume"] ?? "") === "" ? null : $_POST["volume"]);
    $q->bindValue(":hs_code", trim($_POST["hs_code"] ?? "") ?: null);
    $q->bindValue(":dangerous_goods", $dangerousGoods);
    $q->bindValue(":temperature_controlled", $temperatureControlled);
    $q->bindValue(":temperature", trim($_POST["temperature"] ?? "") ?: null);
    $q->bindValue(":special_instructions", trim($_POST["special_instructions"] ?? "") ?: null);
    $q->bindValue(":customs_reference", trim($_POST["customs_reference"] ?? "") ?: null);
    $q->bindValue(":status", $status);
    $q->bindValue(":id", $shipmentId);
    $q->bindValue(":organisation_id", $my_details->organisation_id);
    $q->execute();

    if ($q->rowCount() === 0) {
        $check = $conn->prepare("
            SELECT id FROM portal_shipments
            WHERE id = :id AND organisation_id = :organisation_id
            LIMIT 1
        ");
        $check->execute([
            ":id" => $shipmentId,
            ":organisation_id" => $my_details->organisation_id
        ]);
        if (!$check->fetchColumn()) {
            throw new RuntimeException("Shipment could not be updated.");
        }
    }

    $removeContainers = $conn->prepare("
        DELETE FROM portal_shipment_containers WHERE shipment_id = :shipment_id
    ");
    $removeContainers->execute([":shipment_id" => $shipmentId]);

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

        $sealNo = trim((string) ($container["sealNo"] ?? $container["seal_no"] ?? "")) ?: null;

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