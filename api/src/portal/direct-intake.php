<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed.",
        "code" => null
    ]);
    exit;
}

$createdFiles = [];
$transactionStarted = false;

try {
    $userId = trim((string) ($my_details->id ?? ""));
    $organisationId = trim((string) ($my_details->organisation_id ?? ""));

    if ($userId === "" || $organisationId === "") {
        http_response_code(401);
        echo json_encode([
            "error" => true,
            "data" => "An authenticated organisation account is required.",
            "code" => null
        ]);
        exit;
    }

    $reason = trim((string) ($_POST["reason"] ?? ""));
    $billOfLading = trim((string) ($_POST["bill_of_lading"] ?? ""));
    $shippingLine = trim((string) ($_POST["shipping_line"] ?? ""));
    $vesselName = trim((string) ($_POST["vessel_name"] ?? ""));
    $voyageNumber = trim((string) ($_POST["voyage_number"] ?? ""));
    $expectedArrival = trim((string) ($_POST["expected_arrival"] ?? ""));
    $originPort = trim((string) ($_POST["origin_port"] ?? ""));
    $consignee = trim((string) ($_POST["consignee"] ?? ""));
    $consigneeOrganisationId = trim((string) ($_POST["consignee_organisation_id"] ?? ""));
    $consigneeType = trim((string) ($_POST["consignee_type"] ?? "organisation"));
    $consigneeEmail = trim((string) ($_POST["consignee_email"] ?? ""));
    $consigneePhone = trim((string) ($_POST["consignee_phone"] ?? ""));
    $consigneeContactPerson = trim((string) ($_POST["consignee_contact_person"] ?? ""));
    $consigneeAddress = trim((string) ($_POST["consignee_address"] ?? ""));
    $consigneeCountry = trim((string) ($_POST["consignee_country"] ?? ""));
    $licensedAgentId = trim((string) ($_POST["licensed_agent_id"] ?? ""));
    $licensedAgentName = trim((string) ($_POST["licensed_agent_name"] ?? ""));
    $explanation = trim((string) ($_POST["explanation"] ?? ""));

    if (
        $billOfLading === "" ||
        $shippingLine === "" ||
        $vesselName === "" ||
        $expectedArrival === "" ||
        $consignee === "" ||
        $explanation === ""
    ) {
        throw new InvalidArgumentException(
            "Complete the bill of lading, shipping line, vessel, expected arrival, consignee and explanation fields."
        );
    }

    if (!in_array($consigneeType, ["organisation", "individual"], true)) {
        throw new InvalidArgumentException("Invalid consignee type.");
    }

    if (
        $consigneeEmail !== "" &&
        !filter_var($consigneeEmail, FILTER_VALIDATE_EMAIL)
    ) {
        throw new InvalidArgumentException("Enter a valid consignee email address.");
    }

    $arrivalDate = DateTime::createFromFormat("!Y-m-d", $expectedArrival);

    if (
        !$arrivalDate ||
        $arrivalDate->format("Y-m-d") !== $expectedArrival
    ) {
        throw new InvalidArgumentException("Invalid expected arrival date.");
    }

    $containers = json_decode(
        (string) ($_POST["containers"] ?? "[]"),
        true
    );

    if (!is_array($containers) || count($containers) === 0) {
        throw new InvalidArgumentException("Add at least one container.");
    }

    $normalise = static function ($value): string {
        return strtoupper(
            (string) preg_replace(
                "/[^A-Z0-9]/i",
                "",
                trim((string) $value)
            )
        );
    };

    $containerNumbers = [];

    foreach ($containers as $index => &$container) {
        if (!is_array($container)) {
            throw new InvalidArgumentException("Invalid container data.");
        }

        $containerNo = strtoupper(
            trim((string) ($container["container_no"] ?? ""))
        );

        $cargoDescription = trim(
            (string) ($container["cargo_description"] ?? "")
        );

        if ($containerNo === "" || $cargoDescription === "") {
            throw new InvalidArgumentException(
                "Every container requires a container number and cargo description."
            );
        }

        $normalisedContainerNo = $normalise($containerNo);

        if (isset($containerNumbers[$normalisedContainerNo])) {
            throw new InvalidArgumentException(
                "Duplicate container number: " . $containerNo
            );
        }

        $containerNumbers[$normalisedContainerNo] = true;

        foreach (["gross_weight", "package_count"] as $numericField) {
            if (
                isset($container[$numericField]) &&
                $container[$numericField] !== "" &&
                (
                    !is_numeric($container[$numericField]) ||
                    (float) $container[$numericField] < 0
                )
            ) {
                throw new InvalidArgumentException(
                    "Invalid " . str_replace("_", " ", $numericField) .
                    " for container " . $containerNo . "."
                );
            }
        }

        $container["container_no"] = $containerNo;
        $container["size"] = trim((string) ($container["size"] ?? ""));
        $container["seal_no"] = trim((string) ($container["seal_no"] ?? ""));
        $container["cargo_description"] = $cargoDescription;
    }

    unset($container);

    $normalisedBl = $normalise($billOfLading);

    if ($normalisedBl === "") {
        throw new InvalidArgumentException("Invalid bill of lading.");
    }

    $consigneeOrganisationId = $consigneeOrganisationId !== ""
        ? $consigneeOrganisationId
        : null;

    if ($consigneeOrganisationId !== null) {
        $organisationCheck = $conn->prepare("
            SELECT id
            FROM organisations
            WHERE id = :id
            LIMIT 1
        ");

        $organisationCheck->execute([
            ":id" => $consigneeOrganisationId
        ]);

        if (!$organisationCheck->fetchColumn()) {
            throw new InvalidArgumentException(
                "The selected consignee organisation could not be found."
            );
        }
    }

    if ($licensedAgentId !== "") {
        $agentCheck = $conn->prepare("
            SELECT id, organisation_name
            FROM organisations
            WHERE id = :id
            LIMIT 1
        ");

        $agentCheck->execute([
            ":id" => $licensedAgentId
        ]);

        $agent = $agentCheck->fetch(PDO::FETCH_ASSOC);

        if (!$agent) {
            throw new InvalidArgumentException(
                "The selected licensed agent could not be found."
            );
        }

        if ($licensedAgentName === "") {
            $licensedAgentName = (string) ($agent["organisation_name"] ?? "");
        }
    } else {
        $licensedAgentId = "";
        $licensedAgentName = "";
    }

    $uploadDirectory = dirname(__DIR__, 2) . "/uploads/direct-intake/";

    if (!is_dir($uploadDirectory)) {
        if (!mkdir($uploadDirectory, 0750, true) && !is_dir($uploadDirectory)) {
            throw new RuntimeException("Could not create the document upload directory.");
        }
    }

    if (!is_writable($uploadDirectory)) {
        throw new RuntimeException("The document upload directory is not writable.");
    }

    $uploadedDocuments = [];

    if (isset($_FILES["documents"]) && is_array($_FILES["documents"]["name"] ?? null)) {
        $allowedMimeTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ];

        $maxFileSize = 10 * 1024 * 1024;
        $fileCount = count($_FILES["documents"]["name"]);

        if ($fileCount > 20) {
            throw new InvalidArgumentException(
                "You can upload a maximum of 20 documents."
            );
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);

        for ($i = 0; $i < $fileCount; $i++) {
            $errorCode = (int) ($_FILES["documents"]["error"][$i] ?? UPLOAD_ERR_NO_FILE);

            if ($errorCode === UPLOAD_ERR_NO_FILE) {
                continue;
            }

            if ($errorCode !== UPLOAD_ERR_OK) {
                throw new RuntimeException("A document upload failed.");
            }

            $tmpName = (string) ($_FILES["documents"]["tmp_name"][$i] ?? "");
            $originalName = basename(
                (string) ($_FILES["documents"]["name"][$i] ?? "document")
            );
            $fileSize = (int) ($_FILES["documents"]["size"][$i] ?? 0);

            if (
                $tmpName === "" ||
                !is_uploaded_file($tmpName) ||
                $fileSize <= 0 ||
                $fileSize > $maxFileSize
            ) {
                throw new InvalidArgumentException(
                    "Each document must be no larger than 10 MB."
                );
            }

            $mimeType = $finfo->file($tmpName);

            if (!in_array($mimeType, $allowedMimeTypes, true)) {
                throw new InvalidArgumentException(
                    "Unsupported document type: " . $originalName
                );
            }

            $extension = strtolower(
                pathinfo($originalName, PATHINFO_EXTENSION)
            );

            $storedName = bin2hex(random_bytes(16)) .
                ($extension !== "" ? "." . $extension : "");

            $absolutePath = $uploadDirectory . $storedName;

            if (!move_uploaded_file($tmpName, $absolutePath)) {
                throw new RuntimeException(
                    "Could not save document: " . $originalName
                );
            }

            $createdFiles[] = $absolutePath;

            $uploadedDocuments[] = [
                "id" => generateId(),
                "document_type" => "Direct Intake Supporting Document",
                "original_name" => $originalName,
                "stored_name" => $storedName,
                "file_path" => "uploads/direct-intake/" . $storedName,
                "mime_type" => $mimeType,
                "file_size" => $fileSize
            ];
        }
    }

    $shipmentId = generateId();
    $shipmentReference = "TRN-SHP-" . date("Y") . "-" .
        strtoupper(bin2hex(random_bytes(6)));

    $totalPackages = 0;
    $totalWeight = 0;
    $hasPackages = false;
    $hasWeight = false;
    $cargoDescriptions = [];

    foreach ($containers as $container) {
        if (
            isset($container["package_count"]) &&
            $container["package_count"] !== ""
        ) {
            $totalPackages += (float) $container["package_count"];
            $hasPackages = true;
        }

        if (
            isset($container["gross_weight"]) &&
            $container["gross_weight"] !== ""
        ) {
            $totalWeight += (float) $container["gross_weight"];
            $hasWeight = true;
        }

        $cargoDescriptions[] = trim(
            (string) $container["cargo_description"]
        );
    }

    $cargoDescription = implode("; ", array_unique($cargoDescriptions));

    $specialInstructions = "Direct intake reason: " . $reason .
        "\nExplanation: " . $explanation;

    $conn->beginTransaction();
    $transactionStarted = true;

    $manifestQuery = $conn->prepare("
        SELECT
            id,
            manifest_ref,
            bill_of_lading,
            matched_shipment_id,
            status
        FROM operation_manifests
        WHERE REGEXP_REPLACE(
            UPPER(TRIM(bill_of_lading)),
            '[^A-Z0-9]',
            ''
        ) = :bill_of_lading
        ORDER BY received_at ASC
        LIMIT 1
        FOR UPDATE
    ");

    $manifestQuery->execute([
        ":bill_of_lading" => $normalisedBl
    ]);

    $manifest = $manifestQuery->fetch(PDO::FETCH_ASSOC);

    if ($manifest && !empty($manifest["matched_shipment_id"])) {
        throw new InvalidArgumentException(
            "This bill of lading is already linked to a shipment. No duplicate shipment was created."
        );
    }

    $shipmentInsert = $conn->prepare("
        INSERT INTO portal_shipments (
            id,
            shipment_reference,
            user_id,
            organisation_id,
            shipment_type,
            bill_of_lading,
            vessel_name,
            voyage_number,
            shipping_line,
            origin_port,
            expected_arrival,
            consignee,
            consignee_email,
            consignee_phone,
            consignee_type,
            consignee_organisation_id,
            consignee_status,
            consignee_contact_person,
            consignee_address,
            consignee_country,
            licensed_agent_id,
            licensed_agent_name,
            cargo_description,
            cargo_category,
            package_type,
            package_count,
            gross_weight,
            special_instructions,
            status
        ) VALUES (
            :id,
            :shipment_reference,
            :user_id,
            :organisation_id,
            :shipment_type,
            :bill_of_lading,
            :vessel_name,
            :voyage_number,
            :shipping_line,
            :origin_port,
            :expected_arrival,
            :consignee,
            :consignee_email,
            :consignee_phone,
            :consignee_type,
            :consignee_organisation_id,
            :consignee_status,
            :consignee_contact_person,
            :consignee_address,
            :consignee_country,
            :licensed_agent_id,
            :licensed_agent_name,
            :cargo_description,
            :cargo_category,
            :package_type,
            :package_count,
            :gross_weight,
            :special_instructions,
            :status
        )
    ");

    $shipmentInsert->execute([
        ":id" => $shipmentId,
        ":shipment_reference" => $shipmentReference,
        ":user_id" => $userId,
        ":organisation_id" => $organisationId,
        ":shipment_type" => "Direct Intake",
        ":bill_of_lading" => $billOfLading,
        ":vessel_name" => $vesselName,
        ":voyage_number" => $voyageNumber !== "" ? $voyageNumber : null,
        ":shipping_line" => $shippingLine,
        ":origin_port" => $originPort !== "" ? $originPort : null,
        ":expected_arrival" => $expectedArrival . " 00:00:00",
        ":consignee" => $consignee,
        ":consignee_email" => $consigneeEmail !== "" ? $consigneeEmail : null,
        ":consignee_phone" => $consigneePhone !== "" ? $consigneePhone : null,
        ":consignee_type" => $consigneeType,
        ":consignee_organisation_id" => $consigneeOrganisationId,
        ":consignee_status" => $consigneeOrganisationId !== null ? "linked" : "unregistered",
        ":consignee_contact_person" => $consigneeContactPerson !== "" ? $consigneeContactPerson : null,
        ":consignee_address" => $consigneeAddress !== "" ? $consigneeAddress : null,
        ":consignee_country" => $consigneeCountry !== "" ? $consigneeCountry : null,
        ":licensed_agent_id" => $licensedAgentId !== "" ? $licensedAgentId : null,
        ":licensed_agent_name" => $licensedAgentName !== "" ? $licensedAgentName : null,
        ":cargo_description" => $cargoDescription,
        ":cargo_category" => "General Cargo",
        ":package_type" => "Packages",
        ":package_count" => $hasPackages ? $totalPackages : null,
        ":gross_weight" => $hasWeight ? $totalWeight : null,
        ":special_instructions" => $specialInstructions,
        ":status" => "pending_review"
    ]);

    $containerInsert = $conn->prepare("
        INSERT INTO portal_shipment_containers (
            id,
            shipment_id,
            container_no,
            size,
            seal_no,
            package_count,
            gross_weight,
            status
        ) VALUES (
            :id,
            :shipment_id,
            :container_no,
            :size,
            :seal_no,
            :package_count,
            :gross_weight,
            'EXPECTED'
        )
    ");

    foreach ($containers as $container) {
        $containerInsert->execute([
            ":id" => generateId(),
            ":shipment_id" => $shipmentId,
            ":container_no" => $container["container_no"],
            ":size" => $container["size"] !== "" ? $container["size"] : null,
            ":seal_no" => $container["seal_no"] !== "" ? $container["seal_no"] : null,
            ":package_count" =>
                isset($container["package_count"]) &&
                $container["package_count"] !== ""
                    ? (float) $container["package_count"]
                    : null,
            ":gross_weight" =>
                isset($container["gross_weight"]) &&
                $container["gross_weight"] !== ""
                    ? (float) $container["gross_weight"]
                    : null
        ]);
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

    foreach ($uploadedDocuments as $document) {
        $documentInsert->execute([
            ":id" => $document["id"],
            ":shipment_id" => $shipmentId,
            ":document_type" => $document["document_type"],
            ":original_name" => $document["original_name"],
            ":stored_name" => $document["stored_name"],
            ":file_path" => $document["file_path"],
            ":mime_type" => $document["mime_type"],
            ":file_size" => $document["file_size"]
        ]);
    }

    if ($manifest) {
        $manifestUpdate = $conn->prepare("
            UPDATE operation_manifests
            SET
                matched_shipment_id = :shipment_id,
                status = 'Pre-advice',
                notes = TRIM(
                    CONCAT(
                        COALESCE(notes, ''),
                        CASE
                            WHEN COALESCE(notes, '') = '' THEN ''
                            ELSE '\n'
                        END,
                        'Linked to direct intake shipment ',
                        :shipment_reference
                    )
                ),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :manifest_id
              AND (
                  matched_shipment_id IS NULL
                  OR matched_shipment_id = ''
              )
        ");

        $manifestUpdate->execute([
            ":shipment_id" => $shipmentId,
            ":shipment_reference" => $shipmentReference,
            ":manifest_id" => $manifest["id"]
        ]);

        $manifestContainerQuery = $conn->prepare("
            SELECT id, container_no
            FROM operation_manifest_containers
            WHERE manifest_id = :manifest_id
        ");

        $manifestContainerQuery->execute([
            ":manifest_id" => $manifest["id"]
        ]);

        $manifestContainers = $manifestContainerQuery->fetchAll(PDO::FETCH_ASSOC);

        $shipmentContainerQuery = $conn->prepare("
            SELECT id, container_no
            FROM portal_shipment_containers
            WHERE shipment_id = :shipment_id
        ");

        $shipmentContainerQuery->execute([
            ":shipment_id" => $shipmentId
        ]);

        $shipmentContainers = $shipmentContainerQuery->fetchAll(PDO::FETCH_ASSOC);

        $shipmentContainerMap = [];

        foreach ($shipmentContainers as $shipmentContainer) {
            $shipmentContainerMap[
                $normalise($shipmentContainer["container_no"])
            ] = $shipmentContainer["id"];
        }

        $manifestContainerUpdate = $conn->prepare("
            UPDATE operation_manifest_containers
            SET
                matched_shipment_id = :shipment_id,
                matched_shipment_container_id = :container_id
            WHERE id = :id
        ");

        foreach ($manifestContainers as $manifestContainer) {
            $normalisedContainerNo = $normalise(
                $manifestContainer["container_no"]
            );

            if (isset($shipmentContainerMap[$normalisedContainerNo])) {
                $manifestContainerUpdate->execute([
                    ":shipment_id" => $shipmentId,
                    ":container_id" => $shipmentContainerMap[$normalisedContainerNo],
                    ":id" => $manifestContainer["id"]
                ]);
            }
        }
    }

    $conn->commit();
    $transactionStarted = false;

    http_response_code(201);

    echo json_encode([
        "error" => false,
        "data" => "Direct intake request submitted successfully.",
        "code" => [
            "id" => $shipmentId,
            "shipment_id" => $shipmentId,
            "shipment_reference" => $shipmentReference,
            "status" => "pending_review",
            "manifest_id" => $manifest["id"] ?? null,
            "manifest_reference" => $manifest["manifest_ref"] ?? null,
            "manifest_linked" => $manifest !== false,
            "containers_saved" => count($containers),
            "documents_saved" => count($uploadedDocuments)
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
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    if ($transactionStarted && $conn->inTransaction()) {
        $conn->rollBack();
    }

    foreach ($createdFiles as $file) {
        if (is_file($file)) {
            unlink($file);
        }
    }

    error_log("Direct intake submission error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Could not submit the direct intake request.",
        "code" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}