<?php

require_once dirname(__DIR__, 2) . "/include/check-user.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "error" => true,
        "data" => "Method not allowed",
        "code" => null
    ]);

    exit;
}

if ($my_details->account_type !== "organisation") {
    http_response_code(403);

    echo json_encode([
        "error" => true,
        "data" => "Only organisation accounts can submit registration updates.",
        "code" => null
    ]);

    exit;
}

$organisation_id = trim($my_details->organisation_id ?? "");

$name = trim($_POST["name"] ?? "");
$rc_number = trim($_POST["rc_number"] ?? "");
$tin = trim($_POST["tin"] ?? "");

if ($organisation_id === "") {
    http_response_code(400);

    echo json_encode([
        "error" => true,
        "data" => "Organisation not found.",
        "code" => null
    ]);

    exit;
}

if ($name === "") {
    http_response_code(400);

    echo json_encode([
        "error" => true,
        "data" => "Company name is required.",
        "code" => null
    ]);

    exit;
}

if ($rc_number === "") {
    http_response_code(400);

    echo json_encode([
        "error" => true,
        "data" => "RC number is required.",
        "code" => null
    ]);

    exit;
}

if (strlen($name) > 255) {
    http_response_code(400);

    echo json_encode([
        "error" => true,
        "data" => "Company name is too long.",
        "code" => null
    ]);

    exit;
}

if (strlen($rc_number) > 100) {
    http_response_code(400);

    echo json_encode([
        "error" => true,
        "data" => "RC number is too long.",
        "code" => null
    ]);

    exit;
}

if ($tin !== "" && strlen($tin) > 100) {
    http_response_code(400);

    echo json_encode([
        "error" => true,
        "data" => "TIN is too long.",
        "code" => null
    ]);

    exit;
}

$documents = $_FILES["documents"] ?? [];

if (!empty($documents) && !isset($documents["name"])) {
    http_response_code(400);

    echo json_encode([
        "error" => true,
        "data" => "Invalid document upload data.",
        "code" => null
    ]);

    exit;
}

$allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp"
];

$maxFileSize = 5 * 1024 * 1024;

try {

    $conn->beginTransaction();

    $stmt = $conn->prepare("
        SELECT
            id,
            organisation_name,
            rc_number,
            tin,
            organisation_type,
            verification_status,
            rejection_reason
        FROM organisations
        WHERE id = :organisation_id
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->execute([
        ":organisation_id" => $organisation_id
    ]);

    $organisation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$organisation) {
        $conn->rollBack();

        http_response_code(404);

        echo json_encode([
            "error" => true,
            "data" => "Organisation not found.",
            "code" => null
        ]);

        exit;
    }

    if (!in_array($organisation["verification_status"], ["rejected", "pending"], true)) {
        $conn->rollBack();

        http_response_code(400);

        echo json_encode([
            "error" => true,
            "data" => "Registration cannot be resubmitted from the current organisation status.",
            "code" => [
                "status" => $organisation["verification_status"]
            ]
        ]);

        exit;
    }

    $documentIds = [];

    if (!empty($documents["name"]) && is_array($documents["name"])) {
        foreach ($documents["name"] as $documentId => $fileName) {
            $documentIds[] = (string)$documentId;
        }
    }

    $documentIds = array_values(array_unique($documentIds));

    $rejectedDocuments = [];

    if (!empty($documentIds)) {

        $placeholders = [];

        $params = [
            ":organisation_id" => $organisation_id
        ];

        foreach ($documentIds as $index => $documentId) {
            $placeholder = ":document_id_" . $index;
            $placeholders[] = $placeholder;
            $params[$placeholder] = $documentId;
        }

        $stmt = $conn->prepare("
            SELECT
                rd.id,
                rd.registration_request_id,
                rd.document_type,
                rd.licence_type,
                rd.licence_reference,
                rd.file_path,
                rd.original_name,
                odr.status,
                odr.rejection_reason
            FROM registration_documents rd
            INNER JOIN registration_requests rr
                ON rr.id = rd.registration_request_id
            INNER JOIN users u
                ON u.id = rr.completed_user_id
            INNER JOIN organisation_document_reviews odr
                ON odr.registration_document_id = rd.id
            WHERE rd.id IN (" . implode(",", $placeholders) . ")
            AND u.organisation_id = :organisation_id
            AND odr.status = 'rejected'
        ");

        $stmt->execute($params);

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $document) {
            $rejectedDocuments[$document["id"]] = $document;
        }

        foreach ($documentIds as $documentId) {
            if (!isset($rejectedDocuments[$documentId])) {
                $conn->rollBack();

                http_response_code(400);

                echo json_encode([
                    "error" => true,
                    "data" => "One or more selected documents are not rejected documents belonging to your organisation.",
                    "code" => [
                        "document_id" => $documentId
                    ]
                ]);

                exit;
            }
        }
    }

    $stmt = $conn->prepare("
        SELECT
            rd.id,
            rd.document_type,
            rd.original_name,
            odr.status
        FROM registration_documents rd
        INNER JOIN registration_requests rr
            ON rr.id = rd.registration_request_id
        INNER JOIN users u
            ON u.id = rr.completed_user_id
        INNER JOIN organisation_document_reviews odr
            ON odr.registration_document_id = rd.id
        WHERE u.organisation_id = :organisation_id
        AND odr.status = 'rejected'
    ");

    $stmt->execute([
        ":organisation_id" => $organisation_id
    ]);

    $allRejectedDocuments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $uploadedDocumentIds = [];

    foreach ($documentIds as $documentId) {
        if (
            !isset($documents["error"][$documentId]) ||
            !isset($documents["tmp_name"][$documentId]) ||
            !isset($documents["name"][$documentId]) ||
            !isset($documents["size"][$documentId])
        ) {
            $conn->rollBack();

            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "Invalid uploaded document.",
                "code" => [
                    "document_id" => $documentId
                ]
            ]);

            exit;
        }

        $error = (int)$documents["error"][$documentId];

        if ($error !== UPLOAD_ERR_OK) {
            $conn->rollBack();

            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "Failed to upload one of the documents.",
                "code" => [
                    "document_id" => $documentId,
                    "upload_error" => $error
                ]
            ]);

            exit;
        }

        $fileSize = (int)$documents["size"][$documentId];

        if ($fileSize <= 0 || $fileSize > $maxFileSize) {
            $conn->rollBack();

            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "Each document must be 5MB or smaller.",
                "code" => [
                    "document_id" => $documentId
                ]
            ]);

            exit;
        }

        $tmpName = $documents["tmp_name"][$documentId];

        if (!is_uploaded_file($tmpName)) {
            $conn->rollBack();

            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "Invalid uploaded file.",
                "code" => [
                    "document_id" => $documentId
                ]
            ]);

            exit;
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($tmpName);

        if (!in_array($mimeType, $allowedMimeTypes, true)) {
            $conn->rollBack();

            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "Only PDF, JPG, PNG, or WebP files are accepted.",
                "code" => [
                    "document_id" => $documentId,
                    "mime_type" => $mimeType
                ]
            ]);

            exit;
        }

        $uploadedDocumentIds[] = $documentId;
    }

    if (count($allRejectedDocuments) > 0) {
        $missingDocuments = [];

        foreach ($allRejectedDocuments as $rejectedDocument) {
            if (!in_array($rejectedDocument["id"], $uploadedDocumentIds, true)) {
                $missingDocuments[] = [
                    "id" => $rejectedDocument["id"],
                    "document_type" => $rejectedDocument["document_type"],
                    "original_name" => $rejectedDocument["original_name"]
                ];
            }
        }

        if (!empty($missingDocuments)) {
            $conn->rollBack();

            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "You must replace every rejected document before submitting your registration.",
                "code" => [
                    "missing_documents" => $missingDocuments
                ]
            ]);

            exit;
        }
    }

    $stmt = $conn->prepare("
        SELECT
            id
        FROM registration_requests
        WHERE completed_user_id = :user_id
        ORDER BY created_at DESC
        LIMIT 1
    ");

    $stmt->execute([
        ":user_id" => $my_details->id
    ]);

    $registrationRequest = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$registrationRequest) {
        $conn->rollBack();

        http_response_code(400);

        echo json_encode([
            "error" => true,
            "data" => "Registration request could not be found.",
            "code" => null
        ]);

        exit;
    }

    $updateOrganisation = $conn->prepare("
        UPDATE organisations
        SET
            organisation_name = :organisation_name,
            rc_number = :rc_number,
            tin = :tin,
            verification_status = 'pending',
            rejection_reason = NULL,
            verified_by = NULL,
            verified_at = NULL
        WHERE id = :organisation_id
    ");

    $updateOrganisation->execute([
        ":organisation_name" => $name,
        ":rc_number" => $rc_number,
        ":tin" => $tin,
        ":organisation_id" => $organisation_id
    ]);

    $updateRegistrationRequest = $conn->prepare("
        UPDATE registration_requests
        SET
            organisation_name = :organisation_name,
            rc_number = :rc_number,
            tin = :tin
        WHERE id = :registration_request_id
    ");

    $updateRegistrationRequest->execute([
        ":organisation_name" => $name,
        ":rc_number" => $rc_number,
        ":tin" => $tin,
        ":registration_request_id" => $registrationRequest["id"]
    ]);

    $uploadedDocuments = [];

    foreach ($uploadedDocumentIds as $documentId) {

        $oldDocument = $rejectedDocuments[$documentId];

        $originalName = basename($documents["name"][$documentId]);
        $fileSize = (int)$documents["size"][$documentId];
        $tmpName = $documents["tmp_name"][$documentId];

        $safeName = preg_replace(
            "/[^a-zA-Z0-9._-]/",
            "_",
            $originalName
        );

        $randomName = bin2hex(random_bytes(16));

        $extension = strtolower(
            pathinfo($safeName, PATHINFO_EXTENSION)
        );

        $storedName = $randomName . "_" . date("Y_m_d_H_i_s");

        if ($extension !== "") {
            $storedName .= "." . $extension;
        }

        $relativePath = "uploads/" . $storedName;
        $absolutePath = dirname(__DIR__, 1) . "/" . $relativePath;

        $uploadDirectory = dirname($absolutePath);

        if (!is_dir($uploadDirectory)) {
            if (!mkdir($uploadDirectory, 0755, true)) {
                throw new RuntimeException("Unable to create upload directory.");
            }
        }

        if (!move_uploaded_file($tmpName, $absolutePath)) {
            throw new RuntimeException(
                "Unable to save uploaded document."
            );
        }

        $newDocumentId = generateId();

        $insertDocument = $conn->prepare("
            INSERT INTO registration_documents (
                id,
                registration_request_id,
                document_type,
                licence_type,
                licence_reference,
                file_path,
                original_name,
                mime_type,
                file_size
            )
            VALUES (
                :id,
                :registration_request_id,
                :document_type,
                :licence_type,
                :licence_reference,
                :file_path,
                :original_name,
                :mime_type,
                :file_size
            )
        ");

        $insertDocument->execute([
            ":id" => $newDocumentId,
            ":registration_request_id" => $registrationRequest["id"],
            ":document_type" => $oldDocument["document_type"],
            ":licence_type" => $oldDocument["licence_type"],
            ":licence_reference" => $oldDocument["licence_reference"],
            ":file_path" => $relativePath,
            ":original_name" => $originalName,
            ":mime_type" => $mimeType,
            ":file_size" => $fileSize
        ]);

        $insertReview = $conn->prepare("
            INSERT INTO organisation_document_reviews (
                id,
                registration_document_id,
                organisation_id,
                status,
                rejection_reason,
                reviewed_by,
                reviewed_at
            )
            VALUES (
                :id,
                :registration_document_id,
                :organisation_id,
                'pending',
                NULL,
                NULL,
                NULL
            )
        ");

        $insertReview->execute([
            ":id" => generateId(),
            ":registration_document_id" => $newDocumentId,
            ":organisation_id" => $organisation_id
        ]);

        $uploadedDocuments[] = [
            "id" => $newDocumentId,
            "replaced_document_id" => $oldDocument["id"],
            "document_type" => $oldDocument["document_type"],
            "status" => "pending",
            "original_name" => $originalName
        ];
    }

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Registration submitted successfully for review.",
        "code" => [
            "organisation" => [
                "id" => $organisation_id,
                "name" => $name,
                "rc_number" => $rc_number,
                "tin" => $tin,
                "status" => "pending"
            ],
            "documents" => [
                "status" => "pending",
                "count" => count($uploadedDocuments),
                "items" => $uploadedDocuments
            ]
        ]
    ]);

} catch (PDOException $e) {

    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    if (isset($absolutePath) && is_file($absolutePath)) {
        @unlink($absolutePath);
    }

    if ((int)$e->errorInfo[1] === 1062) {
        http_response_code(409);

        echo json_encode([
            "error" => true,
            "data" => "The company RC number or TIN is already registered.",
            "code" => null
        ]);

        exit;
    }

    error_log("Organisation registration submission error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Unable to submit registration.",
        "code" => null
    ]);

} catch (Throwable $e) {

    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    if (isset($absolutePath) && is_file($absolutePath)) {
        @unlink($absolutePath);
    }

    error_log("Organisation registration submission error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Unable to submit registration.",
        "code" => null
    ]);
}