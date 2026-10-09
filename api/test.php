<?php
require_once __DIR__ . '/include/conn.php';

$createdBy = "c0654f0b-8452-4a03-a43d-0d0cda17da1b";

try {
    $conn->beginTransaction();

    $q = $conn->prepare("SELECT id FROM feature_flag_config LIMIT 1");
    $q->execute();
    $configurationId = $q->fetchColumn();

    if (!$configurationId) {
        $configurationId = generateId();

        $q = $conn->prepare("
            INSERT INTO feature_flag_config (
                id,
                audit_all_changes,
                allow_per_org_override,
                require_reason,
                created_by,
                updated_by
            ) VALUES (
                :id,
                :audit_all_changes,
                :allow_per_org_override,
                :require_reason,
                :created_by,
                :updated_by
            )
        ");

        $q->execute([
            ":id" => $configurationId,
            ":audit_all_changes" => 1,
            ":allow_per_org_override" => 0,
            ":require_reason" => 1,
            ":created_by" => $createdBy,
            ":updated_by" => $createdBy
        ]);
    }

    $flags = [
        [
            "key" => "public.cargo_tracking",
            "label" => "Public cargo tracking",
            "desc" => "Allow unauthenticated tracking lookups on the public site.",
            "scope" => "public",
            "enabled" => true,
            "requires_approval" => false
        ],
        [
            "key" => "public.metrics_display",
            "label" => "Public metrics display",
            "desc" => "Show aggregate operational metrics on the public site. Suppressible without deploy.",
            "scope" => "public",
            "enabled" => true,
            "requires_approval" => true
        ],
        [
            "key" => "public.terminal_map",
            "label" => "Interactive terminal map",
            "desc" => "Enable the public zone visualisation.",
            "scope" => "public",
            "enabled" => false,
            "requires_approval" => false
        ],
        [
            "key" => "portal.self_registration",
            "label" => "Portal self-registration",
            "desc" => "Allow prospects to create an account pending approval.",
            "scope" => "portal",
            "enabled" => true,
            "requires_approval" => false
        ],
        [
            "key" => "portal.quote_request",
            "label" => "Quote request submission",
            "desc" => "Allow unauth and auth users to submit quote requests.",
            "scope" => "portal",
            "enabled" => true,
            "requires_approval" => false
        ],
        [
            "key" => "portal.online_payment",
            "label" => "Online payment initiation",
            "desc" => "Allow customers to initiate payment from the portal.",
            "scope" => "portal",
            "enabled" => true,
            "requires_approval" => true
        ],
        [
            "key" => "portal.storage_accrual",
            "label" => "Live storage accrual",
            "desc" => "Show real-time storage cost accrual in the portal.",
            "scope" => "portal",
            "enabled" => true,
            "requires_approval" => false
        ],
        [
            "key" => "ops.offline_gate",
            "label" => "Offline gate authorisation",
            "desc" => "Allow gate decisions from cached authorisations when upstream is unavailable.",
            "scope" => "operations",
            "enabled" => true,
            "requires_approval" => true
        ],
        [
            "key" => "ops.anpr",
            "label" => "ANPR plate recognition",
            "desc" => "Enable automatic plate match to booking at gate. Manual fallback always available.",
            "scope" => "operations",
            "enabled" => false,
            "requires_approval" => false
        ],
        [
            "key" => "ops.handheld_scanner",
            "label" => "Handheld scanning",
            "desc" => "Enable barcode/QR scanning on staff handhelds.",
            "scope" => "operations",
            "enabled" => true,
            "requires_approval" => false
        ],
        [
            "key" => "ops.automated_yard",
            "label" => "Automated yard optimisation",
            "desc" => "Deferred scope. Reserved for future phases; disabled by default.",
            "scope" => "operations",
            "enabled" => false,
            "requires_approval" => true
        ],
        [
            "key" => "platform.native_mobile",
            "label" => "Native mobile applications",
            "desc" => "Deferred scope. Reserved for Phase 3+; no effect while disabled.",
            "scope" => "platform",
            "enabled" => false,
            "requires_approval" => true
        ],
        [
            "key" => "platform.developer_api",
            "label" => "Developer public API",
            "desc" => "Deferred scope. Public developer programme; disabled by default.",
            "scope" => "platform",
            "enabled" => false,
            "requires_approval" => true
        ],
        [
            "key" => "platform.trade_finance",
            "label" => "Trade finance marketplace",
            "desc" => "Deferred scope. Reserved for future phases; disabled by default.",
            "scope" => "platform",
            "enabled" => false,
            "requires_approval" => true
        ]
    ];

    $q = $conn->prepare("
        SELECT id, enabled
        FROM feature_flags
        WHERE flag_key = :flag_key
        LIMIT 1
    ");

    $insert = $conn->prepare("
        INSERT INTO feature_flags (
            id,
            flag_key,
            label,
            description,
            scope,
            enabled,
            requires_approval,
            created_by,
            updated_by
        ) VALUES (
            :id,
            :flag_key,
            :label,
            :description,
            :scope,
            :enabled,
            :requires_approval,
            :created_by,
            :updated_by
        )
    ");

    $inserted = 0;
    $existing = 0;

    foreach ($flags as $flag) {
        $q->execute([":flag_key" => $flag["key"]]);
        $existingFlag = $q->fetch(PDO::FETCH_ASSOC);

        if ($existingFlag) {
            $existing++;
            continue;
        }

        $insert->execute([
            ":id" => generateId(),
            ":flag_key" => $flag["key"],
            ":label" => $flag["label"],
            ":description" => $flag["desc"],
            ":scope" => $flag["scope"],
            ":enabled" => (int) $flag["enabled"],
            ":requires_approval" => (int) $flag["requires_approval"],
            ":created_by" => $createdBy,
            ":updated_by" => $createdBy
        ]);

        $inserted++;
    }

    $q = $conn->prepare("
        SELECT
            id,
            flag_key AS `key`,
            label,
            description AS `desc`,
            scope,
            enabled,
            requires_approval
        FROM feature_flags
        ORDER BY label ASC
    ");
    $q->execute();
    $savedFlags = $q->fetchAll(PDO::FETCH_ASSOC);

    foreach ($savedFlags as &$flag) {
        $flag["enabled"] = (bool) $flag["enabled"];
        $flag["requires_approval"] = (bool) $flag["requires_approval"];
    }
    unset($flag);

    if ($inserted > 0) {
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
            ":actor_id" => $createdBy,
            ":action" => "feature_flags_initialized",
            ":change_reason" => "Initial feature flag catalogue",
            ":details" => json_encode([
                "configuration_id" => $configurationId,
                "inserted_count" => $inserted,
                "existing_count" => $existing,
                "inserted_flags" => array_column(
                    array_filter(
                        $flags,
                        fn($flag) => true
                    ),
                    "key"
                )
            ], JSON_THROW_ON_ERROR)
        ]);
    }

    $q = $conn->prepare("
        SELECT audit_all_changes, allow_per_org_override, require_reason
        FROM feature_flag_config
        WHERE id = :id
        LIMIT 1
    ");
    $q->execute([":id" => $configurationId]);
    $config = $q->fetch(PDO::FETCH_ASSOC);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Feature flags initialized successfully",
        "code" => [
            "configuration_id" => $configurationId,
            "audit_all_changes" => (bool) $config["audit_all_changes"],
            "allow_per_org_override" => (bool) $config["allow_per_org_override"],
            "require_reason" => (bool) $config["require_reason"],
            "inserted_count" => $inserted,
            "existing_count" => $existing,
            "flags" => $savedFlags
        ]
    ]);
} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log("Feature flag initialization error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Unable to initialize feature flags",
        "code" => null
    ]);
}