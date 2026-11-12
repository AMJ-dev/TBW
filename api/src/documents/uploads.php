<?php

    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    if (($_SERVER["REQUEST_METHOD"] ?? "") !== "POST") {
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed.",
            "code" => null
        ]);
        exit;
    }

    $uploadedFilePath = null;
    $previousFilePath = null;
    $transactionStarted = false;

    try {
        $userId = trim((string) ($my_details->id ?? ""));
        $organisationId = trim((string) ($my_details->organisation_id ?? ""));

        if ($userId === "" || $organisationId === "") {
            http_response_code(401);

            echo json_encode([
                "error" => true,
                "data" => "Authentication or organisation information is missing.",
                "code" => null
            ]);
            exit;
        }

        $shipmentId = trim((string) ($_POST["id"] ?? ""));
        $documentKey = trim((string) ($_POST["document_type"] ?? ""));
        $documentId = trim((string) ($_POST["document_id"] ?? ""));
        if ($shipmentId === "") throw new InvalidArgumentException("Shipment ID is required.");
        
        if (!isset($_FILES["file"]) || !is_array($_FILES["file"])) throw new InvalidArgumentException("Please select a document to upload.");

        $file = $_FILES["file"];

        if ($file["error"] !== UPLOAD_ERR_OK) {
            throw new InvalidArgumentException(
                $file["error"] === UPLOAD_ERR_INI_SIZE ||
                $file["error"] === UPLOAD_ERR_FORM_SIZE
                    ? "The uploaded file exceeds the allowed size."
                    : "The document upload failed."
            );
        }

        if (!is_uploaded_file($file["tmp_name"]) || (int) $file["size"] <= 0) throw new InvalidArgumentException("Invalid uploaded document.");

        $maxFileSize = 10 * 1024 * 1024;

        if ((int) $file["size"] > $maxFileSize) throw new InvalidArgumentException("Document size must not exceed 10 MB.");

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file["tmp_name"]);

        $allowedMimeTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!in_array($mimeType, $allowedMimeTypes, true)) throw new InvalidArgumentException("Only PDF, JPG, PNG and WEBP documents are allowed.");

        $file["type"] = $mimeType;

        $conn->beginTransaction();
        $transactionStarted = true;

        $shipmentQuery = $conn->prepare("
            SELECT
                id,
                shipment_reference
            FROM portal_shipments
            WHERE id = :id
            AND organisation_id = :organisation_id
            LIMIT 1
            FOR UPDATE
        ");

        $shipmentQuery->execute([
            ":id" => $shipmentId,
            ":organisation_id" => $organisationId
        ]);

        $shipment = $shipmentQuery->fetch(PDO::FETCH_ASSOC);

        if (!$shipment) throw new InvalidArgumentException("Shipment not found or you do not have permission to update it.");

        $documentRule = null;
        $documentLabel = "";
        $allowMultiple = true;
        $previousDocument = null;

        if ($documentId !== "") {
            $previousDocumentQuery = $conn->prepare("
                SELECT
                    id,
                    shipment_id,
                    document_type,
                    status,
                    file_path
                FROM portal_shipment_documents
                WHERE id = :id
                AND shipment_id = :shipment_id
                LIMIT 1
                FOR UPDATE
            ");

            $previousDocumentQuery->execute([
                ":id" => $documentId,
                ":shipment_id" => $shipmentId
            ]);

            $previousDocument = $previousDocumentQuery->fetch(PDO::FETCH_ASSOC);

            if (!$previousDocument) throw new InvalidArgumentException("The document being replaced was not found.");

            if ($previousDocument["status"] === "VERIFIED") throw new InvalidArgumentException("Verified documents cannot be replaced.");

            $documentLabel = $previousDocument["document_type"];
            $previousFilePath = $previousDocument["file_path"];
        } else {
            if ($documentKey === "") throw new InvalidArgumentException("Document type is required.");

            $documentRuleQuery = $conn->prepare("
                SELECT
                    dt.document_key,
                    dt.label,
                    dult.is_required,
                    dult.allow_multiple
                FROM document_types dt
                INNER JOIN document_config_versions dcv
                    ON dcv.id = dt.config_version_id
                AND dcv.is_current = 1
                INNER JOIN document_upload_location_types dult
                    ON dult.document_key = dt.document_key
                INNER JOIN document_upload_locations dul
                    ON dul.id = dult.location_id
                WHERE dul.location_key = 'shipment_documents'
                AND dul.is_active = 1
                AND dt.document_key = :document_key
                LIMIT 1
            ");

            $documentRuleQuery->execute([
                ":document_key" => $documentKey
            ]);

            $documentRule = $documentRuleQuery->fetch(PDO::FETCH_ASSOC);

            if (!$documentRule) throw new InvalidArgumentException("Invalid shipment document type.");

            $documentLabel = $documentRule["label"];
            $allowMultiple = (int) $documentRule["allow_multiple"] === 1;
        }

        $referenceCode = generate_ref(clean_type($documentLabel));

        if (!$documentId && !$allowMultiple) {
            $duplicateQuery = $conn->prepare("
                SELECT COUNT(*)
                FROM portal_shipment_documents
                WHERE shipment_id = :shipment_id
                AND document_type = :document_type
            ");

            $duplicateQuery->execute([
                ":shipment_id" => $shipmentId,
                ":document_type" => $documentLabel,
            ]);

            if ((int) $duplicateQuery->fetchColumn() > 0) {
                throw new InvalidArgumentException(
                    "A document of this type already exists. Replace the existing document instead."
                );
            }
        }

        $originalName = basename((string) $file["name"]);

        $upload = upload_files($file, $allowedMimeTypes);

        if (!is_array($upload) || !empty($upload["error"])) {
            throw new InvalidArgumentException(
                is_array($upload)
                    ? (string) ($upload["data"] ?? "Unable to upload document.")
                    : "Unable to upload document."
            );
        }

        $uploadedFilePath = (string) ($upload["data"] ?? "");

        if ($uploadedFilePath === "") throw new RuntimeException("The upload helper did not return a file path.");

        $storedName = basename($uploadedFilePath);
        $newDocumentId = generateId();

        $insertDocument = $conn->prepare("
            INSERT INTO portal_shipment_documents (
                id,
                shipment_id,
                reference_code,
                document_type,
                original_name,
                stored_name,
                file_path,
                mime_type,
                file_size,
                status
            ) VALUES (
                :id,
                :shipment_id,
                :reference_code,
                :document_type,
                :original_name,
                :stored_name,
                :file_path,
                :mime_type,
                :file_size,
                'PENDING_REVIEW'
            )
        ");

        $insertDocument->execute([
            ":id" => $newDocumentId,
            ":shipment_id" => $shipmentId,
            ":reference_code" => $referenceCode !== "" ? $referenceCode : null,
            ":document_type" => $documentLabel,
            ":original_name" => $originalName,
            ":stored_name" => $storedName,
            ":file_path" => $uploadedFilePath,
            ":mime_type" => $mimeType,
            ":file_size" => (int) $file["size"]
        ]);

        if ($previousDocument) {
            $deletePrevious = $conn->prepare("
                DELETE FROM portal_shipment_documents
                WHERE id = :id
                AND shipment_id = :shipment_id
            ");

            $deletePrevious->execute([
                ":id" => $previousDocument["id"],
                ":shipment_id" => $shipmentId
            ]);

            if ($deletePrevious->rowCount() !== 1) {
                throw new RuntimeException(
                    "The previous document could not be deleted."
                );
            }
        }

        $summaryQuery = $conn->prepare("
            SELECT
                COUNT(*) AS total_documents,
                SUM(status = 'REJECTED') AS rejected_count,
                SUM(status = 'CHANGES_REQUESTED') AS changes_count,
                SUM(status = 'VERIFIED') AS verified_count
            FROM portal_shipment_documents
            WHERE shipment_id = :shipment_id
        ");

        $summaryQuery->execute([
            ":shipment_id" => $shipmentId
        ]);

        $summary = $summaryQuery->fetch(PDO::FETCH_ASSOC);

        $totalDocuments = (int) ($summary["total_documents"] ?? 0);
        $rejectedCount = (int) ($summary["rejected_count"] ?? 0);
        $changesCount = (int) ($summary["changes_count"] ?? 0);
        $verifiedCount = (int) ($summary["verified_count"] ?? 0);

        if ($totalDocuments === 0) {
            $documentStatus = "MISSING";
        } elseif ($rejectedCount > 0) {
            $documentStatus = "REJECTED";
        } elseif ($changesCount > 0) {
            $documentStatus = "CHANGES_REQUESTED";
        } elseif ($verifiedCount === $totalDocuments) {
            $documentStatus = "VERIFIED";
        } else {
            $documentStatus = "PENDING_REVIEW";
        }

        $updateShipment = $conn->prepare("
            UPDATE portal_shipments
            SET document_status = :document_status
            WHERE id = :shipment_id
        ");

        $updateShipment->execute([
            ":document_status" => $documentStatus,
            ":shipment_id" => $shipmentId
        ]);

        $conn->commit();
        $transactionStarted = false;

        if ($previousFilePath !== null && $previousFilePath !== "") {
            delete_file($previousFilePath);
        }

        $uploadedFilePath = null;

        echo json_encode([
            "error" => false,
            "data" => $previousDocument
                ? "Document replaced successfully and submitted for review."
                : "Document uploaded successfully and submitted for review.",
            "code" => [
                "document_id" => $newDocumentId,
                "shipment_id" => $shipmentId,
                "shipment_reference" => $shipment["shipment_reference"],
                "document_type" => $documentLabel,
                "status" => "PENDING_REVIEW",
                "document_status" => $documentStatus
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    } catch (InvalidArgumentException $e) {
        if ($transactionStarted && $conn->inTransaction()) {
            $conn->rollBack();
        }

        if ($uploadedFilePath !== null) {
            delete_file($uploadedFilePath);
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

        if ($uploadedFilePath !== null) {
            delete_file($uploadedFilePath);
        }

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not upload or replace document.",
            "code" => null
        ]);
    }
