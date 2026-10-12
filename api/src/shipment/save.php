
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

$uploadRoot = getenv("SHIPMENT_UPLOAD_DIR");

if (!is_string($uploadRoot) || $uploadRoot === "" || !is_dir($uploadRoot) || !is_writable($uploadRoot)) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Shipment upload storage is not configured.",
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

    $fields = [
        "bill_of_lading" => 150,
        "booking_number" => 150,
        "vessel_name" => 150,
        "voyage_number" => 100,
        "shipping_line" => 150,
        "origin_country" => 100,
        "origin_port" => 150,
        "destination_port" => 150,
        "consignee" => 255,
        "consignee_email" => 254,
        "consignee_phone" => 50,
        "hs_code" => 50,
        "customs_reference" => 150
    ];

    $data = [];

    foreach ($fields as $field => $maxLength) {
        $value = trim($_POST[$field] ?? "");

        if (strlen($value) > $maxLength) {
            throw new InvalidArgumentException(
                "The field " . $field . " exceeds the allowed length."
            );
        }

        $data[$field] = $value === "" ? null : $value;
    }

    if (
        $data["consignee_email"] !== null &&
        !filter_var($data["consignee_email"], FILTER_VALIDATE_EMAIL)
    ) {
        throw new InvalidArgumentException("Invalid consignee email.");
    }

    $expectedArrival = trim($_POST["expected_arrival"] ?? "");

    if ($expectedArrival !== "") {
        $arrivalDate = DateTime::createFromFormat(
            "!Y-m-d",
            $expectedArrival
        );

        if (!$arrivalDate || $arrivalDate->format("Y-m-d") !== $expectedArrival) {
            throw new InvalidArgumentException("Invalid expected arrival date.");
        }

        $expectedArrival = $arrivalDate->format("Y-m-d 00:00:00");
    } else {
        $expectedArrival = null;
    }

    $decimalFields = [
        "package_count" => $_POST["package_count"] ?? "",
        "gross_weight" => $_POST["gross_weight"] ?? "",
        "volume" => $_POST["volume"] ?? ""
    ];

    foreach ($decimalFields as $field => $value) {
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

    if ($shipmentType === "FCL" && count($containers) === 0) {
        throw new InvalidArgumentException(
            "At least one container is required for FCL shipments."
        );
    }

    $q = $conn->prepare("
        SELECT label FROM terminal_shipment_types WHERE label = :label
    ");
    $q->execute([":label" => $shipmentType]);

    if (!$q->fetchColumn()) {
        throw new InvalidArgumentException("Invalid shipment type.");
    }

    $q = $conn->prepare("
        SELECT label FROM terminal_cargo_categories WHERE label = :label
    ");
    $q->execute([":label" => $cargoCategory]);

    if (!$q->fetchColumn()) {
        throw new InvalidArgumentException("Invalid cargo category.");
    }

    $q = $conn->prepare("
        SELECT label FROM terminal_packaging_types WHERE label = :label
    ");
    $q->execute([":label" => $packageType]);

    if (!$q->fetchColumn()) {
        throw new InvalidArgumentException("Invalid packaging type.");
    }

    $shipmentId = generateId();
    $shipmentDirectory = rtrim($uploadRoot, DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR . $shipmentId;

    if (!mkdir($shipmentDirectory, 0750, true)) {
        throw new RuntimeException("Could not create shipment storage.");
    }

    $conn->beginTransaction();
    $transactionStarted = true;

    $q = $conn->prepare("
        INSERT INTO portal_shipments (
            id, user_id, shipment_type, bill_of_lading, booking_number,
            vessel_name, voyage_number, shipping_line, origin_country,
            origin_port, destination_port, expected_arrival, consignee,
            consignee_email, consignee_phone, cargo_description,
            cargo_category, package_type, package_count, gross_weight,
            volume, hs_code, dangerous_goods, temperature_controlled,
            temperature, special_instructions, customs_reference, status
        ) VALUES (
            :id, :user_id, :shipment_type, :bill_of_lading, :booking_number,
            :vessel_name, :voyage_number, :shipping_line, :origin_country,
            :origin_port, :destination_port, :expected_arrival, :consignee,
            :consignee_email, :consignee_phone, :cargo_description,
            :cargo_category, :package_type, :package_count, :gross_weight,
            :volume, :hs_code, :dangerous_goods, :temperature_controlled,
            :temperature, :special_instructions, :customs_reference, 'pending_review'
        )
    ");

    $q->execute([
        ":id" => $shipmentId,
        ":user_id" => $userId,
        ":shipment_type" => $shipmentType,
        ":bill_of_lading" => $data["bill_of_lading"],
        ":booking_number" => $data["booking_number"],
        ":vessel_name" => $data["vessel_name"],
        ":voyage_number" => $data["voyage_number"],
        ":shipping_line" => $data["shipping_line"],
        ":origin_country" => $data["origin_country"],
        ":origin_port" => $data["origin_port"],
        ":destination_port" => $data["destination_port"],
        ":expected_arrival" => $expectedArrival,
        ":consignee" => $data["consignee"],
        ":consignee_email" => $data["consignee_email"],
        ":consignee_phone" => $data["consignee_phone"],
        ":cargo_description" => trim($_POST["cargo_description"] ?? ""),
        ":cargo_category" => $cargoCategory,
        ":package_type" => $packageType,
        ":package_count" => $decimalFields["package_count"] === "" ? null : $decimalFields["package_count"],
        ":gross_weight" => $decimalFields["gross_weight"] === "" ? null : $decimalFields["gross_weight"],
        ":volume" => $decimalFields["volume"] === "" ? null : $decimalFields["volume"],
        ":hs_code" => $data["hs_code"],
        ":dangerous_goods" => $dangerousGoods,
        ":temperature_controlled" => $temperatureControlled,
        ":temperature" => trim($_POST["temperature"] ?? "") ?: null,
        ":special_instructions" => trim($_POST["special_instructions"] ?? "") ?: null,
        ":customs_reference" => $data["customs_reference"]
    ]);

    $q = $conn->prepare("
        INSERT INTO portal_shipment_containers (
            id, shipment_id, container_no, size, seal_no, package_count, gross_weight
        ) VALUES (
            :id, :shipment_id, :container_no, :size, :seal_no, :package_count, :gross_weight
        )
    ");

    $seenContainers = [];

    foreach ($containers as $container) {
        if (!is_array($container)) {
            throw new InvalidArgumentException("Invalid container entry.");
        }

        $containerNo = strtoupper(trim($container["container_no"] ?? ""));

        if ($containerNo === "") {
            continue;
        }

        if (isset($seenContainers[$containerNo])) {
            throw new InvalidArgumentException("Duplicate container number.");
        }

        $seenContainers[$containerNo] = true;

        $containerCount = $container["package_count"] ?? "";
        $containerWeight = $container["gross_weight"] ?? "";

        foreach ([$containerCount, $containerWeight] as $number) {
            if ($number !== "" && (!is_numeric($number) || (float) $number < 0)) {
                throw new InvalidArgumentException("Invalid container quantity or weight.");
            }
        }

        $q->execute([
            ":id" => generateId(),
            ":shipment_id" => $shipmentId,
            ":container_no" => $containerNo,
            ":size" => trim($container["size"] ?? "") ?: null,
            ":seal_no" => trim($container["seal_no"] ?? "") ?: null,
            ":package_count" => $containerCount === "" ? null : $containerCount,
            ":gross_weight" => $containerWeight === "" ? null : $containerWeight
        ]);
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
        if (!is_array($document)) {
            throw new InvalidArgumentException("Invalid document entry.");
        }

        $index = filter_var(
            $document["index"] ?? null,
            FILTER_VALIDATE_INT
        );

        $documentType = trim($document["type"] ?? "");

        if ($index === false || $index < 0 || $documentType === "") {
            throw new InvalidArgumentException("Invalid document type or index.");
        }

        $uploadKey = "document_file_" . $index;

        if (
            !isset($_FILES[$uploadKey]) ||
            $_FILES[$uploadKey]["error"] !== UPLOAD_ERR_OK
        ) {
            throw new InvalidArgumentException("A supporting document was not uploaded.");
        }

        $file = $_FILES[$uploadKey];

        if ($file["size"] <= 0 || $file["size"] > $maxFileSize) {
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

        $q = $conn->prepare("
            SELECT dt.label
            FROM document_types dt
            INNER JOIN document_upload_location_types dult
                ON dult.document_type_key = dt.document_key
            INNER JOIN document_upload_locations dul
                ON dul.id = dult.location_id
            WHERE dul.location_key = 'shipment_documents'
              AND dul.is_active = 1
              AND dt.label = :label
            LIMIT 1
        ");
        $q->execute([":label" => $documentType]);

        if (!$q->fetchColumn()) {
            throw new InvalidArgumentException("Invalid supporting document type.");
        }

        $originalName = basename($file["name"]);
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        $extensions = [
            "application/pdf" => "pdf",
            "image/jpeg" => "jpg",
            "image/png" => "png"
        ];

        $storedName = bin2hex(random_bytes(24))
            . "." . $extensions[$mimeType];

        $destination = $shipmentDirectory . DIRECTORY_SEPARATOR . $storedName;

        if (!move_uploaded_file($file["tmp_name"], $destination)) {
            throw new RuntimeException("Could not store an uploaded document.");
        }

        $createdFiles[] = $destination;

        $documentInsert->execute([
            ":id" => generateId(),
            ":shipment_id" => $shipmentId,
            ":document_type" => $documentType,
            ":original_name" => $originalName,
            ":stored_name" => $storedName,
            ":file_path" => $destination,
            ":mime_type" => $mimeType,
            ":file_size" => $file["size"]
        ]);
    }

    $conn->commit();
    $transactionStarted = false;

    echo json_encode([
        "error" => false,
        "data" => "Shipment declaration submitted for review.",
        "code" => [
            "shipment_id" => $shipmentId,
            "status" => "pending_review"
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (InvalidArgumentException $e) {
    if ($transactionStarted && $conn->inTransaction()) {
        $conn->rollBack();
    }

    foreach ($createdFiles as $file) {
        if (is_file($file)) {
            unlink($file);
        }
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
        if (is_file($file)) {
            unlink($file);
        }
    }

    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not save the shipment.",
        "code" => null
    ]);
}
