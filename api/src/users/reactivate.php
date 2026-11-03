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
                account_status
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

        if (!in_array($user["account_status"], ["suspended", "inactive"], true)) {

            echo json_encode([
                "error" => true,
                "data" => "User account cannot be reactivated from its current status",
                "code" => [
                    "status" => $user["account_status"]
                ]
            ]);

            exit;
        }

        $stmt = $conn->prepare("
            UPDATE users
            SET
                account_status = 'active'
            WHERE id = :id
        ");

        $stmt->execute([
            ":id" => $id
        ]);

        echo json_encode([
            "error" => false,
            "data" => "User reactivated successfully",
            "code" => [
                "id" => $id,
                "status" => "active"
            ]
        ]);

    } catch (Throwable $e) {
        echo json_encode([
            "error" => true,
            "data" => $e->getMessage(),
            "code" => null
        ]);
    }