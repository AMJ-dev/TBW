<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $baseCurrency = strtoupper(trim((string) ($_POST["base_currency"] ?? "")));
        $vatRate = $_POST["vat_rate"] ?? null;
        $discountThreshold = $_POST["discount_threshold"] ?? null;
        $waiverThreshold = $_POST["waiver_threshold"] ?? null;
        $creditNoteThreshold = $_POST["credit_note_threshold"] ?? null;
        $dualApprovalRequired = filter_var($_POST["dual_approval_required"] ?? null, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $clearanceGateEnforced = filter_var($_POST["clearance_gate_enforced"] ?? null, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $allowApprovedCredit = filter_var($_POST["allow_approved_credit"] ?? null, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $allowWaiver = filter_var($_POST["allow_waiver"] ?? null, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $autoBlockOnExposure = filter_var($_POST["auto_block_on_exposure"] ?? null, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $defaultCreditTermsDays = $_POST["default_credit_terms_days"] ?? null;
        $dunningIntervalDays = $_POST["dunning_interval_days"] ?? null;
        $changeReason = trim((string) ($_POST["change_reason"] ?? ""));

        if (!in_array($baseCurrency, ["NGN", "USD", "GBP", "EUR"], true)) {
            throw new InvalidArgumentException("Select a valid base currency.");
        }

        if (!is_numeric($vatRate) || (float) $vatRate < 0 || (float) $vatRate > 100) {
            throw new InvalidArgumentException("VAT rate must be between 0 and 100.");
        }

        foreach ([
            "Discount threshold" => $discountThreshold,
            "Waiver threshold" => $waiverThreshold,
            "Credit note threshold" => $creditNoteThreshold
        ] as $label => $amount) {
            if (!is_numeric($amount) || (float) $amount < 0 || (float) $amount > 9999999999999999) {
                throw new InvalidArgumentException($label . " must be a valid non-negative amount.");
            }
        }

        if (!is_numeric($defaultCreditTermsDays) || (int) $defaultCreditTermsDays != $defaultCreditTermsDays || (int) $defaultCreditTermsDays < 1 || (int) $defaultCreditTermsDays > 3650) {
            throw new InvalidArgumentException("Credit terms must be between 1 and 3650 days.");
        }

        if (!is_numeric($dunningIntervalDays) || (int) $dunningIntervalDays != $dunningIntervalDays || (int) $dunningIntervalDays < 1 || (int) $dunningIntervalDays > 365) {
            throw new InvalidArgumentException("Dunning interval must be between 1 and 365 days.");
        }

        if ($dualApprovalRequired === null || $clearanceGateEnforced === null || $allowApprovedCredit === null || $allowWaiver === null || $autoBlockOnExposure === null) {
            throw new InvalidArgumentException("All financial control settings must be valid.");
        }

        if ($changeReason === "") {
            throw new InvalidArgumentException("Enter a reason for the configuration change.");
        }

        if (mb_strlen($changeReason) > 500) {
            throw new InvalidArgumentException("Change reason cannot exceed 500 characters.");
        }

        $newValues = [
            "base_currency" => $baseCurrency,
            "vat_rate" => (float) $vatRate,
            "discount_threshold" => (float) $discountThreshold,
            "waiver_threshold" => (float) $waiverThreshold,
            "credit_note_threshold" => (float) $creditNoteThreshold,
            "dual_approval_required" => $dualApprovalRequired,
            "clearance_gate_enforced" => $clearanceGateEnforced,
            "allow_approved_credit" => $allowApprovedCredit,
            "allow_waiver" => $allowWaiver,
            "auto_block_on_exposure" => $autoBlockOnExposure,
            "default_credit_terms_days" => (int) $defaultCreditTermsDays,
            "dunning_interval_days" => (int) $dunningIntervalDays
        ];

        $conn->beginTransaction();

        $q = $conn->prepare("SELECT id, base_currency, vat_rate, discount_threshold, waiver_threshold, credit_note_threshold, dual_approval_required, clearance_gate_enforced, allow_approved_credit, allow_waiver, auto_block_on_exposure, default_credit_terms_days, dunning_interval_days FROM financial_configuration WHERE config_key = :config_key LIMIT 1 FOR UPDATE");
        $q->bindValue(":config_key", "default", PDO::PARAM_STR);
        $q->execute();
        $existing = $q->fetch(PDO::FETCH_ASSOC);

        $oldValues = $existing ?: null;
        $configurationId = $existing["id"] ?? generateId();

        if ($existing) {
            $q = $conn->prepare("UPDATE financial_configuration SET base_currency = :base_currency, vat_rate = :vat_rate, discount_threshold = :discount_threshold, waiver_threshold = :waiver_threshold, credit_note_threshold = :credit_note_threshold, dual_approval_required = :dual_approval_required, clearance_gate_enforced = :clearance_gate_enforced, allow_approved_credit = :allow_approved_credit, allow_waiver = :allow_waiver, auto_block_on_exposure = :auto_block_on_exposure, default_credit_terms_days = :default_credit_terms_days, dunning_interval_days = :dunning_interval_days, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
        } else {
            $q = $conn->prepare("INSERT INTO financial_configuration (id, config_key, base_currency, vat_rate, discount_threshold, waiver_threshold, credit_note_threshold, dual_approval_required, clearance_gate_enforced, allow_approved_credit, allow_waiver, auto_block_on_exposure, default_credit_terms_days, dunning_interval_days) VALUES (:id, :config_key, :base_currency, :vat_rate, :discount_threshold, :waiver_threshold, :credit_note_threshold, :dual_approval_required, :clearance_gate_enforced, :allow_approved_credit, :allow_waiver, :auto_block_on_exposure, :default_credit_terms_days, :dunning_interval_days)");
            $q->bindValue(":id", $configurationId, PDO::PARAM_STR);
            $q->bindValue(":config_key", "default", PDO::PARAM_STR);
        }

        $q->bindValue(":base_currency", $baseCurrency, PDO::PARAM_STR);
        $q->bindValue(":vat_rate", (float) $vatRate);
        $q->bindValue(":discount_threshold", (float) $discountThreshold);
        $q->bindValue(":waiver_threshold", (float) $waiverThreshold);
        $q->bindValue(":credit_note_threshold", (float) $creditNoteThreshold);
        $q->bindValue(":dual_approval_required", (int) $dualApprovalRequired, PDO::PARAM_INT);
        $q->bindValue(":clearance_gate_enforced", (int) $clearanceGateEnforced, PDO::PARAM_INT);
        $q->bindValue(":allow_approved_credit", (int) $allowApprovedCredit, PDO::PARAM_INT);
        $q->bindValue(":allow_waiver", (int) $allowWaiver, PDO::PARAM_INT);
        $q->bindValue(":auto_block_on_exposure", (int) $autoBlockOnExposure, PDO::PARAM_INT);
        $q->bindValue(":default_credit_terms_days", (int) $defaultCreditTermsDays, PDO::PARAM_INT);
        $q->bindValue(":dunning_interval_days", (int) $dunningIntervalDays, PDO::PARAM_INT);

        if ($existing) {
            $q->bindValue(":id", $configurationId, PDO::PARAM_STR);
        }

        $q->execute();

        $actorId = $user_id ?? $userId ?? null;

        $q = $conn->prepare("INSERT INTO financial_configuration_audit (id, configuration_id, actor_id, action, old_values, new_values, change_reason, created_at) VALUES (:id, :configuration_id, :actor_id, :action, :old_values, :new_values, :change_reason, CURRENT_TIMESTAMP)");
        $q->bindValue(":id", generateId(), PDO::PARAM_STR);
        $q->bindValue(":configuration_id", $configurationId, PDO::PARAM_STR);
        $q->bindValue(":actor_id", $actorId, $actorId === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $q->bindValue(":action", $existing ? "updated" : "created", PDO::PARAM_STR);
        $q->bindValue(":old_values", $oldValues === null ? null : json_encode($oldValues, JSON_THROW_ON_ERROR), $oldValues === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $q->bindValue(":new_values", json_encode($newValues, JSON_THROW_ON_ERROR), PDO::PARAM_STR);
        $q->bindValue(":change_reason", $changeReason, PDO::PARAM_STR);
        $q->execute();

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Financial configuration saved successfully",
            "code" => [
                "configuration_id" => $configurationId,
                ...$newValues
            ]
        ]);
    } catch (InvalidArgumentException $e) {
        if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(400);

        echo json_encode([
            "error" => true,
            "data" => $e->getMessage(),
            "code" => null
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