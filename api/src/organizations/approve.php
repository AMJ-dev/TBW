<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $id = $_GET['id'] ?? '';

    if (empty($id)) {
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
            SELECT id, verification_status
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

        if (!in_array($organisation["verification_status"], ["pending", "under_review"], true)) {
            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "Organisation cannot be approved from its current status",
                "code" => null
            ]);

            exit;
        }

        $conn->beginTransaction();

        $update = $conn->prepare("
            UPDATE organisations
            SET
                verification_status = 'verified',
                verified_by = :verified_by,
                verified_at = NOW(),
                rejection_reason = NULL
            WHERE id = :id
        ");

        $update->execute([
            ":verified_by" => $my_details->id,
            ":id" => $id
        ]);

        $userUpdate = $conn->prepare("
            UPDATE users
            SET account_status = 'active'
            WHERE organisation_id = :organisation_id
            AND account_status = 'pending_approval'
        ");

        $userUpdate->execute([
            ":organisation_id" => $id
        ]);

        $memberUpdate = $conn->prepare("
            UPDATE organisation_members
            SET
                membership_status = 'active',
                joined_at = COALESCE(joined_at, NOW())
            WHERE organisation_id = :organisation_id
            AND membership_status = 'pending'
        ");

        $memberUpdate->execute([
            ":organisation_id" => $id
        ]);

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Organisation approved successfully",
            "code" => [
                "id" => $id,
                "status" => "verified"
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