<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

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
                u.mfa_enabled,
                u.email_verified_at,
                u.phone_verified_at,
                u.last_login_at,
                u.created_at,
                u.updated_at,
                o.id AS organisation_id,
                o.organisation_name,
                o.organisation_type,
                o.verification_status AS organisation_status,
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
            ORDER BY u.created_at DESC
        ");

        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $users = [];

        foreach ($rows as $row) {

            $users[] = [
                "id" => $row["id"],
                "full_name" => $row["full_name"],
                "email" => $row["email"],
                "phone" => $row["phone"],
                "pics" => $row["pics"],
                "account_type" => $row["account_type"],
                "account_status" => $row["account_status"],
                "mfa_enabled" => (bool) $row["mfa_enabled"],
                "two_factor_enabled" => (bool) $row["mfa_enabled"],
                "email_verified_at" => $row["email_verified_at"],
                "phone_verified_at" => $row["phone_verified_at"],
                "last_login_at" => $row["last_login_at"],
                "created_at" => $row["created_at"],
                "updated_at" => $row["updated_at"],
                "role" => [
                    "id" => $row["role_id"],
                    "key" => $row["role_key"],
                    "name" => $row["role_name"],
                    "scope" => $row["role_scope"]
                ],
                "role_in_org" => $row["role_name"],
                "organization" => [
                    "id" => $row["organisation_id"],
                    "name" => $row["organisation_name"],
                    "type" => $row["organisation_type"],
                    "status" => $row["organisation_status"]
                ],
                "org_name" => $row["organisation_name"]
            ];
        }

        $total = count($users);

        $active = 0;
        $pending = 0;
        $twoFactor = 0;

        foreach ($users as $user) {

            if ($user["account_status"] === "active") {
                $active++;
            }

            if (
                $user["account_status"] === "pending" ||
                $user["account_status"] === "pending_approval"
            ) {
                $pending++;
            }

            if ($user["mfa_enabled"]) {
                $twoFactor++;
            }
        }

        $twoFactorPercentage = $total > 0
            ? round(($twoFactor / $total) * 100)
            : null;

        echo json_encode([
            "error" => false,
            "data" => "Users retrieved successfully",
            "code" => [
                "users" => $users,
                "metrics" => [
                    "total" => $total,
                    "active" => $active,
                    "pending" => $pending,
                    "two_factor_pct" => $twoFactorPercentage
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