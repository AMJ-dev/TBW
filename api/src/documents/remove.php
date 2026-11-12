
<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $file_path = null;

    try {
        $document_id = trim($_POST["id"] ?? "");

        if ($document_id === "") {
            echo json_encode([
                "error" => true,
                "data" => "Document ID is required.",
                "code" => null
            ]);
            exit;
        }

        $conn->beginTransaction();

        $stmt = $conn->prepare("
            SELECT
                d.id,
                d.shipment_id,
                d.status,
                d.file_path
            FROM portal_shipment_documents d
            INNER JOIN portal_shipments s
                ON BINARY s.id = BINARY d.shipment_id
            WHERE BINARY d.id = BINARY :id
            AND BINARY s.organisation_id = BINARY :organisation_id
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->execute([
            ":id" => $document_id,
            ":organisation_id" => $my_details->organisation_id
        ]);

        $document = $stmt->fetch(PDO::FETCH_OBJ);

        if (!$document) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Document not found.",
                "code" => null
            ]);
            exit;
        }

        if ($document->status === "VERIFIED") {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Verified documents cannot be deleted.",
                "code" => null
            ]);
            exit;
        }

        if (!in_array($document->status, ["PENDING_REVIEW", "CHANGES_REQUESTED", "REJECTED"], true)) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "This document cannot be deleted in its current status.",
                "code" => null
            ]);
            exit;
        }

        $file_path = $document->file_path;

        $stmt = $conn->prepare("DELETE FROM portal_shipment_documents WHERE id = :id");

        $stmt->execute([":id" => $document_id]);

        if ($stmt->rowCount() !== 1) throw new RuntimeException("Could not delete document record.");

        $stmt = $conn->prepare("
            SELECT
                COUNT(*) AS total_documents,
                SUM(status = 'REJECTED') AS rejected_count,
                SUM(status = 'CHANGES_REQUESTED') AS changes_count,
                SUM(status = 'VERIFIED') AS verified_count
            FROM portal_shipment_documents
            WHERE shipment_id = :shipment_id
        ");

        $stmt->execute([":shipment_id" => $document->shipment_id]);

        $summary = $stmt->fetch(PDO::FETCH_OBJ);

        if ((int) $summary->total_documents === 0) $document_status = "MISSING";
        elseif ((int) $summary->rejected_count > 0) $document_status = "REJECTED";
        elseif ((int) $summary->changes_count > 0) $document_status = "CHANGES_REQUESTED";
        elseif ((int) $summary->verified_count === (int) $summary->total_documents) $document_status = "VERIFIED";
        else $document_status = "PENDING_REVIEW";

        $stmt = $conn->prepare("UPDATE portal_shipments SET document_status = :document_status WHERE id = :shipment_id");

        $stmt->execute([
            ":document_status" => $document_status,
            ":shipment_id" => $document->shipment_id
        ]);

        $conn->commit();

        if (!empty($file_path)) delete_file($file_path);

        echo json_encode([
            "error" => false,
            "data" => "Document deleted successfully.",
            "code" => [
                "document_id" => $document_id,
                "shipment_id" => $document->shipment_id,
                "document_status" => $document_status
            ]
        ]);

    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        echo json_encode([
            "error" => true,
            "data" => "Could not delete document.",
            "code" => null
        ]);
    }
