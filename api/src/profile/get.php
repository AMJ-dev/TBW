<?php
    require_once dirname(__DIR__, 2)."/include/verify-user.php";

    if ($my_details->account_type === "system") {

        if (empty($my_details->system_role_id)) {
            echo json_encode([
                "error" => true,
                "data" => "Your system account does not have an assigned role.",
                "code" => []
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT
                id,
                role_key,
                role_name,
                scope
            FROM roles
            WHERE id = :role_id
            AND is_active = 1
            AND scope = 'system'
            LIMIT 1
        ");

        $stmt->execute([":role_id" => $my_details->system_role_id]);

        $role = $stmt->fetch(PDO::FETCH_ASSOC);

    } else {

        $stmt = $conn->prepare("
            SELECT
                r.id,
                r.role_key,
                r.role_name,
                r.scope
            FROM organisation_members om
            INNER JOIN roles r ON r.id = om.role_id
            WHERE om.user_id = :user_id
            AND om.membership_status = 'active'
            AND r.is_active = 1
            AND r.scope = 'organisation'
            ORDER BY
                CASE r.role_key
                    WHEN 'organisation_owner' THEN 1
                    WHEN 'management' THEN 2
                    WHEN 'finance' THEN 3
                    WHEN 'terminal_operations' THEN 4
                    WHEN 'gate_officer' THEN 5
                    WHEN 'warehouse_yard_officer' THEN 6
                    WHEN 'documentation_officer' THEN 7
                    WHEN 'customer_service_sales' THEN 8
                    WHEN 'compliance_customs_liaison' THEN 9
                    WHEN 'regulator_auditor' THEN 10
                    ELSE 99
                END
            LIMIT 1
        ");

        $stmt->execute([
            ":user_id" => $user_id
        ]);

        $role = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    if (!$role) {
        $conn->rollBack();
        echo json_encode([
            "error" => true,
            "data" => "Your account does not have an active role.",
            "code" => []
        ]);
        http_response_code(401);
        exit;
    }

    $role_id = $role["id"];
    $role_key = $role["role_key"];
    $role_name = $role["role_name"];
    $role_scope = $role["scope"];

    $stmt = $conn->prepare("
        SELECT
            p.permission_key,
            p.module,
            p.action
        FROM role_permissions rp
        INNER JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.role_id = :role_id
        ORDER BY p.module, p.action
    ");

    $stmt->execute([":role_id" => $role_id]);

    $permission_rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $permissions = [];
    $privileges = [];

    foreach ($permission_rows as $permission) {
        $permissions[] = $permission["permission_key"];
        if (!in_array($permission["module"], $privileges, true)) $privileges[] = $permission["module"];
    }

    $route = $route_map[$role_key] ?? "/portal";


    echo json_encode([
        "error" => false,
        "data" => [
            "email" => $my_details->email,
            "expires_in" => 2592000,
            "user" => [
                "id" => $my_details->id,
                "email" => $my_details->email,
                "full_name" => $my_details->full_name,
                "phone" => $my_details->phone,
                "pics" => $my_details->pics,
                "account_type" => $my_details->account_type
            ],
            "role" => [
                "id" => $role_id,
                "key" => $role_key,
                "name" => $role_name,
                "scope" => $role_scope
            ],
            "route" => $route,
            "privileges" => $privileges,
            "permissions" => $permissions
        ],
    ]);