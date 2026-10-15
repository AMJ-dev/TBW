<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $q = trim($_POST['q']);
    if (strlen($q) < 2) {
        echo json_encode(['error'=>false,'data'=>'Enter at least two characters.','code'=>[]]);
        exit;
    }
    try {
        $stmt = $conn->prepare("SELECT s.id, s.shipment_reference, s.bill_of_lading, s.booking_number, s.vessel_name, s.shipping_line, s.consignee, s.status, s.created_at, o.organisation_name FROM portal_shipments s LEFT JOIN organisations o ON o.id=s.organisation_id WHERE s.shipment_reference LIKE :ref OR s.bill_of_lading LIKE :bl OR s.booking_number LIKE :booking OR s.consignee LIKE :consignee ORDER BY CASE WHEN s.bill_of_lading=:exact_bl THEN 0 WHEN s.shipment_reference=:exact_ref THEN 1 ELSE 2 END, s.created_at DESC LIMIT 20");
        $like = '%'.$q.'%';
        $stmt->execute([':ref'=>$like,':bl'=>$like,':booking'=>$like,':consignee'=>$like,':exact_bl'=>$q,':exact_ref'=>$q]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if ($rows) {
            $ids = array_column($rows, 'id');
            $containerQuery = $conn->prepare('SELECT shipment_id, container_no, size, seal_no, package_count, gross_weight FROM portal_shipment_containers WHERE shipment_id IN ('.implode(',', array_fill(0,count($ids),'?')).') ORDER BY container_no');
            $containerQuery->execute($ids);
            $byShipment = [];
            foreach ($containerQuery->fetchAll(PDO::FETCH_ASSOC) as $container) $byShipment[$container['shipment_id']][] = $container;
            foreach ($rows as &$row) $row['containers'] = $byShipment[$row['id']] ?? [];
            unset($row);
        }
        echo json_encode(['error'=>false,'data'=>'Shipment declarations loaded.','code'=>$rows]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error'=>true,'data'=>'Unable to search shipment declarations.','code'=>null]);
    }
