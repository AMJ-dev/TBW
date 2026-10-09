<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

function cargoConfigBool($value, $default = false) {
    if (is_bool($value)) {
        return $value;
    }

    if (is_int($value)) {
        return $value === 1;
    }

    if (is_string($value)) {
        $value = strtolower(trim($value));

        if (in_array($value, ["1", "true", "yes", "on"], true)) {
            return true;
        }

        if (in_array($value, ["0", "false", "no", "off", ""], true)) {
            return false;
        }
    }

    return $default;
}

function cargoConfigValidationError($message) {
    throw new RuntimeException("VALIDATION: " . $message);
}

function cargoConfigSnapshot($conn, $versionId) {
    $snapshot = [
        "version_id" => $versionId,
        "states" => [],
        "transitions" => [],
        "hold_policies" => [],
        "behaviour" => [],
        "settings" => []
    ];

    $q = $conn->prepare("SELECT state_key AS id, code, internal_label, customer_label, terminal, active, is_system AS system, sort_order FROM cargo_states WHERE config_version_id = :version_id ORDER BY sort_order, state_key");
    $q->bindValue(":version_id", $versionId, PDO::PARAM_STR);
    $q->execute();
    $snapshot["states"] = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("SELECT rule_key AS id, from_code AS `from`, to_code AS `to`, requires_hold_clear, requires_docs, requires_financial_clearance, requires_authority_reference, notifies, active, sort_order FROM cargo_transitions WHERE config_version_id = :version_id ORDER BY sort_order, rule_key");
    $q->bindValue(":version_id", $versionId, PDO::PARAM_STR);
    $q->execute();
    $snapshot["transitions"] = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("SELECT policy_key AS id, hold_type AS type, authority_required, reference_required, release_reason_required, enabled, sort_order FROM cargo_hold_policies WHERE config_version_id = :version_id ORDER BY sort_order, policy_key");
    $q->bindValue(":version_id", $versionId, PDO::PARAM_STR);
    $q->execute();
    $snapshot["hold_policies"] = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("SELECT auto_notify_on_transition, allow_bulk_transitions, split_merge_preserves_lineage, pause_storage_on_hold, track_container_level, track_package_level, require_docs_for_release, require_no_active_holds, require_financial_clearance, allow_approved_credit_or_waiver, require_gate_verification FROM cargo_lifecycle_settings WHERE config_version_id = :version_id LIMIT 1");
    $q->bindValue(":version_id", $versionId, PDO::PARAM_STR);
    $q->execute();
    $settings = $q->fetch(PDO::FETCH_ASSOC);

    if ($settings) {
        $snapshot["settings"] = $settings;
        $snapshot["behaviour"] = [
            "auto_notify_on_transition" => cargoConfigBool($settings["auto_notify_on_transition"]),
            "allow_bulk_transitions" => cargoConfigBool($settings["allow_bulk_transitions"]),
            "split_merge_preserves_lineage" => cargoConfigBool($settings["split_merge_preserves_lineage"]),
            "pause_storage_on_hold" => cargoConfigBool($settings["pause_storage_on_hold"]),
            "track_container_level" => cargoConfigBool($settings["track_container_level"]),
            "track_package_level" => cargoConfigBool($settings["track_package_level"])
        ];
    }

    return $snapshot;
}

try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed",
            "code" => null
        ]);
        exit;
    }

    $configuration = null;

    if (isset($_POST["configuration"])) {
        $configuration = $_POST["configuration"];

        if (is_string($configuration)) {
            $configuration = json_decode($configuration, true);
        }
    } elseif (!empty($_POST)) {
        $configuration = $_POST;
    } else {
        $rawInput = file_get_contents("php://input");

        if ($rawInput !== false && trim($rawInput) !== "") {
            $configuration = json_decode($rawInput, true);
        }
    }

    if (isset($configuration["configuration"]) && is_array($configuration["configuration"])) {
        $configuration = $configuration["configuration"];
    }

    if (!is_array($configuration)) {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "A valid configuration field is required",
            "code" => null
        ]);
        exit;
    }

    $states = $configuration["states"] ?? null;
    $transitions = $configuration["transitions"] ?? null;
    $holdPolicies = $configuration["hold_policies"] ?? $configuration["holdPolicies"] ?? null;
    $behaviour = $configuration["behaviour"] ?? $configuration["behavior"] ?? null;

    if (!is_array($states) || !is_array($transitions) || !is_array($holdPolicies) || !is_array($behaviour)) {
        cargoConfigValidationError("States, transitions, hold policies and behaviour are required.");
    }

    $settings = [
        "auto_notify_on_transition" => cargoConfigBool($behaviour["auto_notify_on_transition"] ?? false),
        "allow_bulk_transitions" => cargoConfigBool($behaviour["allow_bulk_transitions"] ?? false),
        "split_merge_preserves_lineage" => cargoConfigBool($behaviour["split_merge_preserves_lineage"] ?? true),
        "pause_storage_on_hold" => cargoConfigBool($behaviour["pause_storage_on_hold"] ?? true),
        "track_container_level" => cargoConfigBool($behaviour["track_container_level"] ?? true),
        "track_package_level" => cargoConfigBool($behaviour["track_package_level"] ?? false),
        "require_docs_for_release" => cargoConfigBool($configuration["require_docs_for_release"] ?? true),
        "require_no_active_holds" => cargoConfigBool($configuration["require_no_active_holds"] ?? true),
        "require_financial_clearance" => cargoConfigBool($configuration["require_financial_clearance"] ?? true),
        "allow_approved_credit_or_waiver" => cargoConfigBool($configuration["allow_approved_credit_or_waiver"] ?? false),
        "require_gate_verification" => cargoConfigBool($configuration["require_gate_verification"] ?? true)
    ];

    $stateMap = [];
    $stateCodes = [];

    foreach ($states as $index => $state) {
        if (!is_array($state)) {
            cargoConfigValidationError("Each state must be a valid object.");
        }

        $stateId = trim((string)($state["id"] ?? ""));
        $stateCode = strtoupper(trim((string)($state["code"] ?? "")));
        $internalLabel = trim((string)($state["internal_label"] ?? ""));
        $customerLabel = trim((string)($state["customer_label"] ?? ""));

        if ($stateId === "" || $stateCode === "" || $internalLabel === "" || $customerLabel === "") {
            cargoConfigValidationError("Every state must have an ID, code, internal label and customer label.");
        }

        if (strlen($stateCode) > 64 || !preg_match('/^[A-Z][A-Z0-9_]*$/', $stateCode)) {
            cargoConfigValidationError("Invalid state code: " . $stateCode);
        }

        if (strlen($internalLabel) > 150 || strlen($customerLabel) > 150) {
            cargoConfigValidationError("State labels must not exceed 150 characters.");
        }

        if (isset($stateMap[$stateId])) {
            cargoConfigValidationError("Duplicate state ID: " . $stateId);
        }

        if (isset($stateCodes[$stateCode])) {
            cargoConfigValidationError("Duplicate state code: " . $stateCode);
        }

        $stateMap[$stateId] = [
            "id" => $stateId,
            "code" => $stateCode,
            "internal_label" => $internalLabel,
            "customer_label" => $customerLabel,
            "terminal" => cargoConfigBool($state["terminal"] ?? false),
            "active" => cargoConfigBool($state["active"] ?? true),
            "sort_order" => (int)($state["sort_order"] ?? $index)
        ];

        $stateCodes[$stateCode] = true;
    }

    $transitionIds = [];
    $transitionRows = [];

    foreach ($transitions as $index => $transition) {
        if (!is_array($transition)) {
            cargoConfigValidationError("Each transition must be a valid object.");
        }

        $transitionId = trim((string)($transition["id"] ?? ""));
        $fromCode = strtoupper(trim((string)($transition["from"] ?? "")));
        $toCode = strtoupper(trim((string)($transition["to"] ?? "")));

        if ($transitionId === "" || $fromCode === "" || $toCode === "") {
            cargoConfigValidationError("Every transition must have an ID, source state and destination state.");
        }

        if (isset($transitionIds[$transitionId])) {
            cargoConfigValidationError("Duplicate transition ID: " . $transitionId);
        }

        if (!isset($stateCodes[$fromCode]) || !isset($stateCodes[$toCode])) {
            cargoConfigValidationError("Transition references an unknown state: " . $fromCode . " to " . $toCode);
        }

        $transitionIds[$transitionId] = true;

        $transitionRows[] = [
            "id" => $transitionId,
            "from" => $fromCode,
            "to" => $toCode,
            "requires_hold_clear" => cargoConfigBool($transition["requires_hold_clear"] ?? false),
            "requires_docs" => cargoConfigBool($transition["requires_docs"] ?? false),
            "requires_financial_clearance" => cargoConfigBool($transition["requires_financial_clearance"] ?? false),
            "requires_authority_reference" => cargoConfigBool($transition["requires_authority_reference"] ?? false),
            "notifies" => cargoConfigBool($transition["notifies"] ?? false),
            "active" => cargoConfigBool($transition["active"] ?? true),
            "sort_order" => (int)($transition["sort_order"] ?? $index)
        ];
    }

    $holdIds = [];
    $holdRows = [];

    foreach ($holdPolicies as $index => $policy) {
        if (!is_array($policy)) {
            cargoConfigValidationError("Each hold policy must be a valid object.");
        }

        $policyId = trim((string)($policy["id"] ?? ""));
        $holdType = trim((string)($policy["type"] ?? ""));

        if ($policyId === "" || $holdType === "") {
            cargoConfigValidationError("Every hold policy must have an ID and type.");
        }

        if (isset($holdIds[$policyId])) {
            cargoConfigValidationError("Duplicate hold policy ID: " . $policyId);
        }

        if (strlen($holdType) > 100) {
            cargoConfigValidationError("Hold policy type must not exceed 100 characters.");
        }

        $holdIds[$policyId] = true;

        $holdRows[] = [
            "id" => $policyId,
            "type" => $holdType,
            "authority_required" => cargoConfigBool($policy["authority_required"] ?? false),
            "reference_required" => cargoConfigBool($policy["reference_required"] ?? false),
            "release_reason_required" => cargoConfigBool($policy["release_reason_required"] ?? false),
            "enabled" => cargoConfigBool($policy["enabled"] ?? true),
            "sort_order" => (int)($policy["sort_order"] ?? $index)
        ];
    }

    $conn->beginTransaction();

    $q = $conn->prepare("SELECT id, version_no FROM cargo_config_versions WHERE is_current = 1 LIMIT 1 FOR UPDATE");
    $q->execute();
    $currentVersion = $q->fetch(PDO::FETCH_ASSOC);

    $previousSnapshot = null;
    $currentVersionId = null;
    $nextVersion = 1;

    if ($currentVersion) {
        $currentVersionId = (string)$currentVersion["id"];
        $nextVersion = ((int)$currentVersion["version_no"]) + 1;
        $previousSnapshot = cargoConfigSnapshot($conn, $currentVersionId);
    }

    $systemStates = [];

    if ($currentVersionId !== null) {
        $q = $conn->prepare("SELECT state_key, code, terminal, active FROM cargo_states WHERE config_version_id = :version_id AND is_system = 1");
        $q->bindValue(":version_id", $currentVersionId, PDO::PARAM_STR);
        $q->execute();
        $systemStates = $q->fetchAll(PDO::FETCH_ASSOC);
    }

    foreach ($systemStates as $systemState) {
        $systemKey = (string)$systemState["state_key"];
        $systemCode = (string)$systemState["code"];

        if (!isset($stateMap[$systemKey])) {
            $matchingState = null;

            foreach ($stateMap as $submittedState) {
                if ($submittedState["code"] === $systemCode) {
                    $matchingState = $submittedState;
                    break;
                }
            }

            if ($matchingState === null) {
                cargoConfigValidationError("System state cannot be removed: " . $systemCode);
            }

            $stateMap[$matchingState["id"]]["system"] = true;
        } else {
            $stateMap[$systemKey]["system"] = true;
        }

        $submittedSystemState = $stateMap[$systemKey] ?? null;

        if ($submittedSystemState === null) {
            foreach ($stateMap as $submittedState) {
                if ($submittedState["code"] === $systemCode) {
                    $submittedSystemState = $submittedState;
                    break;
                }
            }
        }

        if ($submittedSystemState === null) {
            cargoConfigValidationError("System state cannot be removed: " . $systemCode);
        }

        if ($submittedSystemState["code"] !== $systemCode) {
            cargoConfigValidationError("System state code cannot be changed: " . $systemCode);
        }

        if ($submittedSystemState["terminal"] !== cargoConfigBool($systemState["terminal"])) {
            cargoConfigValidationError("System state terminal setting cannot be changed: " . $systemCode);
        }

        if ($submittedSystemState["active"] !== cargoConfigBool($systemState["active"])) {
            cargoConfigValidationError("System state activation cannot be changed: " . $systemCode);
        }
    }

    foreach ($stateMap as $stateId => $state) {
        $stateMap[$stateId]["system"] = cargoConfigBool($state["system"] ?? false);
    }

    foreach ($stateMap as $state) {
        if (!$state["system"] && !str_starts_with($state["code"], "CUSTOM_")) {
            cargoConfigValidationError("Custom state codes must begin with CUSTOM_: " . $state["code"]);
        }
    }

    $releaseTargets = ["RELEASE_AUTHORISED", "SLOT_BOOKED", "LOADING", "GATE_OUT"];

    foreach ($transitionRows as $transition) {
        if (!$transition["active"]) {
            continue;
        }

        if (in_array($transition["to"], $releaseTargets, true)) {
            if ($settings["require_no_active_holds"] && !$transition["requires_hold_clear"]) {
                cargoConfigValidationError("Transitions to " . $transition["to"] . " must require hold clearance.");
            }

            if ($settings["require_docs_for_release"] && !$transition["requires_docs"]) {
                cargoConfigValidationError("Transitions to " . $transition["to"] . " must require document clearance.");
            }

            if ($settings["require_financial_clearance"] && !$transition["requires_financial_clearance"]) {
                cargoConfigValidationError("Transitions to " . $transition["to"] . " must require financial clearance.");
            }

            if ($settings["require_gate_verification"] && $transition["to"] === "GATE_OUT" && !$transition["requires_authority_reference"]) {
                cargoConfigValidationError("Transitions to GATE_OUT must require authority reference verification.");
            }
        }
    }

    $enabledPolicies = array_filter($holdRows, function ($policy) {
        return $policy["enabled"];
    });

    if ($enabledPolicies && !array_filter($enabledPolicies, function ($policy) {
        return $policy["release_reason_required"];
    })) {
        cargoConfigValidationError("At least one enabled hold policy must require a release reason.");
    }

    $changeReason = trim((string)($configuration["change_reason"] ?? $_POST["change_reason"] ?? "Cargo lifecycle configuration updated"));

    if (strlen($changeReason) > 500) {
        $changeReason = substr($changeReason, 0, 500);
    }

    $versionId = generateId();
    $actorId = (string)$my_details->id;

    $q = $conn->prepare("UPDATE cargo_config_versions SET is_current = 0 WHERE is_current = 1");
    $q->execute();

    $q = $conn->prepare("INSERT INTO cargo_config_versions (id, version_no, is_current, change_reason, created_by) VALUES (:id, :version_no, 1, :change_reason, :created_by)");
    $q->bindValue(":id", $versionId, PDO::PARAM_STR);
    $q->bindValue(":version_no", $nextVersion, PDO::PARAM_INT);
    $q->bindValue(":change_reason", $changeReason, PDO::PARAM_STR);
    $q->bindValue(":created_by", $actorId, PDO::PARAM_STR);
    $q->execute();

    $q = $conn->prepare("INSERT INTO cargo_states (id, config_version_id, state_key, code, internal_label, customer_label, terminal, active, is_system, sort_order) VALUES (:id, :config_version_id, :state_key, :code, :internal_label, :customer_label, :terminal, :active, :is_system, :sort_order)");

    foreach ($stateMap as $state) {
        $q->bindValue(":id", generateId(), PDO::PARAM_STR);
        $q->bindValue(":config_version_id", $versionId, PDO::PARAM_STR);
        $q->bindValue(":state_key", $state["id"], PDO::PARAM_STR);
        $q->bindValue(":code", $state["code"], PDO::PARAM_STR);
        $q->bindValue(":internal_label", $state["internal_label"], PDO::PARAM_STR);
        $q->bindValue(":customer_label", $state["customer_label"], PDO::PARAM_STR);
        $q->bindValue(":terminal", (int)$state["terminal"], PDO::PARAM_INT);
        $q->bindValue(":active", (int)$state["active"], PDO::PARAM_INT);
        $q->bindValue(":is_system", (int)$state["system"], PDO::PARAM_INT);
        $q->bindValue(":sort_order", $state["sort_order"], PDO::PARAM_INT);
        $q->execute();
    }

    $q = $conn->prepare("INSERT INTO cargo_transitions (id, config_version_id, rule_key, from_code, to_code, requires_hold_clear, requires_docs, requires_financial_clearance, requires_authority_reference, notifies, active, sort_order) VALUES (:id, :config_version_id, :rule_key, :from_code, :to_code, :requires_hold_clear, :requires_docs, :requires_financial_clearance, :requires_authority_reference, :notifies, :active, :sort_order)");

    foreach ($transitionRows as $transition) {
        $q->bindValue(":id", generateId(), PDO::PARAM_STR);
        $q->bindValue(":config_version_id", $versionId, PDO::PARAM_STR);
        $q->bindValue(":rule_key", $transition["id"], PDO::PARAM_STR);
        $q->bindValue(":from_code", $transition["from"], PDO::PARAM_STR);
        $q->bindValue(":to_code", $transition["to"], PDO::PARAM_STR);
        $q->bindValue(":requires_hold_clear", (int)$transition["requires_hold_clear"], PDO::PARAM_INT);
        $q->bindValue(":requires_docs", (int)$transition["requires_docs"], PDO::PARAM_INT);
        $q->bindValue(":requires_financial_clearance", (int)$transition["requires_financial_clearance"], PDO::PARAM_INT);
        $q->bindValue(":requires_authority_reference", (int)$transition["requires_authority_reference"], PDO::PARAM_INT);
        $q->bindValue(":notifies", (int)$transition["notifies"], PDO::PARAM_INT);
        $q->bindValue(":active", (int)$transition["active"], PDO::PARAM_INT);
        $q->bindValue(":sort_order", $transition["sort_order"], PDO::PARAM_INT);
        $q->execute();
    }

    $q = $conn->prepare("INSERT INTO cargo_hold_policies (id, config_version_id, policy_key, hold_type, authority_required, reference_required, release_reason_required, enabled, sort_order) VALUES (:id, :config_version_id, :policy_key, :hold_type, :authority_required, :reference_required, :release_reason_required, :enabled, :sort_order)");

    foreach ($holdRows as $policy) {
        $q->bindValue(":id", generateId(), PDO::PARAM_STR);
        $q->bindValue(":config_version_id", $versionId, PDO::PARAM_STR);
        $q->bindValue(":policy_key", $policy["id"], PDO::PARAM_STR);
        $q->bindValue(":hold_type", $policy["type"], PDO::PARAM_STR);
        $q->bindValue(":authority_required", (int)$policy["authority_required"], PDO::PARAM_INT);
        $q->bindValue(":reference_required", (int)$policy["reference_required"], PDO::PARAM_INT);
        $q->bindValue(":release_reason_required", (int)$policy["release_reason_required"], PDO::PARAM_INT);
        $q->bindValue(":enabled", (int)$policy["enabled"], PDO::PARAM_INT);
        $q->bindValue(":sort_order", $policy["sort_order"], PDO::PARAM_INT);
        $q->execute();
    }

    $q = $conn->prepare("INSERT INTO cargo_lifecycle_settings (config_version_id, auto_notify_on_transition, allow_bulk_transitions, split_merge_preserves_lineage, pause_storage_on_hold, track_container_level, track_package_level, require_docs_for_release, require_no_active_holds, require_financial_clearance, allow_approved_credit_or_waiver, require_gate_verification) VALUES (:config_version_id, :auto_notify_on_transition, :allow_bulk_transitions, :split_merge_preserves_lineage, :pause_storage_on_hold, :track_container_level, :track_package_level, :require_docs_for_release, :require_no_active_holds, :require_financial_clearance, :allow_approved_credit_or_waiver, :require_gate_verification)");

    $q->bindValue(":config_version_id", $versionId, PDO::PARAM_STR);
    $q->bindValue(":auto_notify_on_transition", (int)$settings["auto_notify_on_transition"], PDO::PARAM_INT);
    $q->bindValue(":allow_bulk_transitions", (int)$settings["allow_bulk_transitions"], PDO::PARAM_INT);
    $q->bindValue(":split_merge_preserves_lineage", (int)$settings["split_merge_preserves_lineage"], PDO::PARAM_INT);
    $q->bindValue(":pause_storage_on_hold", (int)$settings["pause_storage_on_hold"], PDO::PARAM_INT);
    $q->bindValue(":track_container_level", (int)$settings["track_container_level"], PDO::PARAM_INT);
    $q->bindValue(":track_package_level", (int)$settings["track_package_level"], PDO::PARAM_INT);
    $q->bindValue(":require_docs_for_release", (int)$settings["require_docs_for_release"], PDO::PARAM_INT);
    $q->bindValue(":require_no_active_holds", (int)$settings["require_no_active_holds"], PDO::PARAM_INT);
    $q->bindValue(":require_financial_clearance", (int)$settings["require_financial_clearance"], PDO::PARAM_INT);
    $q->bindValue(":allow_approved_credit_or_waiver", (int)$settings["allow_approved_credit_or_waiver"], PDO::PARAM_INT);
    $q->bindValue(":require_gate_verification", (int)$settings["require_gate_verification"], PDO::PARAM_INT);
    $q->execute();

    $afterSnapshot = cargoConfigSnapshot($conn, $versionId);
    $requestId = generateId();
    $beforeJson = json_encode($previousSnapshot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $afterJson = json_encode($afterSnapshot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $ipAddress = substr((string)($_SERVER["REMOTE_ADDR"] ?? ""), 0, 45);
    $userAgent = substr((string)($_SERVER["HTTP_USER_AGENT"] ?? ""), 0, 500);

    $q = $conn->prepare("INSERT INTO cargo_config_audit (id, config_version_id, actor_id, action, change_reason, before_json, after_json, request_id, ip_address, user_agent) VALUES (:id, :config_version_id, :actor_id, :action, :change_reason, :before_json, :after_json, :request_id, :ip_address, :user_agent)");
    $q->bindValue(":id", generateId(), PDO::PARAM_STR);
    $q->bindValue(":config_version_id", $versionId, PDO::PARAM_STR);
    $q->bindValue(":actor_id", $actorId, PDO::PARAM_STR);
    $q->bindValue(":action", "CARGO_CONFIGURATION_UPDATED", PDO::PARAM_STR);
    $q->bindValue(":change_reason", $changeReason, PDO::PARAM_STR);
    $q->bindValue(":before_json", $beforeJson, PDO::PARAM_STR);
    $q->bindValue(":after_json", $afterJson, PDO::PARAM_STR);
    $q->bindValue(":request_id", $requestId, PDO::PARAM_STR);
    $q->bindValue(":ip_address", $ipAddress, PDO::PARAM_STR);
    $q->bindValue(":user_agent", $userAgent, PDO::PARAM_STR);
    $q->execute();

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => true,
        "code" => [
            "version" => $nextVersion,
            "version_id" => $versionId,
            "request_id" => $requestId,
            "message" => "Cargo configuration updated successfully."
        ]
    ]);
} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    if (str_starts_with($e->getMessage(), "VALIDATION: ")) {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => substr($e->getMessage(), 12),
            "code" => null
        ]);
        exit;
    }

    error_log("Cargo configuration update error: " . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Unable to update cargo configuration.",
        "code" => null
    ]);
}