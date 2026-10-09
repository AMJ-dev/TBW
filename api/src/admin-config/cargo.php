<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $q = $conn->prepare("SELECT id, version_no, change_reason, created_at FROM cargo_config_versions WHERE is_current = 1 ORDER BY id DESC LIMIT 1");
        $q->execute();
        $version = $q->fetch(PDO::FETCH_ASSOC);

        if (!$version) {
            http_response_code(500);
            echo json_encode(["error" => true, "data" => "Cargo configuration has not been seeded. Run database/cargo_lifecycle.sql first."]);
            exit;
        }

        $versionId = (int) $version["id"];

        $q = $conn->prepare("SELECT state_key AS id, code, internal_label, customer_label, terminal, active, is_system AS system, sort_order FROM cargo_states WHERE config_version_id = :version_id ORDER BY sort_order ASC, id ASC");
        $q->bindValue(":version_id", $versionId, PDO::PARAM_INT);
        $q->execute();
        $states = $q->fetchAll(PDO::FETCH_ASSOC);

        foreach ($states as &$state) {
            $state["terminal"] = (bool) $state["terminal"];
            $state["active"] = (bool) $state["active"];
            $state["system"] = (bool) $state["system"];
            unset($state["sort_order"]);
        }
        unset($state);

        $q = $conn->prepare("SELECT rule_key AS id, from_code AS `from`, to_code AS `to`, requires_hold_clear, requires_docs, requires_financial_clearance, requires_authority_reference, notifies, active, sort_order FROM cargo_transitions WHERE config_version_id = :version_id ORDER BY sort_order ASC, id ASC");
        $q->bindValue(":version_id", $versionId, PDO::PARAM_INT);
        $q->execute();
        $transitions = $q->fetchAll(PDO::FETCH_ASSOC);

        foreach ($transitions as &$transition) {
            $transition["requires_hold_clear"] = (bool) $transition["requires_hold_clear"];
            $transition["requires_docs"] = (bool) $transition["requires_docs"];
            $transition["requires_financial_clearance"] = (bool) $transition["requires_financial_clearance"];
            $transition["requires_authority_reference"] = (bool) $transition["requires_authority_reference"];
            $transition["notifies"] = (bool) $transition["notifies"];
            $transition["active"] = (bool) $transition["active"];
            unset($transition["sort_order"]);
        }
        unset($transition);

        $q = $conn->prepare("SELECT policy_key AS id, hold_type AS type, authority_required, reference_required, release_reason_required, enabled, sort_order FROM cargo_hold_policies WHERE config_version_id = :version_id ORDER BY sort_order ASC, id ASC");
        $q->bindValue(":version_id", $versionId, PDO::PARAM_INT);
        $q->execute();
        $holdPolicies = $q->fetchAll(PDO::FETCH_ASSOC);

        foreach ($holdPolicies as &$policy) {
            $policy["authority_required"] = (bool) $policy["authority_required"];
            $policy["reference_required"] = (bool) $policy["reference_required"];
            $policy["release_reason_required"] = (bool) $policy["release_reason_required"];
            $policy["enabled"] = (bool) $policy["enabled"];
            unset($policy["sort_order"]);
        }
        unset($policy);

        $q = $conn->prepare("SELECT * FROM cargo_lifecycle_settings WHERE config_version_id = :version_id LIMIT 1");
        $q->bindValue(":version_id", $versionId, PDO::PARAM_INT);
        $q->execute();
        $settings = $q->fetch(PDO::FETCH_ASSOC);

        if (!$settings) {
            http_response_code(500);
            echo json_encode(["error" => true, "data" => "Lifecycle settings are missing for the current configuration."]);
            exit;
        }

        $booleanFields = [
            "auto_notify_on_transition",
            "allow_bulk_transitions",
            "split_merge_preserves_lineage",
            "pause_storage_on_hold",
            "track_container_level",
            "track_package_level",
            "require_docs_for_release",
            "require_no_active_holds",
            "require_financial_clearance",
            "allow_approved_credit_or_waiver",
            "require_gate_verification"
        ];

        foreach ($booleanFields as $field) {
            $settings[$field] = (bool) $settings[$field];
        }

        $behaviour = [
            "auto_notify_on_transition" => $settings["auto_notify_on_transition"],
            "allow_bulk_transitions" => $settings["allow_bulk_transitions"],
            "split_merge_preserves_lineage" => $settings["split_merge_preserves_lineage"],
            "pause_storage_on_hold" => $settings["pause_storage_on_hold"],
            "track_container_level" => $settings["track_container_level"],
            "track_package_level" => $settings["track_package_level"]
        ];

        $payload = [
            "version" => (int) $version["version_no"],
            "version_created_at" => $version["created_at"],
            "states" => $states,
            "transitions" => $transitions,
            "hold_policies" => $holdPolicies,
            "behaviour" => $behaviour,
            "require_docs_for_release" => $settings["require_docs_for_release"],
            "require_no_active_holds" => $settings["require_no_active_holds"],
            "require_financial_clearance" => $settings["require_financial_clearance"],
            "allow_approved_credit_or_waiver" => $settings["allow_approved_credit_or_waiver"],
            "require_gate_verification" => $settings["require_gate_verification"]
        ];

        echo json_encode(["error" => false, "data" => true, "code" => $payload]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(["error" => true, "data" => "Could not load cargo configuration."]);
    }
