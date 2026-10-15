<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";
    
    if (($my_details->account_type ?? '') !== 'system' || empty($my_details->id)) {
        http_response_code(403);
        echo json_encode(['error'=>true,'data'=>'Access denied.','code'=>null]);
        exit;
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        http_response_code(405);
        echo json_encode(['error'=>true,'data'=>'Method not allowed.','code'=>null]);
        exit;
    }
    $id = trim((string)($_GET['id'] ?? ''));
    if (!preg_match('/^[a-f0-9-]{36}$/i', $id)) {
        http_response_code(422);
        echo json_encode(['error'=>true,'data'=>'Invalid manifest ID.','code'=>null]);
        exit;
    }
    try {
        $conn->beginTransaction();
        $get = $conn->prepare('SELECT * FROM operation_manifests WHERE id = ? FOR UPDATE');
        $get->execute([$id]);
        $m = $get->fetch(PDO::FETCH_ASSOC);
        if (!$m) {
            $conn->rollBack();
            http_response_code(404);
            echo json_encode(['error'=>true,'data'=>'Manifest not found.','code'=>null]);
            exit;
        }
        if ($m['status'] !== 'Pre-advice') {
            $conn->rollBack();
            http_response_code(409);
            echo json_encode(['error'=>true,'data'=>'Only Pre-advice manifests can be validated.','code'=>null]);
            exit;
        }
        $dup = $conn->prepare('SELECT id FROM operation_manifests WHERE id <> :id AND (manifest_ref = :ref OR bill_of_lading = :bl) LIMIT 1');
        $dup->execute([':id'=>$id,':ref'=>$m['manifest_ref'],':bl'=>$m['bill_of_lading']]);
        if ($dup->fetchColumn()) {
            $conn->rollBack();
            http_response_code(409);
            echo json_encode(['error'=>true,'data'=>'Duplicate manifest reference or bill of lading found.','code'=>null]);
            exit;
        }
        if (trim((string)$m['vessel']) === '' || trim((string)$m['shipping_line']) === '' || trim((string)$m['origin_port']) === '' || trim((string)$m['eta']) === '') {
            $conn->rollBack();
            http_response_code(422);
            echo json_encode(['error'=>true,'data'=>'Vessel, shipping line, origin port and ETA are required for validation.','code'=>null]);
            exit;
        }
        $match = $conn->prepare('SELECT id FROM portal_shipments WHERE bill_of_lading = :bl ORDER BY created_at DESC LIMIT 1');
        $match->execute([':bl'=>$m['bill_of_lading']]);
        $shipmentId = $match->fetchColumn() ?: null;
        $up = $conn->prepare("UPDATE operation_manifests SET status='Validated', validated_by=:actor, validated_at=NOW(), matched_shipment_id=:shipment WHERE id=:id");
        $up->execute([':actor'=>(string)$my_details->id,':shipment'=>$shipmentId,':id'=>$id]);
        $event = $conn->prepare("INSERT INTO operation_manifest_events (id,manifest_id,actor_id,action,from_status,to_status,details) VALUES (:event_id,:id,:actor,'VALIDATED','Pre-advice','Validated',:details)");
        $event->execute([':event_id'=>generateId(),':id'=>$id,':actor'=>(string)$my_details->id,':details'=>$shipmentId ? 'Matched shipment '.$shipmentId : 'No shipment declaration match yet']);
        $conn->commit();
        echo json_encode(['error'=>false,'data'=>'Manifest validated.','code'=>['id'=>$id,'status'=>'Validated','matched_shipment_id'=>$shipmentId]]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) $conn->rollBack();
        http_response_code(500);
        echo json_encode(['error'=>true,'data'=>'Unable to validate manifest.','code'=>null]);
    }
