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
                u.full_name,
                u.email,
                u.phone,
                u.account_status,
                u.last_login_at,
                u.mfa_enabled,
                u.two_factor_enabled,
                u.pics,
                u.created_at,
                u.updated_at,
                om.membership_status,
                om.created_at AS membership_created_at,
                om.joined_at,
                r.id AS role_id,
                r.role_key,
                r.role_name,
                r.name AS role,
                r.description AS role_description
            FROM organisation_members om
            INNER JOIN users u ON u.id = om.user_id
            LEFT JOIN roles r ON r.id = om.role_id
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
            if (($user["membership_status"] ?? "") === "removed") {
                $user["account_status"] = "removed";
            }

            if (($user["account_status"] ?? "") === "active" && ($user["membership_status"] ?? "") !== "removed") {
                $active++;
            }

            if (
                in_array(
                    strtolower((string)($user["account_status"] ?? "")),
                    ["pending", "pending_approval", "invited"]
                ) &&
                ($user["membership_status"] ?? "") !== "removed"
            ) {
                $invited++;
            }

            if (
                !empty($user["mfa_enabled"]) ||
                !empty($user["two_factor_enabled"])
            ) {
                if (($user["account_status"] ?? "") === "active" && ($user["membership_status"] ?? "") !== "removed") {
                    $mfaEnabled++;
                }
            }
        }

        unset($user);

        echo json_encode([
            "error" => false,
            "data" => "Users loaded successfully",
            "code" => [
                "results" => $users,
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