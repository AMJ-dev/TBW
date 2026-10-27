<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $q = $conn->prepare("
            SELECT
                id,
                hs_code,
                description,
                category,
                rate_type,
                rate,
                unit,
                effective_from,
                effective_to,
                status,
                source,
                DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
            FROM customs_tariffs
            ORDER BY hs_code ASC, effective_from DESC
        ");
        $q->execute();

        $tariffs = $q->fetchAll(PDO::FETCH_ASSOC);

        foreach ($tariffs as &$tariff) {
            $tariff["rate"] = (float) $tariff["rate"];
        }
        unset($tariff);

        echo json_encode([
            "error" => false,
            "data" => "Customs tariffs loaded successfully.",
            "code" => [
                "tariffs" => $tariffs
            ]
        ]);
    } catch (Throwable $e) {
        error_log("Customs tariffs load error: " . $e->getMessage());
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not load customs tariffs.",
            "code" => null
        ]);
    }