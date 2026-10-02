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
                id,
                role_key,
                role_name,
                scope,
                description,
                is_active,
                created_at,
                updated_at
            FROM roles
            WHERE is_active = 1
            ORDER BY
                CASE scope
                    WHEN 'system' THEN 1
                    WHEN 'organisation' THEN 2
                    ELSE 3
                END,
                role_name ASC
        ");

        $stmt->execute();

        $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => "Roles retrieved successfully",
            "code" => [
                "roles" => $roles,
                "count" => count($roles)
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