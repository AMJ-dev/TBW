<?php   
    require_once __DIR__."/include/conn.php";
    
    $q = $conn->prepare("SELECT id FROM portal_shipments");
    $q->execute();
    $shipments = $q->fetchAll(PDO::FETCH_ASSOC);

    foreach ($shipments as $shipment) {
        $id = $shipment['id'];
        $shipmentReference = "TRN-SHP-" . date("Y") . "-" . strtoupper(bin2hex(random_bytes(6)));
        $q = $conn->prepare("UPDATE portal_shipments SET shipment_reference = :shipment_reference WHERE id = :id");
        $q->execute([
            'shipment_reference' => $shipmentReference,
            'id' => $id
        ]);
    }