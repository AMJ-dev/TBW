<?php
require_once __DIR__ . '/include/conn.php';

try {
    $conn->beginTransaction();

    $q = $conn->prepare("SELECT id, version_no FROM cargo_config_versions WHERE is_current = 1 ORDER BY id DESC LIMIT 1 FOR UPDATE");
    $q->execute();
    $currentConfiguration = $q->fetch(PDO::FETCH_ASSOC);

    if ($currentConfiguration) {
        $configurationId = (string) $currentConfiguration["id"];
        $version = (int) $currentConfiguration["version_no"];

        $q = $conn->prepare("SELECT COUNT(*) FROM cargo_states WHERE config_version_id = :configuration_id");
        $q->bindValue(":configuration_id", $configurationId, PDO::PARAM_STR);
        $q->execute();

        if ((int) $q->fetchColumn() > 0) {
            $conn->commit();
            echo json_encode([
                "error" => false,
                "data" => "Cargo lifecycle configuration already exists",
                "code" => [
                    "configuration_id" => $configurationId,
                    "version" => $version,
                    "created" => false
                ]
            ]);
            exit;
        }
    } else {
        $q = $conn->prepare("INSERT INTO cargo_config_versions (id, version_no, is_current, change_reason, created_by) VALUES (:id, :version_no, 1, :change_reason, :created_by)");
        $configurationId = generateId();
        $q->bindValue(":id", $configurationId, PDO::PARAM_STR);
        $q->bindValue(":version_no", 1, PDO::PARAM_INT);
        $q->bindValue(":change_reason", "Initial cargo lifecycle configuration", PDO::PARAM_STR);
        $q->bindValue(":created_by", "system", PDO::PARAM_STR);
        $q->execute();

        $version = 1;
    }

    $states = [
        ["s-1", "EXPECTED", "Expected", "Expected", 0],
        ["s-2", "IN_TRANSIT_TO_TERMINAL", "In transit to terminal", "In transit to terminal", 0],
        ["s-3", "ARRIVED_AT_GATE", "Arrived at gate", "Arrived at terminal", 0],
        ["s-4", "RECEIVED", "Received", "Received", 0],
        ["s-5", "STORED", "Stored", "In storage", 0],
        ["s-6", "DOCS_IN_PROGRESS", "Documentation in progress", "Documentation in progress", 0],
        ["s-7", "EXAMINATION_SCHEDULED", "Examination scheduled", "Examination scheduled", 0],
        ["s-8", "UNDER_EXAMINATION", "Under examination", "Under examination", 0],
        ["s-9", "EXAMINATION_COMPLETE", "Examination complete", "Examination complete", 0],
        ["s-10", "HELD", "Held", "On hold — contact operations", 0],
        ["s-11", "CHARGES_PENDING", "Charges pending", "Charges pending", 0],
        ["s-12", "CHARGES_SETTLED", "Charges settled", "Charges settled", 0],
        ["s-13", "RELEASE_AUTHORISED", "Release authorised", "Released for collection", 0],
        ["s-14", "SLOT_BOOKED", "Slot booked", "Collection booked", 0],
        ["s-15", "LOADING", "Loading", "Loading", 0],
        ["s-16", "GATE_OUT", "Gate out", "Collected", 1],
        ["s-17", "CLOSED", "Closed", "Closed", 1],
        ["s-18", "OVERSTAYED", "Overstayed", "Overstayed — action required", 0],
        ["s-19", "TRANSFERRED_OUT", "Transferred out", "Transferred", 1],
        ["s-20", "RETURNED_RE_EXPORTED", "Returned / Re-exported", "Returned / Re-exported", 1]
    ];

    $q = $conn->prepare("INSERT INTO cargo_states (id, config_version_id, state_key, code, internal_label, customer_label, terminal, active, is_system, sort_order) VALUES (:id, :configuration_id, :state_key, :code, :internal_label, :customer_label, :terminal, 1, 1, :sort_order)");

    foreach ($states as $index => $state) {
        $q->bindValue(":id", generateId(), PDO::PARAM_STR);
        $q->bindValue(":configuration_id", $configurationId, PDO::PARAM_STR);
        $q->bindValue(":state_key", $state[0], PDO::PARAM_STR);
        $q->bindValue(":code", $state[1], PDO::PARAM_STR);
        $q->bindValue(":internal_label", $state[2], PDO::PARAM_STR);
        $q->bindValue(":customer_label", $state[3], PDO::PARAM_STR);
        $q->bindValue(":terminal", $state[4], PDO::PARAM_INT);
        $q->bindValue(":sort_order", $index + 1, PDO::PARAM_INT);
        $q->execute();
    }

    $transitions = [
        ["t-1", "EXPECTED", "IN_TRANSIT_TO_TERMINAL", 0, 0, 0, 0, 1],
        ["t-2", "IN_TRANSIT_TO_TERMINAL", "ARRIVED_AT_GATE", 0, 0, 0, 0, 1],
        ["t-3", "ARRIVED_AT_GATE", "RECEIVED", 0, 0, 0, 0, 1],
        ["t-4", "RECEIVED", "STORED", 0, 0, 0, 0, 1],
        ["t-5", "STORED", "DOCS_IN_PROGRESS", 0, 1, 0, 0, 1],
        ["t-6", "DOCS_IN_PROGRESS", "EXAMINATION_SCHEDULED", 1, 1, 0, 0, 1],
        ["t-7", "EXAMINATION_SCHEDULED", "UNDER_EXAMINATION", 1, 1, 0, 0, 1],
        ["t-8", "UNDER_EXAMINATION", "EXAMINATION_COMPLETE", 1, 1, 0, 0, 1],
        ["t-9", "EXAMINATION_COMPLETE", "CHARGES_PENDING", 1, 1, 0, 0, 1],
        ["t-10", "CHARGES_PENDING", "CHARGES_SETTLED", 1, 1, 0, 0, 1],
        ["t-11", "CHARGES_SETTLED", "RELEASE_AUTHORISED", 1, 1, 1, 1, 1],
        ["t-12", "RELEASE_AUTHORISED", "SLOT_BOOKED", 1, 1, 1, 1, 1],
        ["t-13", "SLOT_BOOKED", "LOADING", 1, 1, 1, 1, 0],
        ["t-14", "LOADING", "GATE_OUT", 1, 1, 1, 1, 1],
        ["t-15", "GATE_OUT", "CLOSED", 0, 0, 0, 0, 0]
    ];

    $q = $conn->prepare("INSERT INTO cargo_transitions (id, config_version_id, rule_key, from_code, to_code, requires_hold_clear, requires_docs, requires_financial_clearance, requires_authority_reference, notifies, active, sort_order) VALUES (:id, :configuration_id, :rule_key, :from_code, :to_code, :requires_hold_clear, :requires_docs, :requires_financial_clearance, :requires_authority_reference, :notifies, 1, :sort_order)");

    foreach ($transitions as $index => $transition) {
        $q->bindValue(":id", generateId(), PDO::PARAM_STR);
        $q->bindValue(":configuration_id", $configurationId, PDO::PARAM_STR);
        $q->bindValue(":rule_key", $transition[0], PDO::PARAM_STR);
        $q->bindValue(":from_code", $transition[1], PDO::PARAM_STR);
        $q->bindValue(":to_code", $transition[2], PDO::PARAM_STR);
        $q->bindValue(":requires_hold_clear", $transition[3], PDO::PARAM_INT);
        $q->bindValue(":requires_docs", $transition[4], PDO::PARAM_INT);
        $q->bindValue(":requires_financial_clearance", $transition[5], PDO::PARAM_INT);
        $q->bindValue(":requires_authority_reference", $transition[6], PDO::PARAM_INT);
        $q->bindValue(":notifies", $transition[7], PDO::PARAM_INT);
        $q->bindValue(":sort_order", $index + 1, PDO::PARAM_INT);
        $q->execute();
    }

    $holdPolicies = [
        ["h-1", "Customs", 1, 1, 1, 1],
        ["h-2", "Agency", 1, 1, 1, 1],
        ["h-3", "Terminal", 0, 1, 1, 1],
        ["h-4", "Financial", 0, 1, 1, 1],
        ["h-5", "Damage", 0, 1, 1, 1],
        ["h-6", "Documentation", 0, 1, 1, 1]
    ];

    $q = $conn->prepare("INSERT INTO cargo_hold_policies (id, config_version_id, policy_key, hold_type, authority_required, reference_required, release_reason_required, enabled, sort_order) VALUES (:id, :configuration_id, :policy_key, :hold_type, :authority_required, :reference_required, :release_reason_required, :enabled, :sort_order)");

    foreach ($holdPolicies as $index => $policy) {
        $q->bindValue(":id", generateId(), PDO::PARAM_STR);
        $q->bindValue(":configuration_id", $configurationId, PDO::PARAM_STR);
        $q->bindValue(":policy_key", $policy[0], PDO::PARAM_STR);
        $q->bindValue(":hold_type", $policy[1], PDO::PARAM_STR);
        $q->bindValue(":authority_required", $policy[2], PDO::PARAM_INT);
        $q->bindValue(":reference_required", $policy[3], PDO::PARAM_INT);
        $q->bindValue(":release_reason_required", $policy[4], PDO::PARAM_INT);
        $q->bindValue(":enabled", $policy[5], PDO::PARAM_INT);
        $q->bindValue(":sort_order", $index + 1, PDO::PARAM_INT);
        $q->execute();
    }

    $q = $conn->prepare("INSERT INTO cargo_lifecycle_settings (config_version_id, auto_notify_on_transition, allow_bulk_transitions, split_merge_preserves_lineage, pause_storage_on_hold, track_container_level, track_package_level, require_docs_for_release, require_no_active_holds, require_financial_clearance, allow_approved_credit_or_waiver, require_gate_verification) VALUES (:configuration_id, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1)");
    $q->bindValue(":configuration_id", $configurationId, PDO::PARAM_STR);
    $q->execute();

    $snapshot = [
        "states" => count($states),
        "transitions" => count($transitions),
        "hold_policies" => count($holdPolicies),
        "require_docs_for_release" => true,
        "require_no_active_holds" => true,
        "require_financial_clearance" => true,
        "require_gate_verification" => true
    ];

    $q = $conn->prepare("INSERT INTO cargo_config_audit (id, config_version_id, actor_id, action, change_reason, before_json, after_json, request_id, ip_address, user_agent) VALUES (:id, :configuration_id, :actor_id, :action, :change_reason, NULL, :after_json, :request_id, :ip_address, :user_agent)");
    $q->bindValue(":id", generateId(), PDO::PARAM_STR);
    $q->bindValue(":configuration_id", $configurationId, PDO::PARAM_STR);
    $q->bindValue(":actor_id", "system", PDO::PARAM_STR);
    $q->bindValue(":action", "CARGO_CONFIGURATION_INITIALISED", PDO::PARAM_STR);
    $q->bindValue(":change_reason", "Initial cargo lifecycle configuration", PDO::PARAM_STR);
    $q->bindValue(":after_json", json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), PDO::PARAM_STR);
    $q->bindValue(":request_id", bin2hex(random_bytes(16)), PDO::PARAM_STR);
    $q->bindValue(":ip_address", substr((string) ($_SERVER["REMOTE_ADDR"] ?? ""), 0, 45), PDO::PARAM_STR);
    $q->bindValue(":user_agent", substr((string) ($_SERVER["HTTP_USER_AGENT"] ?? ""), 0, 500), PDO::PARAM_STR);
    $q->execute();

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Cargo lifecycle configuration saved successfully",
        "code" => [
            "configuration_id" => $configurationId,
            "version" => $version,
            "states" => count($states),
            "transitions" => count($transitions),
            "hold_policies" => count($holdPolicies),
            "require_docs_for_release" => true,
            "require_no_active_holds" => true,
            "require_financial_clearance" => true,
            "require_gate_verification" => true
        ]
    ]);
} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Unable to save cargo lifecycle configuration",
        "code" => null
    ]);
}
