<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $id = trim($_POST["id"] ?? "");
        $status = strtoupper(trim($_POST["status"] ?? ""));

        if ($id === "" || $status === "") {
            echo json_encode([
                "error" => true,
                "data" => "Credit tier ID and status are required.",
                "code" => null
            ]);
            exit;
        }

        if (!in_array($status, ["ACTIVE", "INACTIVE"], true)) {
            echo json_encode([
                "error" => true,
                "data" => "Invalid status. Allowed values are ACTIVE or INACTIVE.",
                "code" => null
            ]);
            exit;
        }

        $check = $conn->prepare("
            SELECT id
            FROM finance_credit_tiers
            WHERE id = :id
            LIMIT 1
        ");
        $check->execute(["id" => $id]);

        if (!$check->fetch(PDO::FETCH_ASSOC)) {
            echo json_encode([
                "error" => true,
                "data" => "Credit tier not found.",
                "code" => null
            ]);
            exit;
        }

        $update = $conn->prepare("
            UPDATE finance_credit_tiers
            SET status = :status,
                updated_at = NOW()
            WHERE id = :id
        ");

        $update->execute([
            "status" => $status,
            "id" => $id
        ]);

        echo json_encode([
            "error" => false,
            "data" => "Credit tier status updated successfully.",
            "code" => [
                "id" => $id,
                "status" => $status
            ]
        ]);

    } catch (PDOException $e) {
        echo json_encode([
            "error" => true,
            "data" => "Could not update credit tier status.",
            "code" => null
        ]);
    }