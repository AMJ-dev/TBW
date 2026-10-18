<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed.",
        "code" => null
    ]);
    exit;
}

try {
    $userId = (string) ($my_details->id ?? "");

    if ($userId === "") {
        http_response_code(401);
        echo json_encode([
            "error" => true,
            "data" => "Authentication required.",
            "code" => null
        ]);
        exit;
    }

    $accountType = (string) ($my_details->account_type ?? "");
    $systemRoleId = (string) ($my_details->system_role_id ?? "");

    if ($accountType !== "system" || $systemRoleId === "") {
        http_response_code(403);
        echo json_encode([
            "error" => true,
            "data" => "You do not have permission to view shipments.",
            "code" => null
        ]);
        exit;
    }

    $permStmt = $conn->prepare("
        SELECT 1
        FROM role_permissions rp
        INNER JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.role_id = :role_id
          AND p.permission_key = :permission_key
        LIMIT 1
    ");
    $permStmt->execute([
        ":role_id" => $systemRoleId,
        ":permission_key" => "operations.view"
    ]);

    if (!$permStmt->fetchColumn()) {
        http_response_code(403);
        echo json_encode([
            "error" => true,
            "data" => "You do not have permission to view shipments.",
            "code" => null
        ]);
        exit;
    }

    $shipmentId = trim((string) ($_GET["id"] ?? ""));

    if ($shipmentId === "") {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Shipment id is required.",
            "code" => null
        ]);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT
            ps.id,
            ps.shipment_reference,
            ps.user_id,
            ps.organisation_id,
            COALESCE(
                NULLIF(o.trading_name, ''),
                o.organisation_name
            ) AS organisation_name,
            ps.shipment_type,
            ps.bill_of_lading,
            ps.booking_number,
            ps.vessel_name,
            ps.voyage_number,
            ps.shipping_line,
            ps.origin_country,
            ps.origin_port,
            ps.destination_port,
            ps.expected_arrival,
            ps.consignee,
            ps.consignee_email,
            ps.consignee_phone,
            ps.cargo_description,
            ps.cargo_category,
            ps.package_type,
            ps.package_count,
            ps.gross_weight,
            ps.volume,
            ps.hs_code,
            ps.dangerous_goods,
            ps.temperature_controlled,
            ps.temperature,
            ps.special_instructions,
            ps.customs_reference,
            ps.status,
            ps.created_at,
            ps.updated_at
        FROM portal_shipments ps
        LEFT JOIN organisations o ON o.id = ps.organisation_id
        WHERE ps.id = :id
        LIMIT 1
    ");
    $stmt->execute([":id" => $shipmentId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode([
            "error" => true,
            "data" => "Shipment not found.",
            "code" => null
        ]);
        exit;
    }

    $containerStmt = $conn->prepare("
        SELECT id, container_no, size, seal_no, package_count, gross_weight
        FROM portal_shipment_containers
        WHERE shipment_id = :shipment_id
        ORDER BY created_at ASC
    ");
    $containerStmt->execute([":shipment_id" => $shipmentId]);

    $containers = [];

    foreach ($containerStmt->fetchAll(PDO::FETCH_ASSOC) as $c) {
        $containers[] = [
            "id" => (string) $c["id"],
            "container_no" => (string) $c["container_no"],
            "size" => $c["size"],
            "seal_no" => $c["seal_no"],
            "package_count" => $c["package_count"] !== null
                ? (float) $c["package_count"]
                : null,
            "gross_weight" => $c["gross_weight"] !== null
                ? (float) $c["gross_weight"]
                : null
        ];
    }

    $documentStmt = $conn->prepare("
        SELECT
            id,
            document_type,
            original_name,
            file_path,
            mime_type,
            file_size,
            uploaded_at
        FROM portal_shipment_documents
        WHERE shipment_id = :shipment_id
        ORDER BY uploaded_at ASC
    ");
    $documentStmt->execute([":shipment_id" => $shipmentId]);

    $documents = [];

    foreach ($documentStmt->fetchAll(PDO::FETCH_ASSOC) as $d) {
        $documents[] = [
            "id" => (string) $d["id"],
            "document_type" => (string) $d["document_type"],
            "original_name" => (string) $d["original_name"],
            "file_path" => $d["file_path"],
            "mime_type" => $d["mime_type"],
            "file_size" => (int) $d["file_size"],
            "uploaded_at" => (string) $d["uploaded_at"]
        ];
    }

    $shipment = [
        "id" => (string) $row["id"],
        "shipment_reference" => $row["shipment_reference"],
        "user_id" => (string) $row["user_id"],
        "organisation_id" => $row["organisation_id"],
        "organisation_name" => $row["organisation_name"],
        "shipment_type" => (string) $row["shipment_type"],
        "bill_of_lading" => $row["bill_of_lading"],
        "booking_number" => $row["booking_number"],
        "vessel_name" => $row["vessel_name"],
        "voyage_number" => $row["voyage_number"],
        "shipping_line" => $row["shipping_line"],
        "origin_country" => $row["origin_country"],
        "origin_port" => $row["origin_port"],
        "destination_port" => $row["destination_port"],
        "expected_arrival" => $row["expected_arrival"],
        "consignee" => $row["consignee"],
        "consignee_email" => $row["consignee_email"],
        "consignee_phone" => $row["consignee_phone"],
        "cargo_description" => $row["cargo_description"],
        "cargo_category" => (string) $row["cargo_category"],
        "package_type" => (string) $row["package_type"],
        "package_count" => $row["package_count"] !== null
            ? (float) $row["package_count"]
            : null,
        "gross_weight" => $row["gross_weight"] !== null
            ? (float) $row["gross_weight"]
            : null,
        "volume" => $row["volume"] !== null
            ? (float) $row["volume"]
            : null,
        "hs_code" => $row["hs_code"],
        "dangerous_goods" => (string) $row["dangerous_goods"],
        "temperature_controlled" => (string) $row["temperature_controlled"],
        "temperature" => $row["temperature"],
        "special_instructions" => $row["special_instructions"],
        "customs_reference" => $row["customs_reference"],
        "status" => (string) $row["status"],
        "created_at" => (string) $row["created_at"],
        "updated_at" => (string) $row["updated_at"],
        "containers" => $containers,
        "documents" => $documents
    ];

    $manifestStmt = $conn->prepare("
        SELECT DISTINCT om.*
        FROM operation_manifests om
        LEFT JOIN operation_manifest_shipment_matches osm
            ON osm.manifest_id = om.id
        WHERE om.matched_shipment_id = :direct_shipment_id
           OR osm.shipment_id = :matched_shipment_id
        ORDER BY om.updated_at DESC
    ");
    $manifestStmt->execute([
        ":direct_shipment_id" => $shipmentId,
        ":matched_shipment_id" => $shipmentId
    ]);

    $manifestRows = $manifestStmt->fetchAll(PDO::FETCH_ASSOC);
    $manifests = [];
    $manifestIds = [];

    foreach ($manifestRows as $manifestRow) {
        $manifestId = (string) $manifestRow["id"];
        $manifestIds[] = $manifestId;

        $manifest = $manifestRow;
        $manifest["id"] = $manifestId;
        $manifest["matched_shipment_id"] =
            $manifestRow["matched_shipment_id"] ?? null;

        $manifest["containers"] = [];
        $manifest["matches"] = [];
        $manifest["events"] = [];

        $manifests[$manifestId] = $manifest;
    }

    $manifestMatches = [];
    $manifestContainers = [];
    $manifestEvents = [];

    if ($manifestIds) {
        $placeholders = implode(
            ", ",
            array_fill(0, count($manifestIds), "?")
        );

        $matchStmt = $conn->prepare("
            SELECT
                osm.*,
                u.full_name AS matched_by_name,
                confirmer.full_name AS confirmed_by_name
            FROM operation_manifest_shipment_matches osm
            LEFT JOIN users u ON u.id = osm.matched_by
            LEFT JOIN users confirmer ON confirmer.id = osm.confirmed_by
            WHERE osm.manifest_id IN ($placeholders)
            ORDER BY osm.matched_at DESC
        ");
        $matchStmt->execute($manifestIds);
        $manifestMatches = $matchStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($manifestMatches as $match) {
            $manifestId = (string) $match["manifest_id"];

            if (isset($manifests[$manifestId])) {
                $manifests[$manifestId]["matches"][] = $match;
            }
        }

        $manifestContainerStmt = $conn->prepare("
            SELECT *
            FROM operation_manifest_containers
            WHERE manifest_id IN ($placeholders)
            ORDER BY manifest_id ASC, container_no ASC
        ");
        $manifestContainerStmt->execute($manifestIds);
        $manifestContainers = $manifestContainerStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($manifestContainers as $container) {
            $manifestId = (string) $container["manifest_id"];

            if (isset($manifests[$manifestId])) {
                $manifests[$manifestId]["containers"][] = $container;
            }
        }

        $eventStmt = $conn->prepare("
            SELECT
                e.id,
                e.manifest_id,
                e.actor_id,
                u.full_name AS actor_name,
                e.action,
                e.from_status,
                e.to_status,
                e.details,
                e.created_at
            FROM operation_manifest_events e
            LEFT JOIN users u ON u.id = e.actor_id
            WHERE e.manifest_id IN ($placeholders)
            ORDER BY e.created_at DESC
        ");
        $eventStmt->execute($manifestIds);
        $manifestEvents = $eventStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($manifestEvents as $event) {
            $manifestId = (string) $event["manifest_id"];

            if (isset($manifests[$manifestId])) {
                $manifests[$manifestId]["events"][] = $event;
            }
        }
    }

    $reviewStmt = $conn->prepare("
        SELECT
            sdr.id,
            sdr.shipment_id,
            sdr.reviewer_id,
            reviewer.full_name AS reviewer_name,
            reviewer.email AS reviewer_email,
            reviewer.phone AS reviewer_phone,
            reviewer.pics AS reviewer_pics,
            sdr.decision,
            sdr.from_status,
            sdr.to_status,
            sdr.reason,
            sdr.created_at
        FROM shipment_declaration_reviews sdr
        LEFT JOIN users reviewer ON reviewer.id = sdr.reviewer_id
        WHERE sdr.shipment_id = :shipment_id
        ORDER BY sdr.created_at DESC
    ");
    $reviewStmt->execute([":shipment_id" => $shipmentId]);

    $reviews = [];

    foreach ($reviewStmt->fetchAll(PDO::FETCH_ASSOC) as $review) {
        $reviews[] = [
            "id" => (string) $review["id"],
            "shipment_id" => (string) $review["shipment_id"],
            "reviewer_id" => (string) $review["reviewer_id"],
            "reviewer" => [
                "id" => (string) $review["reviewer_id"],
                "full_name" => $review["reviewer_name"],
                "email" => $review["reviewer_email"],
                "phone" => $review["reviewer_phone"],
                "pics" => $review["reviewer_pics"]
            ],
            "decision" => (string) $review["decision"],
            "from_status" => $review["from_status"],
            "to_status" => $review["to_status"],
            "reason" => $review["reason"],
            "created_at" => (string) $review["created_at"]
        ];
    }

    $logs = [];

    foreach ($reviews as $review) {
        $logs[] = [
            "id" => $review["id"],
            "type" => "declaration_review",
            "title" => "Declaration " . str_replace("_", " ", $review["decision"]),
            "actor_id" => $review["reviewer_id"],
            "actor_name" => $review["reviewer"]["full_name"],
            "from_status" => $review["from_status"],
            "to_status" => $review["to_status"],
            "details" => $review["reason"],
            "created_at" => $review["created_at"]
        ];
    }

    foreach ($manifestEvents as $event) {
        $logs[] = [
            "id" => (string) $event["id"],
            "type" => "manifest",
            "manifest_id" => (string) $event["manifest_id"],
            "title" => (string) $event["action"],
            "actor_id" => $event["actor_id"],
            "actor_name" => $event["actor_name"],
            "from_status" => $event["from_status"],
            "to_status" => $event["to_status"],
            "details" => $event["details"],
            "created_at" => (string) $event["created_at"]
        ];
    }

    usort($logs, function ($a, $b) {
        return strcmp($b["created_at"], $a["created_at"]);
    });

    $latestReview = $reviews[0] ?? null;

    echo json_encode([
        "error" => false,
        "data" => "Shipment loaded.",
        "code" => [
            "shipment" => $shipment,
            "manifests" => array_values($manifests),
            "manifest_matches" => $manifestMatches,
            "manifest_containers" => $manifestContainers,
            "manifest_events" => $manifestEvents,
            "reviews" => $reviews,
            "latest_review" => $latestReview,
            "latest_review_reason" => $latestReview["reason"] ?? null,
            "logs" => $logs
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "data" => "Could not load shipment.",
        "code" => $e->getMessage()
    ]);
}