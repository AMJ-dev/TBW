<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $status = strtolower(trim($_GET["status"] ?? ""));

        $sql = "
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
        ";

        if ($status === "active") $sql .= " WHERE status = :status";

        $sql .= " ORDER BY created_at DESC";

        $stmt = $conn->prepare($sql);

        if ($status === "active") $stmt->bindValue(":status", "ACTIVE", PDO::PARAM_STR);

        $stmt->execute();

        $tiers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($tiers as &$tier) {
            $tier["minimum_limit"] = (float) $tier["minimum_limit"];
            $tier["maximum_limit"] = (float) $tier["maximum_limit"];
            $tier["payment_duration"] = (int) $tier["payment_duration"];
            $tier["interest_rate"] = (float) $tier["interest_rate"];
            $tier["grace_period"] = (int) $tier["grace_period"];
            $tier["eligibility_duration"] = (int) $tier["eligibility_duration"];
            $tier["minimum_transaction_volume"] = (float) $tier["minimum_transaction_volume"];
        }

        unset($tier);

        echo json_encode([
            "error" => false,
            "data" => "Credit tiers loaded successfully.",
            "code" => $tiers
        ]);

    } catch (PDOException $e) {
        echo json_encode([
            "error" => true,
            "data" => "Could not load credit tiers.",
            "code" => null
        ]);
    } catch (Throwable $e) {
        echo json_encode([
            "error" => true,
            "data" => "An unexpected error occurred.",
            "code" => null
        ]);
    }