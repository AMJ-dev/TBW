<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $id = trim($_GET["id"] ?? "");

        if ($id === "") {
            echo json_encode([
                "error" => true,
                "data" => "Credit tier ID is required.",
                "code" => null
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT
                id,
                name,
                code,
                description,
                minimum_limit,
                maximum_limit,
                payment_duration,
                payment_unit,
                interest_rate,
                grace_period,
                eligibility_duration,
                eligibility_unit,
                minimum_transaction_volume,
                status,
                internal_notes,
                created_at,
                updated_at
            FROM finance_credit_tiers
            WHERE id = :id
            LIMIT 1
        ");

        $stmt->execute(["id" => $id]);

        $tier = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$tier) {
            echo json_encode([
                "error" => true,
                "data" => "Credit tier not found.",
                "code" => null
            ]);
            exit;
        }

        echo json_encode([
            "error" => false,
            "data" => "Credit tier loaded successfully.",
            "code" => $tier
        ]);

    } catch (PDOException $e) {
        echo json_encode([
            "error" => true,
            "data" => "Could not load credit tier.",
            "code" => null
        ]);
    } catch (Throwable $e) {
        echo json_encode([
            "error" => true,
            "data" => "An unexpected error occurred.",
            "code" => null
        ]);
    }