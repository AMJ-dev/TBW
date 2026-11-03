<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $rows = $conn->query('SELECT manifest_ref,bill_of_lading,vessel,shipping_line,origin_port,eta,containers,packages,gross_weight,consignee,agent,source,status,notes,received_at,matched_shipment_id FROM operation_manifests ORDER BY received_at DESC')->fetchAll(PDO::FETCH_ASSOC);
        $stream = fopen('php://temp', 'w+');
        fputcsv($stream, ['Manifest Reference','Bill of Lading','Vessel','Shipping Line','Origin Port','ETA','Containers','Packages','Gross Weight','Consignee','Agent','Source','Status','Notes','Received At','Matched Shipment ID']);
        foreach ($rows as $row) {
            foreach ($row as $key=>$value) {
                $value = (string)($value ?? '');
                if (preg_match('/^[\s]*[=+@\-]/u', $value)) $value = "'".$value;
                $row[$key] = $value;
            }
            fputcsv($stream, array_values($row));
        }
        rewind($stream);
        $csv = stream_get_contents($stream);
        fclose($stream);
        echo json_encode(['error'=>false,'data'=>'Export generated.','code'=>$csv]);
    } catch (Throwable $e) {
        
        echo json_encode(['error'=>true,'data'=>'Unable to export manifests.','code'=>null]);
    }
