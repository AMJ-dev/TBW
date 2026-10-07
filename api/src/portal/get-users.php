<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $organisationId = trim((string)($my_details->organisation_id ?? ""));

        if ($organisationId === "") {
            http_response_code(403);
            echo json_encode([
                "error" => true,
                "data" => "Organisation not found",
                "code" => null
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT
                u.id,
                om.id AS membership_id,
                u.organisation_id,
                u.account_type,
                u.full_name,
                u.email,
                u.phone,
                u.pics,
                u.email_verified_at,
                u.phone_verified_at,
                u.mfa_enabled,
                u.last_login_at,
                u.account_status,
                u.created_at,
                u.updated_at,
                om.role_id,
                om.job_title,
                om.membership_status,
                om.invited_by,
                om.joined_at,
                om.created_at AS membership_created_at,
                r.role_key,
                r.role_name,
                r.scope,
                r.description AS role_description
            FROM organisation_members om
            INNER JOIN users u
                ON u.id = om.user_id
            INNER JOIN roles r
                ON r.id = om.role_id
            WHERE om.organisation_id = :organisation_id
            ORDER BY om.created_at DESC
        ");

        $stmt->execute([
            ":organisation_id" => $organisationId
        ]);

        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $active = 0;
        $invited = 0;
        $mfaEnabled = 0;

        foreach ($users as &$user) {
            if ($user["membership_status"] === "active") {
                $active++;
            }

            if ($user["membership_status"] === "pending") {
                $invited++;
            }

            if (
                (int)$user["mfa_enabled"] === 1 &&
                $user["membership_status"] === "active"
            ) {
                $mfaEnabled++;
            }

            $user["role"] = $user["role_name"];
            $user["role_in_org"] = $user["role_name"];
            $user["two_factor_enabled"] = (bool)$user["mfa_enabled"];
        }

        unset($user);

        echo json_encode([
            "error" => false,
            "data" => "Users loaded successfully",
            "code" => [
                "results" => $users,
                "users" => $users,
                "metrics" => [
                    "total" => count($users),
                    "active" => $active,
                    "invited" => $invited,
                    "mfa_enabled" => $mfaEnabled
                ]
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