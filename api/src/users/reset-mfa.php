<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $id = trim($_GET["id"] ?? "");

    if ($id === "") {
        echo json_encode([
            "error" => true,
            "data" => "Invalid user ID",
            "code" => null
        ]);
        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
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
                full_name,
                email,
                mfa_enabled
            FROM users
            WHERE id = :id
            LIMIT 1
        ");

        $stmt->execute([
            ":id" => $id
        ]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            echo json_encode([
                "error" => true,
                "data" => "User not found",
                "code" => null
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            UPDATE users
            SET
                mfa_enabled = 0,
                mfa_secret = NULL
            WHERE id = :id
        ");

        $stmt->execute([
            ":id" => $id
        ]);

        echo json_encode([
            "error" => false,
            "data" => "MFA reset successfully",
            "code" => [
                "id" => $id,
                "mfa_enabled" => false
            ]
        ]);

    } catch (Throwable $e) {
        echo json_encode([
            "error" => true,
            "data" => $e->getMessage(),
            "code" => null
        ]);
    }