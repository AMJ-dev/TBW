<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
   
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed",
        "code" => null
    ]);
    exit;
}

try {
    $userId = (string) ($my_details->id ?? "");

    if ($userId === "") {
        echo json_encode([
            "error" => true,
            "data" => "Authentication required.",
            "code" => null
        ]);
        exit;
    }

    $q = $conn->prepare("
        SELECT id, label
        FROM terminal_shipment_types
        WHERE is_active = 1
        ORDER BY label ASC
    ");
    $q->execute();
    $shipment_types = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT id, label
        FROM terminal_cargo_categories
        WHERE is_active = 1
        ORDER BY label ASC
    ");
    $q->execute();
    $cargo_categories = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT id, label
        FROM terminal_packaging_types
        WHERE is_active = 1
        ORDER BY label ASC
    ");
    $q->execute();
    $packaging_types = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT id, label
        FROM terminal_container_sizes
        WHERE is_active = 1
        ORDER BY sort_order ASC, label ASC
    ");
    $q->execute();
    $container_sizes = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT id, label
        FROM terminal_hold_reasons
        WHERE is_active = 1
        ORDER BY label ASC
    ");
    $q->execute();
    $hold_reasons = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT id, location_key, label, description, required, allow_multiple, sort_order
        FROM document_upload_locations
        WHERE is_active = 1
        ORDER BY sort_order ASC, label ASC
    ");
    $q->execute();
    $upload_location_rows = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT
            dul.location_key AS location_key,
            dt.document_key AS document_key,
            dt.label AS label,
            dult.is_required AS required,
            dult.allow_multiple AS allow_multiple,
            dt.sort_order AS sort_order
        FROM document_upload_locations dul
        INNER JOIN document_upload_location_types dult
            ON dult.location_id = dul.id
        INNER JOIN document_types dt
            ON dt.document_key = dult.document_key
        INNER JOIN document_config_versions dcv
            ON dcv.id = dt.config_version_id
        WHERE dul.is_active = 1
            AND dcv.is_current = 1
        ORDER BY dul.sort_order ASC, dt.sort_order ASC, dt.label ASC
    ");
    $q->execute();
    $upload_location_type_rows = $q->fetchAll(PDO::FETCH_ASSOC);

    $typesByLocation = [];
    foreach ($upload_location_type_rows as $r) {
        $key = (string) $r["location_key"];
        if (!isset($typesByLocation[$key])) {
            $typesByLocation[$key] = [];
        }
        $typesByLocation[$key][] = [
            "document_key" => (string) $r["document_key"],
            "label" => (string) $r["label"],
            "required" => (bool) $r["required"],
            "allow_multiple" => (bool) $r["allow_multiple"],
            "sort_order" => (int) $r["sort_order"]
        ];
    }

    $upload_locations = [];
    foreach ($upload_location_rows as $r) {
        $key = (string) $r["location_key"];
        $upload_locations[] = [
            "location_key" => $key,
            "label" => (string) $r["label"],
            "description" => (string) $r["description"],
            "required" => (bool) $r["required"],
            "allow_multiple" => (bool) $r["allow_multiple"],
            "sort_order" => (int) $r["sort_order"],
            "document_types" => $typesByLocation[$key] ?? []
        ];
    }

    $shipment_documents = [];
    foreach ($upload_locations as $loc) {
        if ($loc["location_key"] === "shipment_documents") {
            $shipment_documents = $loc["document_types"];
            break;
        }
    }

    $q = $conn->prepare("
        SELECT
            dt.document_key AS document_key,
            dt.label AS label,
            dt.sort_order AS sort_order
        FROM document_types dt
        INNER JOIN document_config_versions dcv
            ON dcv.id = dt.config_version_id
        WHERE dcv.is_current = 1
        ORDER BY dt.sort_order ASC, dt.label ASC
    ");
    $q->execute();
    $all_document_types = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $conn->prepare("
        SELECT
            dcv.id AS config_version_id,
            dcv.numbering_prefix AS numbering_prefix,
            dcv.numbering_format AS numbering_format,
            dcv.retention_months AS retention_months
        FROM document_config_versions dcv
        WHERE dcv.is_current = 1
        LIMIT 1
    ");
    $q->execute();
    $document_config = $q->fetch(PDO::FETCH_ASSOC) ?: null;

    $q = $conn->prepare("
        SELECT id
        FROM cargo_config_versions
        WHERE is_current = 1
        LIMIT 1
    ");
    $q->execute();
    $cargo_version_id = $q->fetchColumn();

    $cargo_states = [];
    $cargo_transitions = [];

    if ($cargo_version_id) {
        $q = $conn->prepare("
            SELECT code, internal_label, customer_label, terminal, active, is_system, sort_order
            FROM cargo_states
            WHERE config_version_id = :version_id
              AND active = 1
            ORDER BY sort_order ASC
        ");
        $q->bindValue(":version_id", $cargo_version_id);
        $q->execute();
        $stateRows = $q->fetchAll(PDO::FETCH_ASSOC);

        foreach ($stateRows as $r) {
            $cargo_states[] = [
                "code" => (string) $r["code"],
                "internal_label" => (string) $r["internal_label"],
                "customer_label" => (string) $r["customer_label"],
                "terminal" => (bool) $r["terminal"],
                "is_system" => (bool) $r["is_system"],
                "sort_order" => (int) $r["sort_order"]
            ];
        }

        $q = $conn->prepare("
            SELECT
                from_code, to_code,
                requires_hold_clear, requires_docs,
                requires_financial_clearance,
                requires_authority_reference,
                notifies, sort_order
            FROM cargo_transitions
            WHERE config_version_id = :version_id
              AND active = 1
            ORDER BY sort_order ASC
        ");
        $q->bindValue(":version_id", $cargo_version_id);
        $q->execute();
        $transitionRows = $q->fetchAll(PDO::FETCH_ASSOC);

        foreach ($transitionRows as $r) {
            $cargo_transitions[] = [
                "from_code" => (string) $r["from_code"],
                "to_code" => (string) $r["to_code"],
                "requires_hold_clear" => (bool) $r["requires_hold_clear"],
                "requires_docs" => (bool) $r["requires_docs"],
                "requires_financial_clearance" => (bool) $r["requires_financial_clearance"],
                "requires_authority_reference" => (bool) $r["requires_authority_reference"],
                "notifies" => (bool) $r["notifies"],
                "sort_order" => (int) $r["sort_order"]
            ];
        }
    }

    echo json_encode([
        "error" => false,
        "data" => true,
        "code" => [
            "shipment_types" => $shipment_types,
            "cargo_categories" => $cargo_categories,
            "packaging_types" => $packaging_types,
            "container_sizes" => $container_sizes,
            "hold_reasons" => $hold_reasons,
            "supporting_documents" => $shipment_documents,
            "upload_locations" => $upload_locations,
            "all_document_types" => $all_document_types,
            "document_config" => $document_config,
            "cargo_states" => $cargo_states,
            "cargo_transitions" => $cargo_transitions
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    

    echo json_encode([
        "error" => true,
        "data" => "Unable to load shipment configuration.",
        "code" => null
    ]);
}