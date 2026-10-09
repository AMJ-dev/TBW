<?php

    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    header("Content-Type: application/json");

    try {
        $actorId = $my_details->id;

        $flags = $_POST["flags"] ?? [];

        if (is_string($flags)) {
            $flags = json_decode($flags, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode([
                    "error" => true,
                    "data" => "Invalid flags JSON",
                    "code" => "INVALID_FLAGS_JSON"
                ]);
                exit;
            }
        }

        if (!is_array($flags)) {
            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "Flags must be an array",
                "code" => "INVALID_FLAGS"
            ]);
            exit;
        }

        $config = $conn->query("
            SELECT *
            FROM feature_flag_config
            LIMIT 1
        ")->fetch(PDO::FETCH_ASSOC);

        if (!$config) {
            http_response_code(404);
            echo json_encode([
                "error" => true,
                "data" => "Feature flag configuration not found",
                "code" => "CONFIG_NOT_FOUND"
            ]);
            exit;
        }

        $auditAllChanges = isset($_POST["audit_all_changes"])
            ? filter_var($_POST["audit_all_changes"], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
            : (bool) $config["audit_all_changes"];

        $allowPerOrgOverride = isset($_POST["allow_per_org_override"])
            ? filter_var($_POST["allow_per_org_override"], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
            : (bool) $config["allow_per_org_override"];

        $requireReason = isset($_POST["require_reason"])
            ? filter_var($_POST["require_reason"], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
            : (bool) $config["require_reason"];

        if (
            $auditAllChanges === null ||
            $allowPerOrgOverride === null ||
            $requireReason === null
        ) {
            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "Invalid configuration setting",
                "code" => "INVALID_CONFIG"
            ]);
            exit;
        }

        $changeReason = trim($_POST["change_reason"] ?? "");

        if ($requireReason && (count($flags) > 0 || isset($_POST["audit_all_changes"]) || isset($_POST["allow_per_org_override"]) || isset($_POST["require_reason"])) && $changeReason === "") {
            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "A reason is required for this change",
                "code" => "CHANGE_REASON_REQUIRED"
            ]);
            exit;
        }

        if (strlen($changeReason) > 500) {
            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "Change reason cannot exceed 500 characters",
                "code" => "CHANGE_REASON_TOO_LONG"
            ]);
            exit;
        }

        $conn->beginTransaction();

        $configChanges = [];

        $oldAuditAllChanges = (bool) $config["audit_all_changes"];
        $oldAllowPerOrgOverride = (bool) $config["allow_per_org_override"];
        $oldRequireReason = (bool) $config["require_reason"];

        if ($oldAuditAllChanges !== $auditAllChanges) {
            $configChanges["audit_all_changes"] = [
                "old" => $oldAuditAllChanges,
                "new" => $auditAllChanges
            ];
        }

        if ($oldAllowPerOrgOverride !== $allowPerOrgOverride) {
            $configChanges["allow_per_org_override"] = [
                "old" => $oldAllowPerOrgOverride,
                "new" => $allowPerOrgOverride
            ];
        }

        if ($oldRequireReason !== $requireReason) {
            $configChanges["require_reason"] = [
                "old" => $oldRequireReason,
                "new" => $requireReason
            ];
        }

        $q = $conn->prepare("
            UPDATE feature_flag_config
            SET audit_all_changes = :audit_all_changes,
                allow_per_org_override = :allow_per_org_override,
                require_reason = :require_reason,
                updated_by = :updated_by
            WHERE id = :id
        ");

        $q->execute([
            ":audit_all_changes" => (int) $auditAllChanges,
            ":allow_per_org_override" => (int) $allowPerOrgOverride,
            ":require_reason" => (int) $requireReason,
            ":updated_by" => $actorId,
            ":id" => $config["id"]
        ]);

        $changedFlags = [];

        foreach ($flags as $flag) {
            if (!is_array($flag)) {
                throw new Exception("Each flag must be an object");
            }

            $flagId = trim((string) ($flag["id"] ?? ""));
            $flagKey = trim((string) ($flag["key"] ?? $flag["flag_key"] ?? ""));

            if ($flagId === "" && $flagKey === "") {
                throw new Exception("Each flag must include an ID or key");
            }

            if (!array_key_exists("enabled", $flag)) {
                throw new Exception("Each flag must include its enabled value");
            }

            $enabled = filter_var(
                $flag["enabled"],
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if ($enabled === null) {
                throw new Exception("Invalid enabled value");
            }

            if ($flagId !== "") {
                $q = $conn->prepare("
                    SELECT id, flag_key, label, enabled, requires_approval
                    FROM feature_flags
                    WHERE id = :id
                    LIMIT 1
                    FOR UPDATE
                ");
                $q->execute([":id" => $flagId]);
            } else {
                $q = $conn->prepare("
                    SELECT id, flag_key, label, enabled, requires_approval
                    FROM feature_flags
                    WHERE flag_key = :flag_key
                    LIMIT 1
                    FOR UPDATE
                ");
                $q->execute([":flag_key" => $flagKey]);
            }

            $existingFlag = $q->fetch(PDO::FETCH_ASSOC);

            if (!$existingFlag) {
                throw new Exception("Feature flag not found: " . ($flagKey ?: $flagId));
            }

            $oldEnabled = (bool) $existingFlag["enabled"];

            if ($oldEnabled === $enabled) {
                continue;
            }

            if ((bool) $existingFlag["requires_approval"]) {
                throw new Exception(
                    "Approval is required before changing " . $existingFlag["flag_key"]
                );
            }

            $q = $conn->prepare("
                UPDATE feature_flags
                SET enabled = :enabled,
                    updated_by = :updated_by
                WHERE id = :id
            ");

            $q->execute([
                ":enabled" => (int) $enabled,
                ":updated_by" => $actorId,
                ":id" => $existingFlag["id"]
            ]);

            $changedFlags[] = [
                "id" => $existingFlag["id"],
                "key" => $existingFlag["flag_key"],
                "label" => $existingFlag["label"],
                "old_enabled" => $oldEnabled,
                "new_enabled" => $enabled
            ];
        }

        if (
            $oldAuditAllChanges ||
            $auditAllChanges
        ) {
            if (!empty($configChanges) || !empty($changedFlags)) {
                $details = [
                    "config_changes" => $configChanges,
                    "flag_changes" => $changedFlags
                ];

                $q = $conn->prepare("
                    INSERT INTO feature_flag_audit_logs (
                        id,
                        actor_id,
                        action,
                        change_reason,
                        details
                    ) VALUES (
                        :id,
                        :actor_id,
                        :action,
                        :change_reason,
                        :details
                    )
                ");

                $q->execute([
                    ":id" => generateId(),
                    ":actor_id" => $actorId,
                    ":action" => "feature_flags_updated",
                    ":change_reason" => $changeReason,
                    ":details" => json_encode($details, JSON_THROW_ON_ERROR)
                ]);
            }
        }

        $conn->commit();

        $q = $conn->query("
            SELECT
                id,
                flag_key AS `key`,
                label,
                description,
                scope,
                enabled,
                requires_approval AS requiresApproval,
                created_at,
                updated_at
            FROM feature_flags
            ORDER BY scope, flag_key
        ");

        $updatedFlags = $q->fetchAll(PDO::FETCH_ASSOC);

        foreach ($updatedFlags as &$updatedFlag) {
            $updatedFlag["enabled"] = (bool) $updatedFlag["enabled"];
            $updatedFlag["requiresApproval"] = (bool) $updatedFlag["requiresApproval"];
        }
        unset($updatedFlag);

        echo json_encode([
            "error" => false,
            "data" => [
                "config" => [
                    "auditAllChanges" => $auditAllChanges,
                    "allowPerOrgOverride" => $allowPerOrgOverride,
                    "requireReason" => $requireReason
                ],
                "flags" => $updatedFlags
            ],
            "code" => null
        ]);

    } catch (Throwable $e) {
        if (isset($conn) && $conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(400);

        echo json_encode([
            "error" => true,
            "data" => $e->getMessage() === ""
                ? "Unable to update feature flags"
                : $e->getMessage(),
            "code" => "FEATURE_FLAGS_UPDATE_FAILED"
        ]);
    }