<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed.",
        "code" => null
    ]);
    exit;
}

$input = $_POST;

if (empty($input)) {
    $raw = file_get_contents("php://input");
    $decoded = json_decode($raw, true);

    if (is_array($decoded)) {
        $input = $decoded;
    }
}

$q = trim((string) ($input["q"] ?? ""));

if (strlen($q) < 3) {
    echo json_encode([
        "error" => false,
        "data" => "Enter at least 3 characters.",
        "code" => []
    ]);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT
            s.id,
            s.shipment_reference,
            s.shipment_type,
            s.bill_of_lading,
            s.booking_number,
            s.vessel_name,
            s.voyage_number,
            s.shipping_line,
            s.origin_country,
            s.origin_port,
            s.destination_port,
            s.expected_arrival,
            s.consignee AS consignee_name,
            s.consignee_email,
            s.consignee_phone,
            s.consignee_type,
            s.consignee_organisation_id,
            s.consignee_status,
            s.consignee_contact_person,
            s.consignee_address,
            s.consignee_country,
            s.licensed_agent_id,
            s.licensed_agent_name,
            s.cargo_description,
            s.cargo_category,
            s.package_type,
            s.package_count,
            s.gross_weight,
            s.volume,
            s.hs_code,
            s.dangerous_goods,
            s.temperature_controlled,
            s.temperature,
            s.special_instructions,
            s.customs_reference,
            s.status,
            s.created_at
        FROM portal_shipments s
        WHERE s.bill_of_lading LIKE :search
        ORDER BY
            CASE
                WHEN UPPER(s.bill_of_lading) = UPPER(:exact_q) THEN 0
                ELSE 1
            END,
            s.created_at DESC
        LIMIT 20
    ");

    $stmt->execute([
        ":search" => "%" . $q . "%",
        ":exact_q" => $q
    ]);

    $shipments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $containerStmt = $conn->prepare("
        SELECT
            id,
            shipment_id,
            container_no,
            size,
            seal_no,
            package_count,
            gross_weight,
            status,
            created_at,
            gate_in_at,
            received_at,
            stored_at,
            gate_out_at,
            updated_at
        FROM portal_shipment_containers
        WHERE shipment_id = :shipment_id
        ORDER BY created_at ASC
    ");

    foreach ($shipments as &$shipment) {
        $containerStmt->execute([
            ":shipment_id" => $shipment["id"]
        ]);

        $shipment["containers"] = $containerStmt->fetchAll(PDO::FETCH_ASSOC);
    }

    unset($shipment);

    echo json_encode([
        "error" => false,
        "data" => "Shipment search completed.",
        "code" => $shipments
    ]);

} catch (Throwable $e) {
    error_log("Shipment search error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Could not search for the shipment.",
        "code" => $e->getMessage()
    ]);
}