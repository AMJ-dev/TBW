
<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if ($my_details->account_type !== "system") {
    http_response_code(403);
    echo json_encode([
        "error" => true,
        "data" => "Access denied.",
        "code" => null
    ]);
    exit;
}

$action = strtoupper(trim($_POST["action"] ?? ""));
$shipment_id = trim($_POST["shipment_id"] ?? "");

$statusChanges = $_POST["status_changes"] ?? [];
$missingDocuments = $_POST["missing_documents"] ?? [];

if ($action !== "BULK_UPDATE") {
    http_response_code(400);
    echo json_encode([
        "error" => true,
        "data" => "Invalid action.",
        "code" => null
    ]);
    exit;
}

if ($shipment_id === "") {
    http_response_code(400);
    echo json_encode([
        "error" => true,
        "data" => "Shipment ID is required.",
        "code" => null
    ]);
    exit;
}

if (!is_array($statusChanges) || !is_array($missingDocuments)) {
    http_response_code(400);
    echo json_encode([
        "error" => true,
        "data" => "Invalid document data.",
        "code" => null
    ]);
    exit;
}

if (count($statusChanges) === 0 && count($missingDocuments) === 0) {
    http_response_code(400);
    echo json_encode([
        "error" => true,
        "data" => "No document changes were submitted.",
        "code" => null
    ]);
    exit;
}

$allowedStatuses = [
    "VERIFIED",
    "REJECTED",
    "CHANGES_REQUESTED"
];

try {
    $conn->beginTransaction();

    $stmt = $conn->prepare("
        SELECT id, shipment_reference, status, document_status
        FROM portal_shipments
        WHERE id = :id
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->execute(["id" => $shipment_id]);
    $shipment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$shipment) {
        $conn->rollBack();

        http_response_code(404);
        echo json_encode([
            "error" => true,
            "data" => "Shipment not found.",
            "code" => null
        ]);
        exit;
    }

    $updatedDocuments = [];
    $createdMissingDocuments = [];

    foreach ($statusChanges as $item) {
        $document_id = trim($item["id"] ?? "");
        $status = strtoupper(trim($item["status"] ?? ""));
        $reason = trim($item["reason"] ?? "");

        if ($document_id === "" || $status === "") {
            throw new RuntimeException("Document ID and status are required.");
        }

        if (!in_array($status, $allowedStatuses, true)) {
            throw new RuntimeException("Invalid document status.");
        }

        if (in_array($status, ["REJECTED", "CHANGES_REQUESTED"], true) && $reason === "") {
            throw new RuntimeException("A reason is required for rejected or correction-requested documents.");
        }

        $stmt = $conn->prepare("
            SELECT id, shipment_id, status
            FROM portal_shipment_documents
            WHERE id = :id
            AND shipment_id = :shipment_id
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->execute([
            "id" => $document_id,
            "shipment_id" => $shipment_id
        ]);

        $document = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$document) {
            throw new RuntimeException("One of the submitted documents does not belong to this shipment.");
        }

        if ($document["status"] !== "PENDING_REVIEW") {
            throw new RuntimeException("Only documents pending review can have their status changed.");
        }

        $stmt = $conn->prepare("
            UPDATE portal_shipment_documents
            SET
                status = :status,
                review_reason = :reason
            WHERE id = :id
            AND shipment_id = :shipment_id
            AND status = 'PENDING_REVIEW'
        ");

        $stmt->execute([
            "status" => $status,
            "reason" => $reason !== "" ? $reason : null,
            "id" => $document_id,
            "shipment_id" => $shipment_id
        ]);

        if ($stmt->rowCount() !== 1) {
            throw new RuntimeException("A document status could not be changed. Please refresh and try again.");
        }

        $updatedDocuments[] = $document_id;
    }

    foreach ($missingDocuments as $item) {
        $document_key = trim($item["document_key"] ?? "");
        $document_type = trim($item["document_type"] ?? "");
        $reason = trim($item["reason"] ?? "");

        if ($document_key === "" || $document_type === "") {
            throw new RuntimeException("Document key and document type are required for missing documents.");
        }

        if ($reason === "") {
            throw new RuntimeException("A reason is required for each missing document.");
        }

        $stmt = $conn->prepare("
            SELECT id, status
            FROM portal_shipment_documents
            WHERE shipment_id = :shipment_id
            AND document_key = :document_key
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->execute([
            "shipment_id" => $shipment_id,
            "document_key" => $document_key
        ]);

        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            if ($existing["status"] !== "MISSING") {
                throw new RuntimeException(
                    $document_type . " already has an uploaded document."
                );
            }

            $stmt = $conn->prepare("
                UPDATE portal_shipment_documents
                SET
                    document_type = :document_type,
                    status = 'MISSING',
                    review_reason = :reason
                WHERE id = :id
            ");

            $stmt->execute([
                "document_type" => $document_type,
                "reason" => $reason,
                "id" => $existing["id"]
            ]);

            $createdMissingDocuments[] = $existing["id"];
            continue;
        }

        $missing_id = generateId();

        $stmt = $conn->prepare("
            INSERT INTO portal_shipment_documents (
                id,
                shipment_id,
                document_key,
                reference_code,
                document_type,
                original_name,
                stored_name,
                file_path,
                mime_type,
                file_size,
                status,
                review_reason,
                uploaded_at
            ) VALUES (
                :id,
                :shipment_id,
                :document_key,
                NULL,
                :document_type,
                'Not uploaded',
                '',
                '',
                '',
                0,
                'MISSING',
                :reason,
                NOW()
            )
        ");

        $stmt->execute([
            "id" => $missing_id,
            "shipment_id" => $shipment_id,
            "document_key" => $document_key,
            "document_type" => $document_type,
            "reason" => $reason
        ]);

        $createdMissingDocuments[] = $missing_id;
    }

    $stmt = $conn->prepare("
        SELECT
            COUNT(*) AS total,
            SUM(status = 'VERIFIED') AS verified,
            SUM(status = 'PENDING_REVIEW') AS pending,
            SUM(status = 'CHANGES_REQUESTED') AS correction_requested,
            SUM(status = 'REJECTED') AS rejected,
            SUM(status = 'MISSING') AS missing
        FROM portal_shipment_documents
        WHERE shipment_id = :shipment_id
    ");

    $stmt->execute(["shipment_id" => $shipment_id]);
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);

    $total = (int) $summary["total"];
    $verified = (int) $summary["verified"];
    $pending = (int) $summary["pending"];
    $correctionRequested = (int) $summary["correction_requested"];
    $rejected = (int) $summary["rejected"];
    $missing = (int) $summary["missing"];

    if ($total > 0 && $verified === $total) {
        $documentStatus = "VERIFIED";
    } elseif ($total > 0 && $rejected === $total) {
        $documentStatus = "REJECTED";
    } elseif (
        $correctionRequested > 0 ||
        $missing > 0 ||
        $rejected > 0
    ) {
        $documentStatus = "ACTION_REQUIRED";
    } else {
        $documentStatus = "PENDING_REVIEW";
    }

    $stmt = $conn->prepare("
        UPDATE portal_shipments
        SET document_status = :document_status
        WHERE id = :id
    ");

    $stmt->execute([
        "document_status" => $documentStatus,
        "id" => $shipment_id
    ]);

    $conn->commit();

    $stmt = $conn->prepare("
        SELECT
            id,
            shipment_id,
            document_key,
            reference_code,
            document_type,
            original_name,
            stored_name,
            file_path,
            mime_type,
            file_size,
            status,
            review_reason,
            uploaded_at
        FROM portal_shipment_documents
        WHERE shipment_id = :shipment_id
        ORDER BY uploaded_at DESC
    ");

    $stmt->execute(["shipment_id" => $shipment_id]);
    $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($documents as &$document) {
        $document["file_size"] = (int) $document["file_size"];
    }

    unset($document);

    $stmt = $conn->prepare("
        SELECT
            id,
            shipment_reference,
            document_status,
            status
        FROM portal_shipments
        WHERE id = :id
        LIMIT 1
    ");

    $stmt->execute(["id" => $shipment_id]);
    $updatedShipment = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "error" => false,
        "data" => "Shipment documents updated successfully.",
        "code" => [
            "shipment" => $updatedShipment,
            "documents" => $documents,
            "summary" => [
                "total" => $total,
                "verified" => $verified,
                "pending" => $pending,
                "correction_requested" => $correctionRequested,
                "rejected" => $rejected,
                "missing" => $missing
            ],
            "updated_document_ids" => $updatedDocuments,
            "missing_document_ids" => $createdMissingDocuments
        ]
    ]);

} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(400);

    echo json_encode([
        "error" => true,
        "data" => $e instanceof RuntimeException
            ? $e->getMessage()
            : "Could not update shipment documents.",
        "code" => null
    ]);
}
