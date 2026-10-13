
<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Cache-Control: no-store, private");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    header("Allow: GET");

    echo json_encode([
        "error" => true,
        "data" => "Method not allowed.",
        "code" => null
    ]);
    exit;
}

try {
    $q = $conn->prepare("
        SELECT
            s.id,
            s.shipment_reference,
            s.organisation_id,
            o.organisation_name,
            o.trading_name,
            s.cargo_description,
            s.shipment_type,
            s.expected_arrival,
            s.created_at,
            s.status
        FROM portal_shipments s
        LEFT JOIN organisations o
            ON o.id = s.organisation_id
        WHERE s.status = :status
        ORDER BY s.created_at ASC
    ");

    $q->execute([
        ":status" => "pending_review"
    ]);

    $shipments = $q->fetchAll(PDO::FETCH_ASSOC);

    foreach ($shipments as &$shipment) {
        $shipment["organisation_name"] =
            $shipment["trading_name"] ?: $shipment["organisation_name"];

        unset($shipment["trading_name"]);
    }
    unset($shipment);

    echo json_encode([
        "error" => false,
        "data" => "Shipment declarations loaded successfully.",
        "code" => $shipments
    ]);
} catch (Throwable $e) {
    error_log("Shipment declaration review error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Could not load shipment declarations.",
        "code" => null
    ]);
}
