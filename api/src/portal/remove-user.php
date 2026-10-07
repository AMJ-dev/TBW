<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $userId = trim($_POST["user_id"] ?? "");
    $membershipId = trim($_POST["membership_id"] ?? "");
    $organisationId = trim((string)($my_details->organisation_id ?? ""));
    $currentUserId = trim((string)($my_details->id ?? ""));

    if ($userId === "" || $membershipId === "") {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "User ID and membership ID are required",
            "code" => null
        ]);
        exit;
    }

    if ($organisationId === "" || $currentUserId === "") {
        http_response_code(403);
        echo json_encode([
            "error" => true,
            "data" => "Organisation information is not available",
            "code" => null
        ]);
        exit;
    }

    if ($userId === $currentUserId) {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "You cannot remove yourself",
            "code" => null
        ]);
        exit;
    }

    try {
        $conn->beginTransaction();

        $stmt = $conn->prepare("
            SELECT
                om.id,
                om.user_id,
                om.membership_status,
                u.full_name,
                u.email
            FROM organisation_members om
            INNER JOIN users u
                ON u.id = om.user_id
            WHERE om.id = :membership_id
            AND om.user_id = :user_id
            AND om.organisation_id = :organisation_id
            LIMIT 1
        ");

        $stmt->execute([
            ":membership_id" => $membershipId,
            ":user_id" => $userId,
            ":organisation_id" => $organisationId
        ]);

        $member = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$member) {
            $conn->rollBack();

            http_response_code(404);
            echo json_encode([
                "error" => true,
                "data" => "Organisation membership not found",
                "code" => null
            ]);
            exit;
        }

        if ($member["membership_status"] === "revoked") {
            $conn->rollBack();

            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "This user has already been removed",
                "code" => null
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            UPDATE organisation_members
            SET
                membership_status = 'revoked',
                joined_at = NULL
            WHERE id = :membership_id
            AND user_id = :user_id
            AND organisation_id = :organisation_id
        ");

        $stmt->execute([
            ":membership_id" => $membershipId,
            ":user_id" => $userId,
            ":organisation_id" => $organisationId
        ]);

        $stmt = $conn->prepare("
            UPDATE user_invitations
            SET revoked_at = NOW()
            WHERE user_id = :user_id
            AND accepted_at IS NULL
            AND revoked_at IS NULL
        ");

        $stmt->execute([
            ":user_id" => $userId
        ]);

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "User removed successfully",
            "code" => [
                "user_id" => $userId,
                "membership_id" => $membershipId
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