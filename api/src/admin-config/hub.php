<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $userId = trim((string)($my_details->id ?? ""));
        $organisationId = trim((string)($my_details->organisation_id ?? ""));

        if ($userId === "") {
            http_response_code(403);
            echo json_encode([
                "error" => true,
                "data" => "Authentication required",
                "code" => null
            ]);
            exit;
        }

        $isSystemAdmin = false;

        if (!empty($my_details->system_role_id)) {
            $stmt = $conn->prepare("
                SELECT role_key
                FROM roles
                WHERE id = :role_id
                AND scope = 'system'
                AND is_active = 1
                LIMIT 1
            ");

            $stmt->execute([
                ":role_id" => $my_details->system_role_id
            ]);

            $systemRole = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($systemRole && $systemRole["role_key"] === "system_admin") {
                $isSystemAdmin = true;
            }
        }

        if (!$isSystemAdmin) {
            http_response_code(403);
            echo json_encode([
                "error" => true,
                "data" => "You do not have permission to access system configuration",
                "code" => null
            ]);
            exit;
        }

        $totalUsers = 0;
        $activeUsers = 0;
        $mfaUsers = 0;
        $organisationCount = 0;
        $roleCount = 0;

        $stmt = $conn->query("
            SELECT
                COUNT(*) AS total_users,
                SUM(CASE WHEN account_status = 'active' THEN 1 ELSE 0 END) AS active_users,
                SUM(CASE WHEN mfa_enabled = 1 THEN 1 ELSE 0 END) AS mfa_users
            FROM users
        ");

        $userStats = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($userStats) {
            $totalUsers = (int)$userStats["total_users"];
            $activeUsers = (int)$userStats["active_users"];
            $mfaUsers = (int)$userStats["mfa_users"];
        }

        $stmt = $conn->query("
            SELECT COUNT(*) AS total
            FROM organisations
        ");

        $organisationStats = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($organisationStats) {
            $organisationCount = (int)$organisationStats["total"];
        }

        $stmt = $conn->query("
            SELECT COUNT(*) AS total
            FROM roles
            WHERE is_active = 1
        ");

        $roleStats = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($roleStats) {
            $roleCount = (int)$roleStats["total"];
        }

        $sections = [
            [
                "key" => "organisation",
                "title" => "Organisation Settings",
                "desc" => "Manage organisation identity, registration information, verification details and organisation-level settings.",
                "href" => "/admin/configuration/organisation",
                "icon" => "Building2",
                "group" => "identity",
                "state" => "Available",
                "stateTone" => "success",
                "lastChanged" => "Configured",
                "featured" => true,
                "enabled" => true
            ],
            [
                "key" => "terminal",
                "title" => "Terminal Operations",
                "desc" => "Configure terminal areas, zones, services, cargo handling rules, operational locations and facility settings.",
                "href" => "/admin/configuration/terminal",
                "icon" => "Boxes",
                "group" => "identity",
                "state" => "Available",
                "stateTone" => "success",
                "lastChanged" => "Configured",
                "featured" => true,
                "enabled" => true
            ],
            [
                "key" => "cargo",
                "title" => "Cargo & Lifecycle",
                "desc" => "Configure cargo states, customer labels, permitted lifecycle transitions, holds and operational reasons.",
                "href" => "/admin/configuration/cargo",
                "icon" => "ClipboardCheck",
                "group" => "platform",
                "state" => "Available",
                "stateTone" => "success",
                "lastChanged" => "Configured",
                "featured" => true,
                "enabled" => true
            ],
            [
                "key" => "gate",
                "title" => "Gate & Booking",
                "desc" => "Configure appointment capacity, booking rules, cut-off periods, blackout periods, vehicle requirements and gate controls.",
                "href" => "/admin/configuration/gate",
                "icon" => "Truck",
                "group" => "commercial",
                "state" => "Available",
                "stateTone" => "success",
                "lastChanged" => "Configured",
                "featured" => false,
                "enabled" => true
            ],
            [
                "key" => "financial",
                "title" => "Financial Rules",
                "desc" => "Configure designated financial rules, currencies, tax behaviour, approval thresholds and financial control settings.",
                "href" => "/admin/configuration/financial",
                "icon" => "CircleDollarSign",
                "group" => "commercial",
                "state" => "Available",
                "stateTone" => "success",
                "lastChanged" => "Configured",
                "featured" => true,
                "enabled" => true
            ],
            [
                "key" => "storage",
                "title" => "Storage Rules",
                "desc" => "Configure free storage periods, charging units, progressive escalation, minimum charges, pauses and overstay rules.",
                "href" => "/admin/configuration/storage",
                "icon" => "TimerReset",
                "group" => "commercial",
                "state" => "Available",
                "stateTone" => "success",
                "lastChanged" => "Configured",
                "featured" => false,
                "enabled" => true
            ],
            [
                "key" => "documents",
                "title" => "Documents",
                "desc" => "Configure document types, templates, numbering, verification settings, retention requirements and issuing controls.",
                "href" => "/admin/configuration/documents",
                "icon" => "FileCog",
                "group" => "platform",
                "state" => "Available",
                "stateTone" => "success",
                "lastChanged" => "Configured",
                "featured" => false,
                "enabled" => true
            ],
            [
                "key" => "notifications",
                "title" => "Notifications",
                "desc" => "Configure notification events, channels, templates, delivery behaviour, retries and fallback channels.",
                "href" => "/admin/configuration/notifications",
                "icon" => "Megaphone",
                "group" => "platform",
                "state" => "Available",
                "stateTone" => "success",
                "lastChanged" => "Configured",
                "featured" => false,
                "enabled" => true
            ],
            [
                "key" => "security",
                "title" => "Access & Security",
                "desc" => "Configure administrative security controls, MFA requirements, session controls, lockout behaviour and access policies.",
                "href" => "/admin/configuration/security",
                "icon" => "LockKeyhole",
                "group" => "governance",
                "state" => "Protected",
                "stateTone" => "warning",
                "lastChanged" => "Configured",
                "featured" => true,
                "enabled" => true
            ],
            [
                "key" => "integrations",
                "title" => "Integrations",
                "desc" => "Manage integration configuration, operational controls, adapter availability and integration behaviour.",
                "href" => "/admin/configuration/integrations",
                "icon" => "Network",
                "group" => "platform",
                "state" => "Available",
                "stateTone" => "success",
                "lastChanged" => "Configured",
                "featured" => false,
                "enabled" => true
            ],
            [
                "key" => "feature_flags",
                "title" => "Feature Flags",
                "desc" => "Control platform capabilities without requiring a code deployment.",
                "href" => "/admin/feature-flags",
                "icon" => "Flag",
                "group" => "governance",
                "state" => "Available",
                "stateTone" => "success",
                "lastChanged" => "Configured",
                "featured" => false,
                "enabled" => true
            ],
            [
                "key" => "maintenance",
                "title" => "Maintenance & Notices",
                "desc" => "Control maintenance mode, scheduled notices and planned downtime messaging.",
                "href" => "/admin/maintenance",
                "icon" => "CalendarClock",
                "group" => "governance",
                "state" => "Available",
                "stateTone" => "success",
                "lastChanged" => "Configured",
                "featured" => false,
                "enabled" => true
            ]
        ];

        $groups = [
            [
                "key" => "identity",
                "label" => "Identity & Terminal",
                "hint" => "Who we are and what the facility handles"
            ],
            [
                "key" => "commercial",
                "label" => "Commercial",
                "hint" => "Money, storage, and gate economics"
            ],
            [
                "key" => "platform",
                "label" => "Platform",
                "hint" => "Documents, messaging, integrations, and flags"
            ],
            [
                "key" => "governance",
                "label" => "Governance",
                "hint" => "Security, availability, and data lifecycle"
            ]
        ];

        $metrics = [
            [
                "key" => "configuration_areas",
                "label" => "Configuration Areas",
                "value" => (string)count($sections),
                "detail" => "Designated configuration controls",
                "tone" => "info",
                "icon" => "Settings2"
            ],
            [
                "key" => "active_users",
                "label" => "Active Users",
                "value" => number_format($activeUsers),
                "detail" => number_format($totalUsers) . " users registered",
                "tone" => "success",
                "icon" => "Users"
            ],
            [
                "key" => "organisations",
                "label" => "Organisations",
                "value" => number_format($organisationCount),
                "detail" => "Registered organisations",
                "tone" => "info",
                "icon" => "Building2"
            ],
            [
                "key" => "active_roles",
                "label" => "Active Roles",
                "value" => number_format($roleCount),
                "detail" => "System and organisation roles",
                "tone" => "warning",
                "icon" => "ShieldCheck"
            ]
        ];

        $mfaRequired = true;
        $auditEnabled = true;

        $conventions = [
            [
                "title" => "Audited Changes",
                "detail" => "Administrative configuration changes must be attributable to an authenticated actor."
            ],
            [
                "title" => "Controlled Rules",
                "detail" => "Designated business rules should be configurable rather than hard-coded."
            ],
            [
                "title" => "Least Privilege",
                "detail" => "Configuration access is restricted to authorised administrative users."
            ],
            [
                "title" => "MFA",
                "detail" => "MFA is required for administrative access."
            ]
        ];

        echo json_encode([
            "error" => false,
            "data" => "Configuration loaded successfully",
            "code" => [
                "sections" => $sections,
                "groups" => $groups,
                "metrics" => $metrics,
                "status" => [
                    "environment" => "Production",
                    "auditEnabled" => $auditEnabled,
                    "mfaRequired" => $mfaRequired
                ],
                "conventions" => $conventions
            ]
        ]);
    } catch (Throwable $e) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => $e->getMessage(),
            "code" => null
        ]);
    }