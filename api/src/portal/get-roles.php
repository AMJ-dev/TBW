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
                id,
                role_key,
                role_name,
                scope,
                description,
                is_active,
                created_at,
                updated_at
            FROM roles
            WHERE scope = 'organisation'
            AND is_active = 1
            ORDER BY id ASC
        ");

        $stmt->execute();

        $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => "Roles loaded successfully",
            "code" => [
                "results" => $roles,
                "roles" => $roles
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