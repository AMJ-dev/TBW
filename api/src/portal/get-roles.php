<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $stmt = $conn->prepare("
            SELECT
                id,
                role_key,
                role_key AS `key`,
                role_name,
                role_name AS name,
                scope,
                description,
                is_active
            FROM roles
            WHERE scope = 'organisation'
            AND (
                is_active = 1
                OR is_active = '1'
                OR is_active = 'active'
            )
            ORDER BY role_name ASC
        ");

        $stmt->execute();

        $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => "Roles loaded successfully",
            "code" => [
                "results" => $roles
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