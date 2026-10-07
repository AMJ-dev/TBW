<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $userId = trim($_POST["user_id"] ?? "");
    $membershipId = trim($_POST["membership_id"] ?? "");
    $organisationId = trim((string)($my_details->organisation_id ?? ""));

    if ($userId === "" || $membershipId === "") {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "User ID and membership ID are required",
            "code" => null
        ]);
        exit;
    }

    if ($organisationId === "") {
        http_response_code(403);
        echo json_encode([
            "error" => true,
            "data" => "Organisation not found",
            "code" => null
        ]);
        exit;
    }

    try {
        $stmt = $conn->prepare("
            SELECT
                om.id,
                om.user_id,
                om.role_id,
                om.membership_status,
                r.role_key
            FROM organisation_members om
            LEFT JOIN roles r ON r.id = om.role_id
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

        $membership = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$membership) {
            http_response_code(404);
            echo json_encode([
                "error" => true,
                "data" => "Organisation membership not found",
                "code" => null
            ]);
            exit;
        }

        if ($membership["role_key"] === "organisation_owner") {
            http_response_code(403);
            echo json_encode([
                "error" => true,
                "data" => "The organisation owner cannot be removed",
                "code" => null
            ]);
            exit;
        }

        if ($membership["membership_status"] === "removed") {
            echo json_encode([
                "error" => false,
                "data" => "User has already been removed",
                "code" => null
            ]);
            exit;
        }

        $conn->beginTransaction();

        $stmt = $conn->prepare("
            UPDATE organisation_members
            SET
                membership_status = 'removed',
                updated_at = NOW()
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
            AND membership_id = :membership_id
            AND accepted_at IS NULL
            AND revoked_at IS NULL
        ");

        $stmt->execute([
            ":user_id" => $userId,
            ":membership_id" => $membershipId
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