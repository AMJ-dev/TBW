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
    $reason = trim((string)($_POST['reason'] ?? 'Flagged for operations review.'));
    if ($reason === '') $reason = 'Flagged for operations review.';
    try {
        $conn->beginTransaction();
        $get = $conn->prepare('SELECT status FROM operation_manifests WHERE id=? FOR UPDATE');
        $get->execute([$id]);
        $status = $get->fetchColumn();
        if ($status === false) {
            $conn->rollBack();
            http_response_code(404);
            echo json_encode(['error'=>true,'data'=>'Manifest not found.','code'=>null]);
            exit;
        }
        if (in_array($status, ['Duplicate','Discrepancy'], true)) {
            $conn->rollBack();
            http_response_code(409);
            echo json_encode(['error'=>true,'data'=>'Manifest is already flagged.','code'=>null]);
            exit;
        }
        $up = $conn->prepare("UPDATE operation_manifests SET status='Discrepancy', notes=CONCAT_WS('\n',NULLIF(notes,''),:reason) WHERE id=:id");
        $up->execute([':reason'=>$reason,':id'=>$id]);
        $event = $conn->prepare("INSERT INTO operation_manifest_events (id,manifest_id,actor_id,action,from_status,to_status,details) VALUES (:event_id,:id,:actor,'FLAGGED',:old,'Discrepancy',:reason)");
        $event->execute([':event_id'=>generateId(),':id'=>$id,':actor'=>(string)$my_details->id,':old'=>$status,':reason'=>$reason]);
        $conn->commit();
        echo json_encode(['error'=>false,'data'=>'Manifest flagged for review.','code'=>['id'=>$id,'status'=>'Discrepancy']]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) $conn->rollBack();
        http_response_code(500);
        echo json_encode(['error'=>true,'data'=>'Unable to flag manifest.','code'=>null]);
    }
