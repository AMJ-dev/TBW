<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $q = $conn->prepare("
            SELECT
                id,
                base_rate,
                free_days,
                charging_unit,
                minimum_charge,
                currency_code,
                effective_from,
                overstay_threshold_days,
                overstay_escalation_days,
                pause_on_hold,
                pause_on_examination,
                pause_on_customs_hold,
                change_reason,
                created_by,
                created_at
            FROM storage_config_versions
            ORDER BY effective_from DESC, id DESC
            LIMIT 1
        ");

        $q->execute();
        $config = $q->fetch(PDO::FETCH_ASSOC);

        if (!$config) {
            echo json_encode([
                "error" => false,
                "data" => "No storage configuration has been saved yet.",
                "code" => [
                    "id" => null,
                    "base_rate" => 0,
                    "free_days" => 5,
                    "charging_unit" => "day",
                    "minimum_charge" => 0,
                    "currency_code" => "NGN",
                    "effective_from" => "",
                    "overstay_threshold_days" => 30,
                    "overstay_escalation_days" => 45,
                    "pause_on_hold" => false,
                    "pause_on_examination" => false,
                    "pause_on_customs_hold" => false,
                    "escalation_tiers" => []
                ]
            ]);
            exit;
        }

        $tierQuery = $conn->prepare("
            SELECT
                id,
                from_day,
                rate_multiplier
            FROM storage_escalation_tiers
            WHERE config_id = :config_id
            ORDER BY from_day ASC
        ");

        $tierQuery->bindValue(":config_id", (int)$config["id"], PDO::PARAM_INT);
        $tierQuery->execute();

        $tiers = $tierQuery->fetchAll(PDO::FETCH_ASSOC);

        $code = [
            "id" => (int)$config["id"],
            "base_rate" => (float)$config["base_rate"],
            "free_days" => (int)$config["free_days"],
            "charging_unit" => $config["charging_unit"],
            "minimum_charge" => (float)$config["minimum_charge"],
            "currency_code" => $config["currency_code"],
            "effective_from" => $config["effective_from"],
            "overstay_threshold_days" => (int)$config["overstay_threshold_days"],
            "overstay_escalation_days" => (int)$config["overstay_escalation_days"],
            "pause_on_hold" => (bool)$config["pause_on_hold"],
            "pause_on_examination" => (bool)$config["pause_on_examination"],
            "pause_on_customs_hold" => (bool)$config["pause_on_customs_hold"],
            "change_reason" => $config["change_reason"],
            "created_by" => $config["created_by"],
            "created_at" => $config["created_at"],
            "escalation_tiers" => array_map(
                static function (array $tier): array {
                    return [
                        "id" => (string)$tier["id"],
                        "from_day" => (int)$tier["from_day"],
                        "rate_multiplier" => (float)$tier["rate_multiplier"]
                    ];
                },
                $tiers
            )
        ];

        echo json_encode([
            "error" => false,
            "data" => "Storage configuration loaded successfully.",
            "code" => $code
        ]);
    } catch (Throwable $e) {
        error_log("Storage configuration GET failed: " . $e->getMessage());

        http_response_code(500);
        echo json_encode([
            "error" => true,
            "data" => "Could not load storage configuration.",
            "code" => null
        ]);
    }