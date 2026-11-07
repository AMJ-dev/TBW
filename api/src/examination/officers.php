<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $stmt = $conn->prepare("
            SELECT
                id,
                full_name,
                email,
                phone,
                account_type
            FROM users
            WHERE account_type = 'system'
            ORDER BY full_name ASC
        ");

        $stmt->execute();

        $officers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => $officers,
            "code" => 200
        ]);
    } catch (Throwable $e) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not load examination officers.",
            "code" => 500
        ]);
    }