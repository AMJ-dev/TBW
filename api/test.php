
<?php
require_once __DIR__ . "/include/conn.php";

try {
    $tables = [
        "cargo_config_audit" => "CONFIGURATION",
        "cargo_status_audit" => "SHIPMENT",
        "document_config_audit" => "CONFIGURATION",
        "financial_configuration_audit" => "CONFIGURATION",
        "gate_configuration_audit" => "CONFIGURATION",
        "gate_driver_action_logs" => "GATE",
        "gate_driver_assignment_logs" => "GATE",
        "gate_movement_audit" => "GATE",
        "gate_vehicle_action_logs" => "GATE",
        "integration_audit_logs" => "INTEGRATION",
        "maintenance_audit_logs" => "CONFIGURATION",
        "notification_config_audit" => "CONFIGURATION",
        "operation_manifest_events" => "MANIFEST",
        "organisation_audit_logs" => "ORGANISATION",
        "portal_receiving_logs" => "RECEIVING",
        "portal_shipment_document_logs" => "DOCUMENT",
        "security_config_audit_logs" => "SECURITY",
        "storage_config_audit" => "CONFIGURATION",
        "terminal_configuration_audit" => "CONFIGURATION",
        "terminal_examination_logs" => "EXAMINATION",
        "terminal_warehouse_movement_logs" => "WAREHOUSE",
        "terminal_yard_movement_logs" => "YARD"
    ];

    $firstValue = function (array $row, array $keys) {
        foreach ($keys as $key) {
            if (array_key_exists($key, $row) && $row[$key] !== null && $row[$key] !== "") {
                return $row[$key];
            }
        }

        return null;
    };

    $toJson = function ($value) {
        if ($value === null || $value === "") {
            return null;
        }

        if (is_string($value)) {
            json_decode($value);

            if (json_last_error() === JSON_ERROR_NONE) {
                return $value;
            }
        }

        return json_encode(
            ["value" => $value],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
        );
    };

    $conn->beginTransaction();

    $insert = $conn->prepare("
        INSERT INTO activity_logs (
            id,
            request_id,
            organisation_id,
            actor_id,
            category,
            action,
            entity_type,
            entity_id,
            entity_reference,
            description,
            reason,
            old_values,
            new_values,
            metadata,
            ip_address,
            user_agent,
            severity,
            created_at
        ) VALUES (
            :id,
            :request_id,
            :organisation_id,
            :actor_id,
            :category,
            :action,
            :entity_type,
            :entity_id,
            :entity_reference,
            :description,
            :reason,
            :old_values,
            :new_values,
            :metadata,
            :ip_address,
            :user_agent,
            :severity,
            :created_at
        )
    ");

    $check = $conn->prepare("
        SELECT id
        FROM activity_logs
        WHERE JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.source_table')) = :source_table
        AND JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.source_id')) = :source_id
        LIMIT 1
    ");

    $totalImported = 0;
    $totalSkipped = 0;
    $tableResults = [];

    foreach ($tables as $table => $category) {
        $tableCheck = $conn->prepare("
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            AND table_name = :table_name
        ");

        $tableCheck->execute([":table_name" => $table]);

        if (!(int) $tableCheck->fetchColumn()) {
            $tableResults[$table] = [
                "imported" => 0,
                "skipped" => 0,
                "message" => "Table not found"
            ];
            continue;
        }

        $stmt = $conn->query("SELECT * FROM `$table`");

        $imported = 0;
        $skipped = 0;

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $sourceId = $firstValue($row, ["id"]);

            if ($sourceId !== null) {
                $check->execute([
                    ":source_table" => $table,
                    ":source_id" => (string) $sourceId
                ]);

                if ($check->fetchColumn()) {
                    $skipped++;
                    continue;
                }
            }

            $action = $firstValue($row, [
                "action",
                "event",
                "event_type",
                "activity",
                "event_name",
                "decision"
            ]) ?? strtoupper($table);

            $entityType = $firstValue($row, [
                "entity_type",
                "resource_type",
                "target_type"
            ]);

            if ($entityType === null) {
                $entityTypes = [
                    "cargo_config_audit" => "CARGO_CONFIGURATION",
                    "cargo_status_audit" => "SHIPMENT",
                    "document_config_audit" => "DOCUMENT_CONFIGURATION",
                    "financial_configuration_audit" => "FINANCIAL_CONFIGURATION",
                    "gate_configuration_audit" => "GATE_CONFIGURATION",
                    "gate_driver_action_logs" => "DRIVER",
                    "gate_driver_assignment_logs" => "DRIVER",
                    "gate_movement_audit" => "GATE_MOVEMENT",
                    "gate_vehicle_action_logs" => "VEHICLE",
                    "integration_audit_logs" => "INTEGRATION",
                    "maintenance_audit_logs" => "MAINTENANCE_CONFIGURATION",
                    "notification_config_audit" => "NOTIFICATION_CONFIGURATION",
                    "operation_manifest_events" => "MANIFEST",
                    "organisation_audit_logs" => "ORGANISATION",
                    "portal_receiving_logs" => "CONTAINER",
                    "portal_shipment_document_logs" => "SHIPMENT_DOCUMENT",
                    "security_config_audit_logs" => "SECURITY_CONFIGURATION",
                    "storage_config_audit" => "STORAGE_CONFIGURATION",
                    "terminal_configuration_audit" => "TERMINAL_CONFIGURATION",
                    "terminal_examination_logs" => "EXAMINATION",
                    "terminal_warehouse_movement_logs" => "CONTAINER",
                    "terminal_yard_movement_logs" => "CONTAINER"
                ];

                $entityType = $entityTypes[$table] ?? strtoupper($table);
            }

            $entityId = $firstValue($row, [
                "entity_id",
                "shipment_id",
                "container_id",
                "driver_id",
                "vehicle_id",
                "manifest_id",
                "examination_id",
                "movement_id",
                "configuration_id",
                "config_id",
                "config_version_id",
                "organisation_id",
                "document_id",
                "integration_id",
                "gate_pass_id",
                "receiving_id"
            ]);

            $oldValues = $firstValue($row, [
                "old_values",
                "before_data",
                "before_json",
                "previous_data",
                "old_data"
            ]);

            $newValues = $firstValue($row, [
                "new_values",
                "after_data",
                "after_json",
                "current_data",
                "new_data"
            ]);

            if ($oldValues === null) {
                $previousStatus = $firstValue($row, [
                    "previous_status",
                    "old_status",
                    "from_status",
                    "previous_value"
                ]);

                if ($previousStatus !== null) {
                    $oldValues = ["status" => $previousStatus];
                }
            }

            if ($newValues === null) {
                $newStatus = $firstValue($row, [
                    "new_status",
                    "to_status",
                    "current_status",
                    "new_value"
                ]);

                if ($newStatus !== null) {
                    $newValues = ["status" => $newStatus];
                }
            }

            $metadata = [
                "source_table" => $table,
                "source_id" => $sourceId,
                "original_record" => $row
            ];

            $createdAt = $firstValue($row, [
                "created_at",
                "performed_at",
                "event_time",
                "logged_at",
                "timestamp"
            ]);

            $severity = strtoupper((string) $firstValue($row, ["severity", "level"]));

            if (!in_array($severity, ["INFO", "WARNING", "ERROR", "CRITICAL"], true)) {
                $severity = "INFO";
            }

            $insert->execute([
                ":id" => generateId(),
                ":request_id" => $firstValue($row, ["request_id", "correlation_id"]),
                ":organisation_id" => $firstValue($row, ["organisation_id", "org_id"]),
                ":actor_id" => $firstValue($row, ["actor_id", "performed_by", "user_id", "created_by"]),
                ":category" => $category,
                ":action" => strtoupper((string) $action),
                ":entity_type" => $entityType,
                ":entity_id" => $entityId,
                ":entity_reference" => $firstValue($row, [
                    "entity_reference",
                    "shipment_reference",
                    "container_no",
                    "movement_reference",
                    "manifest_reference",
                    "reference"
                ]),
                ":description" => $firstValue($row, [
                    "description",
                    "message",
                    "activity_description",
                    "details_text"
                ]),
                ":reason" => $firstValue($row, ["reason", "remarks", "comment"]),
                ":old_values" => $toJson($oldValues),
                ":new_values" => $toJson($newValues),
                ":metadata" => json_encode(
                    $metadata,
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
                ),
                ":ip_address" => $firstValue($row, ["ip_address", "ip"]),
                ":user_agent" => $firstValue($row, ["user_agent"]),
                ":severity" => $severity,
                ":created_at" => $createdAt ?? date("Y-m-d H:i:s")
            ]);

            $imported++;
        }

        $totalImported += $imported;
        $totalSkipped += $skipped;

        $tableResults[$table] = [
            "imported" => $imported,
            "skipped" => $skipped
        ];
    }

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => [
            "message" => "Audit log migration completed.",
            "total_imported" => $totalImported,
            "total_skipped" => $totalSkipped,
            "tables" => $tableResults
        ],
        "code" => 200
    ], JSON_PRETTY_PRINT);

} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Could not migrate audit logs.",
        "details" => $e->getMessage(),
        "code" => 500
    ]);
}
