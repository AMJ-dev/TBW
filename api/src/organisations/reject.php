<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $id = trim($_GET["id"] ?? "");

    if ($id === "") {
        http_response_code(400);

        echo json_encode([
            "error" => true,
            "data" => "Invalid organisation ID",
            "code" => null
        ]);

        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);

        echo json_encode([
            "error" => true,
            "data" => "Method not allowed",
            "code" => null
        ]);

        exit;
    }

    $reason = trim($_POST["reason"] ?? "");
    $documents = $_POST["documents"] ?? [];

    if ($reason === "") {
        http_response_code(400);

        echo json_encode([
            "error" => true,
            "data" => "Rejection reason is required",
            "code" => null
        ]);

        exit;
    }

    if (!is_array($documents)) {
        $documents = [];
    }

    try {

        $stmt = $conn->prepare("
            SELECT
                id,
                organisation_name,
                verification_status
            FROM organisations
            WHERE id = :id
            LIMIT 1
        ");

        $stmt->execute([
            ":id" => $id
        ]);

        $organisation = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$organisation) {
            http_response_code(404);

            echo json_encode([
                "error" => true,
                "data" => "Organisation not found",
                "code" => null
            ]);

            exit;
        }

        if (in_array($organisation["verification_status"], ["verified", "suspended"], true)) {
            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "Organisation cannot be rejected from its current status",
                "code" => null
            ]);

            exit;
        }

        $conn->beginTransaction();

        $stmt = $conn->prepare("
            UPDATE organisations
            SET
                verification_status = 'rejected',
                rejection_reason = :rejection_reason,
                verified_by = :verified_by,
                verified_at = NOW()
            WHERE id = :id
        ");

        $stmt->execute([
            ":rejection_reason" => $reason,
            ":verified_by" => $my_details->id,
            ":id" => $id
        ]);

        $processedDocuments = [];

        foreach ($documents as $document) {

            if (!is_array($document)) {
                continue;
            }

            $documentId = trim($document["id"] ?? "");
            $status = trim($document["status"] ?? "");
            $documentReason = trim($document["reason"] ?? "");

            if ($documentId === "") {
                continue;
            }

            if (!in_array($status, ["approved", "rejected"], true)) {
                continue;
            }

            if ($status === "rejected" && $documentReason === "") {
                $conn->rollBack();

                http_response_code(400);

                echo json_encode([
                    "error" => true,
                    "data" => "A rejection reason is required for every rejected document",
                    "code" => [
                        "document_id" => $documentId
                    ]
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                SELECT
                    rd.id,
                    rd.document_type,
                    rd.original_name
                FROM registration_documents rd
                INNER JOIN registration_requests rr
                    ON rr.id = rd.registration_request_id
                INNER JOIN users u
                    ON u.id = rr.completed_user_id
                WHERE rd.id = :document_id
                AND u.organisation_id = :organisation_id
                LIMIT 1
            ");

            $stmt->execute([
                ":document_id" => $documentId,
                ":organisation_id" => $id
            ]);

            $documentRecord = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$documentRecord) {
                $conn->rollBack();

                http_response_code(400);

                echo json_encode([
                    "error" => true,
                    "data" => "Document does not belong to this organisation",
                    "code" => [
                        "document_id" => $documentId
                    ]
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                SELECT id
                FROM organisation_document_reviews
                WHERE registration_document_id = :document_id
                LIMIT 1
            ");

            $stmt->execute([
                ":document_id" => $documentId
            ]);

            $review = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($review) {

                $stmt = $conn->prepare("
                    UPDATE organisation_document_reviews
                    SET
                        organisation_id = :organisation_id,
                        status = :status,
                        rejection_reason = :rejection_reason,
                        reviewed_by = :reviewed_by,
                        reviewed_at = NOW()
                    WHERE registration_document_id = :document_id
                ");

                $stmt->execute([
                    ":organisation_id" => $id,
                    ":status" => $status,
                    ":rejection_reason" => $status === "rejected" ? $documentReason : null,
                    ":reviewed_by" => $my_details->id,
                    ":document_id" => $documentId
                ]);

            } else {

                $stmt = $conn->prepare("
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
                        :document_id,
                        :organisation_id,
                        :status,
                        :rejection_reason,
                        :reviewed_by,
                        NOW()
                    )
                ");

                $stmt->execute([
                    ":document_id" => $documentId,
                    ":organisation_id" => $id,
                    ":status" => $status,
                    ":rejection_reason" => $status === "rejected" ? $documentReason : null,
                    ":reviewed_by" => $my_details->id
                ]);
            }

            $processedDocuments[] = [
                "id" => $documentRecord["id"],
                "document_type" => $documentRecord["document_type"],
                "original_name" => $documentRecord["original_name"],
                "status" => $status,
                "reason" => $status === "rejected" ? $documentReason : null
            ];
        }

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Organisation rejected successfully",
            "code" => [
                "id" => $id,
                "status" => "rejected",
                "rejection_reason" => $reason,
                "documents" => $processedDocuments
            ]
        ]);

    } catch (Throwable $e) {

        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => $e->getMessage(),
            "code" => null
        ]);
    }