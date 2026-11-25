
<?php
require_once __DIR__ . "/include/conn.php";

$shipmentId = "5d52a00b-8091-4764-af77-f4aa6d890e9f";

try {
    $check = $conn->prepare("
        SELECT id
        FROM portal_shipments
        WHERE id = :id
        LIMIT 1
    ");
    $check->execute([":id" => $shipmentId]);

    if (!$check->fetchColumn()) {
        throw new RuntimeException("Shipment not found.");
    }

    $update = $conn->prepare("
        UPDATE portal_shipments
        SET
            bill_of_lading = :bill_of_lading,
            booking_number = :booking_number,
            shipment_type = :shipment_type,
            shipping_line = :shipping_line,
            vessel_name = :vessel_name,
            voyage_number = :voyage_number,
            origin_country = :origin_country,
            origin_port = :origin_port,
            destination_port = :destination_port,
            expected_arrival = :expected_arrival,
            updated_at = NOW()
        WHERE id = :id
    ");

    $update->execute([
        ":bill_of_lading" => "MSCU2612047851",
        ":booking_number" => "MSCU-LAG-261204",
        ":shipment_type" => "Import",
        ":shipping_line" => "MSC Mediterranean Shipping Company",
        ":vessel_name" => "MSC LORENA",
        ":voyage_number" => "6E261N",
        ":origin_country" => "China",
        ":origin_port" => "Shanghai Port",
        ":destination_port" => "Apapa Port, Lagos",
        ":expected_arrival" => "2026-12-04",
        ":id" => $shipmentId
    ]);

    echo json_encode([
        "error" => false,
        "data" => "Shipment shipping and route details updated successfully.",
        "code" => $shipmentId
    ]);

} catch (Throwable $e) {
    echo json_encode([
        "error" => true,
        "data" => "Could not update shipment details.",
        "code" => $e->getMessage()
    ]);
}
