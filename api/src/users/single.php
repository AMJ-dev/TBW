<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";
    $id = trim($_GET["id"] ?? "");

    if ($id === "") {
        http_response_code(400);

        echo json_encode([
            "error" => true,
            "data" => "Invalid user ID",
            "code" => null
        ]);

        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] !== "GET") {
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
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.pics,
                u.account_type,
                u.account_status,
                u.email_verified_at,
                u.phone_verified_at,
                u.mfa_enabled,
                u.last_login_at,
                u.password_changed_at,
                u.created_at,
                u.updated_at,

                o.id AS organisation_id,
                o.organisation_name,
                o.organisation_type,
                o.rc_number,
                o.tin,
                o.verification_status AS organisation_status,
                o.rejection_reason AS organisation_rejection_reason,
                o.verified_at AS organisation_verified_at,

                r.id AS role_id,
                r.role_key,
                r.role_name,
                r.scope AS role_scope

            FROM users u

            LEFT JOIN organisations o
                ON o.id = u.organisation_id

            LEFT JOIN organisation_members om
                ON om.user_id = u.id
                AND om.membership_status != 'revoked'

            LEFT JOIN roles r
                ON r.id = om.role_id
                AND r.is_active = 1

            WHERE u.id = :id

            LIMIT 1
        ");

        $stmt->execute([
            ":id" => $id
        ]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            http_response_code(404);

            echo json_encode([
                "error" => true,
                "data" => "User not found",
                "code" => null
            ]);

            exit;
        }

        $organisation = null;

        if (!empty($row["organisation_id"])) {
            $organisation = [
                "id" => $row["organisation_id"],
                "name" => $row["organisation_name"],
                "type" => $row["organisation_type"],
                "rc_number" => $row["rc_number"],
                "tin" => $row["tin"],
                "status" => $row["organisation_status"],
                "rejection_reason" => $row["organisation_rejection_reason"],
                "verified_at" => $row["organisation_verified_at"]
            ];
        }

        $delegations = [];

        $delegationTableExists = false;

        try {
            $check = $conn->query("
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
                AND table_name = 'user_delegations'
                LIMIT 1
            ");

            $delegationTableExists = (bool) $check->fetchColumn();
        } catch (Throwable $e) {
            $delegationTableExists = false;
        }

        if ($delegationTableExists) {

            $delegationStmt = $conn->prepare("
                SELECT
                    d.id,
                    u.full_name AS grantee_name,
                    u.email AS grantee_email,
                    d.scope,
                    d.status,
                    d.expires_at
                FROM user_delegations d
                INNER JOIN users u
                    ON u.id = d.grantee_user_id
                WHERE d.grantor_user_id = :user_id
                OR d.grantee_user_id = :user_id_2
                ORDER BY d.created_at DESC
            ");

            $delegationStmt->execute([
                ":user_id" => $id,
                ":user_id_2" => $id
            ]);

            $delegations = $delegationStmt->fetchAll(PDO::FETCH_ASSOC);
        }

        $user = [
            "id" => $row["id"],
            "full_name" => $row["full_name"],
            "email" => $row["email"],
            "phone" => $row["phone"],
            "pics" => $row["pics"],
            "account_type" => $row["account_type"],
            "account_status" => $row["account_status"],
            "email_verified_at" => $row["email_verified_at"],
            "phone_verified_at" => $row["phone_verified_at"],
            "mfa_enabled" => (bool) $row["mfa_enabled"],
            "two_factor_enabled" => (bool) $row["mfa_enabled"],
            "last_login_at" => $row["last_login_at"],
            "last_password_change_at" => $row["password_changed_at"],
            "created_at" => $row["created_at"],
            "updated_at" => $row["updated_at"],
            "role" => [
                "id" => $row["role_id"],
                "key" => $row["role_key"],
                "name" => $row["role_name"],
                "scope" => $row["role_scope"]
            ],
            "role_in_org" => $row["role_name"],
            "organization" => $organisation,
            "org_id" => $row["organisation_id"],
            "org_name" => $row["organisation_name"],
            "delegations" => $delegations
        ];

        echo json_encode([
            "error" => false,
            "data" => "User details retrieved successfully",
            "code" => [
                "user" => $user,
                "organisation" => $organisation,
                "organization" => $organisation,
                "delegations" => $delegations
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