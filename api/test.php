<?php
require_once __DIR__ . '/include/conn.php';

try {
    $conn->beginTransaction();

    $q = $conn->prepare("INSERT INTO financial_configuration (id, config_key, base_currency, fx_enabled, fx_currency, fx_source, fx_rate, fx_effective_at, vat_rate, discount_threshold, waiver_threshold, credit_note_threshold, dual_approval_required, clearance_gate_enforced, allow_approved_credit, allow_waiver, auto_block_on_exposure, default_credit_terms_days, dunning_interval_days) VALUES (:id, :config_key, :base_currency, :fx_enabled, :fx_currency, :fx_source, :fx_rate, :fx_effective_at, :vat_rate, :discount_threshold, :waiver_threshold, :credit_note_threshold, :dual_approval_required, :clearance_gate_enforced, :allow_approved_credit, :allow_waiver, :auto_block_on_exposure, :default_credit_terms_days, :dunning_interval_days) ON DUPLICATE KEY UPDATE base_currency = VALUES(base_currency), fx_enabled = VALUES(fx_enabled), fx_currency = VALUES(fx_currency), fx_source = VALUES(fx_source), fx_rate = VALUES(fx_rate), fx_effective_at = VALUES(fx_effective_at), vat_rate = VALUES(vat_rate), discount_threshold = VALUES(discount_threshold), waiver_threshold = VALUES(waiver_threshold), credit_note_threshold = VALUES(credit_note_threshold), dual_approval_required = VALUES(dual_approval_required), clearance_gate_enforced = VALUES(clearance_gate_enforced), allow_approved_credit = VALUES(allow_approved_credit), allow_waiver = VALUES(allow_waiver), auto_block_on_exposure = VALUES(auto_block_on_exposure), default_credit_terms_days = VALUES(default_credit_terms_days), dunning_interval_days = VALUES(dunning_interval_days)");

    $q->bindValue(":id", generateId(), PDO::PARAM_STR);
    $q->bindValue(":config_key", "default", PDO::PARAM_STR);
    $q->bindValue(":base_currency", "NGN", PDO::PARAM_STR);
    $q->bindValue(":fx_enabled", 0, PDO::PARAM_INT);
    $q->bindValue(":fx_currency", "USD", PDO::PARAM_STR);
    $q->bindValue(":fx_source", "", PDO::PARAM_STR);
    $q->bindValue(":fx_rate", 0, PDO::PARAM_STR);
    $q->bindValue(":fx_effective_at", null, PDO::PARAM_NULL);
    $q->bindValue(":vat_rate", 7.5, PDO::PARAM_STR);
    $q->bindValue(":discount_threshold", 500000, PDO::PARAM_STR);
    $q->bindValue(":waiver_threshold", 250000, PDO::PARAM_STR);
    $q->bindValue(":credit_note_threshold", 100000, PDO::PARAM_STR);
    $q->bindValue(":dual_approval_required", 1, PDO::PARAM_INT);
    $q->bindValue(":clearance_gate_enforced", 1, PDO::PARAM_INT);
    $q->bindValue(":allow_approved_credit", 1, PDO::PARAM_INT);
    $q->bindValue(":allow_waiver", 0, PDO::PARAM_INT);
    $q->bindValue(":auto_block_on_exposure", 1, PDO::PARAM_INT);
    $q->bindValue(":default_credit_terms_days", 30, PDO::PARAM_INT);
    $q->bindValue(":dunning_interval_days", 7, PDO::PARAM_INT);
    $q->execute();

    $q = $conn->prepare("SELECT id FROM financial_configuration WHERE config_key = :config_key LIMIT 1");
    $q->bindValue(":config_key", "default", PDO::PARAM_STR);
    $q->execute();
    $configurationId = $q->fetchColumn();

    if (!$configurationId) {
        throw new RuntimeException("Unable to retrieve the financial configuration ID.");
    }

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Financial configuration saved successfully",
        "code" => [
            "configuration_id" => $configurationId,
            "base_currency" => "NGN",
            "fx_enabled" => false,
            "fx_currency" => "USD",
            "fx_source" => "",
            "fx_rate" => 0,
            "fx_effective_at" => null,
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
} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Unable to save financial configuration",
        "code" => null
    ]);
}