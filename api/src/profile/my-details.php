<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {

        $user_id = $my_details->id;

        $stmt = $conn->prepare("
            SELECT
                u.id,
                u.email,
                u.full_name,
                u.phone,
                u.pics,
                u.account_type,
                u.mfa_enabled,
                u.last_login_at,
                u.created_at,
                u.organisation_id,
                u.system_role_id,
                o.organisation_name,
                o.organisation_type,
                om.job_title,
                r.id AS role_id,
                r.role_key,
                r.role_name,
                r.scope AS role_scope
            FROM users u
            LEFT JOIN organisations o
                ON o.id = u.organisation_id
            LEFT JOIN organisation_members om
                ON om.user_id = u.id
                AND om.membership_status = 'active'
            LEFT JOIN roles r
                ON r.id = COALESCE(
                    om.role_id,
                    u.system_role_id
                )
                AND r.is_active = 1
            WHERE u.id = :user_id
            LIMIT 1
        ");

        $stmt->execute([
            ":user_id" => $user_id
        ]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            echo json_encode([
                "error" => true,
                "data" => "User account could not be found.",
                "code" => []
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT
                ip_address
            FROM sessions
            WHERE user_id = :user_id
            AND revoked_at IS NULL
            AND mfa_verified = 1
            ORDER BY last_active_at DESC
            LIMIT 1
        ");

        $stmt->execute([
            ":user_id" => $user_id
        ]);

        $last_session = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => "Profile loaded successfully.",
            "code" => [
                "id" => $user["id"],
                "email" => $user["email"],
                "full_name" => $user["full_name"],
                "phone" => $user["phone"],
                "pics" => $user["pics"],
                "account_type" => $user["account_type"],
                "role_in_org" => $user["job_title"] ?? null,
                "organisation_name" => $user["organisation_name"] ?? null,
                "organisation_type" => $user["organisation_type"] ?? null,
                "mfa_enabled" => (int)$user["mfa_enabled"] === 1,
                "last_login_at" => $user["last_login_at"],
                "last_login_ip" => $last_session["ip_address"] ?? null,
                "created_at" => $user["created_at"],
                "role" => $user["role_id"]
                    ? [
                        "id" => $user["role_id"],
                        "key" => $user["role_key"],
                        "name" => $user["role_name"],
                        "scope" => $user["role_scope"]
                    ]
                    : null
            ]
        ]);

        exit;

    } catch (Throwable $e) {

        error_log(
            "My profile error: " .
            $e->getMessage()
        );

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "An error occurred while loading your profile.",
            "code" => []
        ]);

        exit;
    }