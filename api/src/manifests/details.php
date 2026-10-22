<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=UTF-8");

if (($my_details->account_type ?? '') !== 'system' || empty($my_details->id)) {
    echo json_encode(["error" => true, "data" => "Access denied.", "code" => null]);
    exit;
}

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "GET") {
    header("Allow: GET");
    echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
    exit;
}

$id = trim((string) ($_GET["id"] ?? ""));

if ($id === "") {
    $path = parse_url((string) ($_SERVER["REQUEST_URI"] ?? ""), PHP_URL_PATH);
    if (is_string($path) && preg_match('~/operations/manifests/details/([^/]+)/?$~', $path, $matches)) {
        $id = rawurldecode($matches[1]);
    }
}

if ($id === "") {
    echo json_encode(["error" => true, "data" => "Manifest ID is required.", "code" => null]);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT
            m.id,
            m.organisation_id,
            m.manifest_ref,
            m.bill_of_lading,
            m.vessel,
            m.shipping_line,
            m.origin_port,
            m.eta,
            m.containers,
            m.packages,
            m.gross_weight,
            m.consignee,
            m.consignee_organisation_id,
            m.consignee_status,
            m.consignee_email,
            m.consignee_phone,
            m.consignee_address,
            m.agent,
            m.agent_organisation_id,
            m.source,
            m.status,
            m.received_at,
            m.notes,
            m.matched_shipment_id,
            ps.id AS linked_shipment_exists_id,
            ps.shipment_reference,
            ps.status AS shipment_status,
            ps.organisation_id AS shipment_organisation_id
        FROM operation_manifests m
        LEFT JOIN portal_shipments ps
            ON ps.id = m.matched_shipment_id
        WHERE m.id = :id
        LIMIT 1
    ");

    $stmt->execute([":id" => $id]);
    $manifest = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$manifest) {
        echo json_encode(["error" => true, "data" => "Manifest not found.", "code" => null]);
        exit;
    }

    $matchedShipmentId = trim((string) ($manifest["matched_shipment_id"] ?? ""));
    $shipmentReference = trim((string) ($manifest["shipment_reference"] ?? ""));
    $isLinked = trim((string) ($manifest["linked_shipment_exists_id"] ?? "")) !== "";

    $manifest["shipment_reference"] = $shipmentReference;
    $manifest["matched_shipment_id"] = $matchedShipmentId !== "" ? $matchedShipmentId : null;
    $manifest["shipment_status"] = $manifest["shipment_status"] ?? null;
    unset($manifest["linked_shipment_exists_id"]);
    $manifest["shipment_linked"] = $isLinked;
    $manifest["shipment_link_status"] = $isLinked ? "linked" : "unmatched";
    $manifest["shipment_link_message"] = $isLinked
        ? "A shipment declaration is linked to this manifest."
        : "No organisation shipment declaration is linked to this manifest yet. The organisation may not have submitted its declaration, or the records may not have been matched. You can link the declaration when it becomes available.";

    echo json_encode([
        "error" => false,
        "data" => "Manifest loaded successfully.",
        "code" => ["manifest" => $manifest]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    echo json_encode([
        "error" => true,
        "data" => "Could not load this manifest.",
        "code" => null
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
