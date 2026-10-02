<?php
    require_once dirname(__DIR__, 2) . "/include/set-header.php";

    $token = trim($_GET["token"] ?? "");

    if ($token === "") {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Invitation token is required",
            "code" => null
        ]);
        exit;
    }

    try {
        $tokenHash = hash("sha256", $token);

        $stmt = $conn->prepare("
            SELECT
                ui.id,
                ui.user_id,
                ui.expires_at,
                ui.accepted_at,
                ui.revoked_at,
                u.email,
                u.full_name,
                u.phone,
                u.account_type,
                o.organisation_name,
                r.role_name
            FROM user_invitations ui
            INNER JOIN users u
                ON u.id = ui.user_id
            LEFT JOIN organisations o
                ON o.id = u.organisation_id
            LEFT JOIN organisation_members om
                ON om.user_id = u.id
                AND om.membership_status != 'revoked'
            LEFT JOIN roles r
                ON r.id = CASE
                    WHEN u.account_type = 'system'
                    THEN u.system_role_id
                    ELSE om.role_id
                END
            WHERE ui.token_hash = :token_hash
            ORDER BY ui.created_at DESC
            LIMIT 1
        ");

        $stmt->execute([
            ":token_hash" => $tokenHash
        ]);

        $invite = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$invite) {
            http_response_code(404);

            echo json_encode([
                "error" => true,
                "data" => "Invalid invitation",
                "code" => [
                    "state" => "invalid"
                ]
            ]);
            exit;
        }

        if ($invite["accepted_at"] !== null) {
            echo json_encode([
                "error" => false,
                "data" => "Invitation has already been used",
                "code" => [
                    "email" => $invite["email"],
                    "full_name" => $invite["full_name"],
                    "phone" => $invite["phone"],
                    "account_type" => $invite["account_type"],
                    "organisation_name" => $invite["organisation_name"],
                    "role_name" => $invite["role_name"],
                    "expires_at" => $invite["expires_at"],
                    "state" => "used"
                ]
            ]);
            exit;
        }

        if ($invite["revoked_at"] !== null) {
            echo json_encode([
                "error" => false,
                "data" => "Invitation has been revoked",
                "code" => [
                    "email" => $invite["email"],
                    "full_name" => $invite["full_name"],
                    "phone" => $invite["phone"],
                    "account_type" => $invite["account_type"],
                    "organisation_name" => $invite["organisation_name"],
                    "role_name" => $invite["role_name"],
                    "expires_at" => $invite["expires_at"],
                    "state" => "invalid"
                ]
            ]);
            exit;
        }

        if (strtotime($invite["expires_at"]) < time()) {
            echo json_encode([
                "error" => false,
                "data" => "Invitation has expired",
                "code" => [
                    "email" => $invite["email"],
                    "full_name" => $invite["full_name"],
                    "phone" => $invite["phone"],
                    "account_type" => $invite["account_type"],
                    "organisation_name" => $invite["organisation_name"],
                    "role_name" => $invite["role_name"],
                    "expires_at" => $invite["expires_at"],
                    "state" => "expired"
                ]
            ]);
            exit;
        }

        echo json_encode([
            "error" => false,
            "data" => "Invitation is valid",
            "code" => [
                "email" => $invite["email"],
                "full_name" => $invite["full_name"],
                "phone" => $invite["phone"],
                "account_type" => $invite["account_type"],
                "organisation_name" => $invite["organisation_name"],
                "role_name" => $invite["role_name"],
                "expires_at" => $invite["expires_at"],
                "state" => "valid"
            ]
        ]);
    } catch (Throwable $e) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => $e->getMessage(),
            "code" => null
        ]);
    }