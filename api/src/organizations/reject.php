<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $id = trim($_GET["id"] ?? "");
    $generalReason = trim($_POST["reason"] ?? "");
    $documents = $_POST["documents"] ?? [];

    if ($id === "") {
        echo json_encode([
            "error" => true,
            "data" => "Organisation ID is required."
        ]);
        exit;
    }

    if (!is_array($documents) || empty($documents)) {
        echo json_encode([
            "error" => true,
            "data" => "At least one document must be rejected."
        ]);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            SELECT
                id,
                organisation_name,
                verification_status
            FROM organisations
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->execute([$id]);

        $organisation = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$organisation) {
            $pdo->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Organisation not found."
            ]);
            exit;
        }

        $processedDocuments = [];

        foreach ($documents as $document) {
            if (!is_array($document)) {
                continue;
            }

            $documentId = trim($document["id"] ?? "");
            $status = trim($document["status"] ?? "");
            $reason = trim($document["reason"] ?? "");

            if ($documentId === "") {
                continue;
            }

            if ($status !== "rejected") {
                continue;
            }

            if ($reason === "") {
                $pdo->rollBack();

                echo json_encode([
                    "error" => true,
                    "data" => "A rejection reason is required for every rejected document."
                ]);
                exit;
            }

            $stmt = $pdo->prepare("
                SELECT
                    rd.id,
                    rd.registration_request_id,
                    rd.document_type,
                    rd.licence_type,
                    rd.licence_reference,
                    rd.file_path,
                    rd.original_name,
                    rd.mime_type,
                    rd.file_size
                FROM registration_documents rd
                INNER JOIN registration_requests rr
                    ON rr.id = rd.registration_request_id
                INNER JOIN users u
                    ON u.id = rr.completed_user_id
                WHERE rd.id = ?
                AND u.organisation_id = ?
                LIMIT 1
            ");

            $stmt->execute([
                $documentId,
                $id
            ]);

            $dbDocument = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$dbDocument) {
                $pdo->rollBack();

                echo json_encode([
                    "error" => true,
                    "data" => "Document not found or does not belong to this organisation.",
                    "document_id" => $documentId
                ]);
                exit;
            }

            $stmt = $pdo->prepare("
                SELECT id
                FROM organisation_document_reviews
                WHERE registration_document_id = ?
                LIMIT 1
            ");

            $stmt->execute([$documentId]);

            $review = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($review) {
                $stmt = $pdo->prepare("
                    UPDATE organisation_document_reviews
                    SET
                        organisation_id = ?,
                        status = 'rejected',
                        rejection_reason = ?,
                        reviewed_by = ?,
                        reviewed_at = NOW()
                    WHERE registration_document_id = ?
                ");

                $stmt->execute([
                    $id,
                    $reason,
                    $my_details->id,
                    $documentId
                ]);
            } else {
                $stmt = $pdo->prepare("
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
                        UUID(),
                        ?,
                        ?,
                        'rejected',
                        ?,
                        ?,
                        NOW()
                    )
                ");

                $stmt->execute([
                    $documentId,
                    $id,
                    $reason,
                    $my_details->id
                ]);
            }

            $processedDocuments[] = [
                "id" => $dbDocument["id"],
                "document_type" => $dbDocument["document_type"],
                "licence_type" => $dbDocument["licence_type"],
                "licence_reference" => $dbDocument["licence_reference"],
                "file_path" => $dbDocument["file_path"],
                "original_name" => $dbDocument["original_name"],
                "mime_type" => $dbDocument["mime_type"],
                "file_size" => $dbDocument["file_size"],
                "status" => "rejected",
                "reason" => $reason
            ];
        }

        if (empty($processedDocuments)) {
            $pdo->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "No valid rejected documents were supplied."
            ]);
            exit;
        }

        if ($generalReason === "") {
            $generalReason = "One or more submitted documents require replacement.";
        }

        $stmt = $pdo->prepare("
            UPDATE organisations
            SET
                verification_status = 'rejected',
                rejection_reason = ?,
                verified_by = ?,
                verified_at = NOW()
            WHERE id = ?
        ");

        $stmt->execute([
            $generalReason,
            $my_details->id,
            $id
        ]);

        $pdo->commit();

        echo json_encode([
            "error" => false,
            "data" => "Organisation rejected successfully.",
            "code" => [
                "organisation" => [
                    "id" => $organisation["id"],
                    "organisation_name" => $organisation["organisation_name"],
                    "verification_status" => "rejected",
                    "rejection_reason" => $generalReason
                ],
                "documents" => $processedDocuments
            ]
        ]);

    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        echo json_encode([
            "error" => true,
            "data" => "Unable to reject organisation."
        ]);
    }