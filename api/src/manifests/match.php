<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $manifestId = trim($_POST['manifest_id']);
    $shipmentId = trim($_POST['shipment_id']);
    $reason = trim($_POST['reason']);

    try {
        $conn->beginTransaction();
        $mQuery = $conn->prepare('SELECT id, bill_of_lading, status FROM operation_manifests WHERE id=? FOR UPDATE');
        $mQuery->execute([$manifestId]);
        $manifest = $mQuery->fetch(PDO::FETCH_ASSOC);
        if (!$manifest) {
            $conn->rollBack();
            http_response_code(404);
            echo json_encode(['error'=>true,'data'=>'Manifest not found.','code'=>null]);
            exit;
        }
        if (in_array($manifest['status'], ['Duplicate','Discrepancy'], true)) {
            $conn->rollBack();
            http_response_code(409);
            echo json_encode(['error'=>true,'data'=>'Resolve the manifest discrepancy before linking a shipment.','code'=>null]);
            exit;
        }
        $sQuery = $conn->prepare('SELECT id, shipment_reference, bill_of_lading FROM portal_shipments WHERE id=? FOR UPDATE');
        $sQuery->execute([$shipmentId]);
        $shipment = $sQuery->fetch(PDO::FETCH_ASSOC);
        if (!$shipment) {
            $conn->rollBack();
            http_response_code(404);
            echo json_encode(['error'=>true,'data'=>'Shipment declaration not found.','code'=>null]);
            exit;
        }
        if (strcasecmp(trim((string)$manifest['bill_of_lading']), trim((string)$shipment['bill_of_lading'])) !== 0) {
            $reason = trim((string)($_POST['reason'] ?? ''));
            if ($reason === '') {
                $conn->rollBack();
                http_response_code(422);
                echo json_encode(['error'=>true,'data'=>'Bill of lading does not match. Provide a reason to confirm a manual exception.','code'=>null]);
                exit;
            }
        }
        $link = $conn->prepare('
            INSERT INTO operation_manifest_shipment_matches
                (id, manifest_id, shipment_id, match_method, matched_by, confirmed_by, notes)
            VALUES
                (:id, :manifest, :shipment, :method, :matched_by, :confirmed_by, :notes)
            ON DUPLICATE KEY UPDATE
                match_method = VALUES(match_method),
                matched_by = VALUES(matched_by),
                confirmed_by = VALUES(confirmed_by),
                notes = VALUES(notes),
                matched_at = CURRENT_TIMESTAMP
        ');

        $reason = trim((string)($_POST['reason'] ?? ''));
        $actorId = (string)$my_details->id;

        $link->execute([
            ':id' => generateId(),
            ':manifest' => $manifestId,
            ':shipment' => $shipmentId,
            ':method' => strcasecmp(
                trim((string)$manifest['bill_of_lading']),
                trim((string)$shipment['bill_of_lading'])
            ) === 0 ? 'BILL_OF_LADING_CONFIRMED' : 'MANUAL_EXCEPTION',
            ':matched_by' => $actorId,
            ':confirmed_by' => $actorId,
            ':notes' => $reason !== '' ? $reason : null
        ]);
        $up = $conn->prepare('UPDATE operation_manifests SET matched_shipment_id=? WHERE id=?');
        $up->execute([$shipmentId,$manifestId]);
        $containerMatch = $conn->prepare('UPDATE operation_manifest_containers mc INNER JOIN portal_shipment_containers sc ON UPPER(TRIM(sc.container_no))=UPPER(TRIM(mc.container_no)) AND sc.shipment_id=? SET mc.matched_shipment_id=?, mc.matched_shipment_container_id=sc.id WHERE mc.manifest_id=?');
        $containerMatch->execute([$shipmentId,$shipmentId,$manifestId]);
        $details = 'Linked shipment '.$shipment['shipment_reference'].($reason !== '' ? '. Operator note: '.$reason : '.');
        $event = $conn->prepare('INSERT INTO operation_manifest_events (id,manifest_id,actor_id,action,from_status,to_status,details) VALUES (?,?,?,?,?,?,?)');
        $event->execute([generateId(),$manifestId,(string)$my_details->id,'SHIPMENT_LINKED',$manifest['status'],$manifest['status'],$details]);
        $conn->commit();
        echo json_encode(['error'=>false,'data'=>'Shipment linked to manifest.','code'=>['manifest_id'=>$manifestId,'shipment_id'=>$shipmentId,'shipment_reference'=>$shipment['shipment_reference']]]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) $conn->rollBack();
        http_response_code(500);
        echo json_encode(['error'=>true,'data'=>'Unable to link shipment to manifest.','code'=>$e->getMessage()]);
    }
