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

        if (!in_array($organisation["verification_status"], ["pending", "under_review", "rejected"], true)) {
            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "Organisation cannot be approved from its current status",
                "code" => null
            ]);

            exit;
        }

        $conn->beginTransaction();

        $stmt = $conn->prepare("
            UPDATE organisations
            SET
                verification_status = 'verified',
                verified_by = :verified_by,
                verified_at = NOW(),
                rejection_reason = NULL
            WHERE id = :id
        ");

        $stmt->execute([
            ":verified_by" => $my_details->id,
            ":id" => $id
        ]);

        $stmt = $conn->prepare("
            UPDATE users
            SET
                account_status = 'active'
            WHERE organisation_id = :organisation_id
            AND account_status = 'pending_approval'
        ");

        $stmt->execute([
            ":organisation_id" => $id
        ]);

        $stmt = $conn->prepare("
            UPDATE organisation_members
            SET
                membership_status = 'active',
                joined_at = COALESCE(joined_at, NOW())
            WHERE organisation_id = :organisation_id
            AND membership_status = 'pending'
        ");

        $stmt->execute([
            ":organisation_id" => $id
        ]);

        $stmt = $conn->prepare("
            SELECT
                rd.id
            FROM registration_documents rd
            INNER JOIN registration_requests rr
                ON rr.id = rd.registration_request_id
            INNER JOIN users u
                ON u.id = rr.completed_user_id
            WHERE u.organisation_id = :organisation_id
        ");

        $stmt->execute([
            ":organisation_id" => $id
        ]);

        $documents = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $approvedDocuments = 0;

        foreach ($documents as $documentId) {
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
                        status = 'approved',
                        rejection_reason = NULL,
                        reviewed_by = :reviewed_by,
                        reviewed_at = NOW()
                    WHERE registration_document_id = :document_id
                ");

                $stmt->execute([
                    ":organisation_id" => $id,
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
                        'approved',
                        NULL,
                        :reviewed_by,
                        NOW()
                    )
                ");

                $stmt->execute([
                    ":document_id" => $documentId,
                    ":organisation_id" => $id,
                    ":reviewed_by" => $my_details->id
                ]);
            }

            $approvedDocuments++;
        }

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Organisation approved successfully",
            "code" => [
                "id" => $id,
                "status" => "verified",
                "documents" => [
                    "status" => "approved",
                    "count" => $approvedDocuments
                ]
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