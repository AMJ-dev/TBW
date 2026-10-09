<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $q = $conn->prepare("SELECT id, base_currency, vat_rate, discount_threshold, waiver_threshold, credit_note_threshold, dual_approval_required, clearance_gate_enforced, allow_approved_credit, allow_waiver, auto_block_on_exposure, default_credit_terms_days, dunning_interval_days FROM financial_configuration WHERE config_key = :config_key LIMIT 1");
        $q->bindValue(":config_key", "default", PDO::PARAM_STR);
        $q->execute();
        $config = $q->fetch(PDO::FETCH_ASSOC);

        if (!$config) {
            echo json_encode([
                "error" => false,
                "data" => "Financial configuration loaded successfully",
                "code" => [
                    "base_currency" => "NGN",
                    "vat_rate" => 7.5,
                    "discount_threshold" => 500000,
                    "waiver_threshold" => 250000,
                    "credit_note_threshold" => 100000,
                    "dual_approval_required" => true,
                    "clearance_gate_enforced" => true,
                    "allow_approved_credit" => true,
                    "allow_waiver" => false,
                    "auto_block_on_exposure" => true,
                    "default_credit_terms_days" => 30,
                    "dunning_interval_days" => 7
                ]
            ]);
            exit;
        }

        echo json_encode([
            "error" => false,
            "data" => "Financial configuration loaded successfully",
            "code" => [
                "id" => $config["id"],
                "base_currency" => $config["base_currency"],
                "vat_rate" => (float) $config["vat_rate"],
                "discount_threshold" => (float) $config["discount_threshold"],
                "waiver_threshold" => (float) $config["waiver_threshold"],
                "credit_note_threshold" => (float) $config["credit_note_threshold"],
                "dual_approval_required" => (bool) $config["dual_approval_required"],
                "clearance_gate_enforced" => (bool) $config["clearance_gate_enforced"],
                "allow_approved_credit" => (bool) $config["allow_approved_credit"],
                "allow_waiver" => (bool) $config["allow_waiver"],
                "auto_block_on_exposure" => (bool) $config["auto_block_on_exposure"],
                "default_credit_terms_days" => (int) $config["default_credit_terms_days"],
                "dunning_interval_days" => (int) $config["dunning_interval_days"]
            ]
        ]);
    } catch (Throwable $e) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Unable to load financial configuration",
            "code" => null
        ]);
    }