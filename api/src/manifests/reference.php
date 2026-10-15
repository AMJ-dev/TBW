<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";
    
    if (($my_details->account_type ?? '') !== 'system' || empty($my_details->id)) {
        http_response_code(403);
        echo json_encode(['error'=>true,'data'=>'Access denied.','code'=>null]);
        exit;
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
        http_response_code(405);
        echo json_encode(['error'=>true,'data'=>'Method not allowed.','code'=>null]);
        exit;
    }
    try {
        $orgs = $conn->query("SELECT id, organisation_name AS name, rc_number, verification_status AS status FROM organisations WHERE organisation_type <> 'agent' ORDER BY organisation_name LIMIT 2000")->fetchAll(PDO::FETCH_ASSOC);
        $agents = $conn->query("SELECT id, organisation_name AS name, COALESCE(rc_number,'') AS licence_number, contact_email, contact_phone FROM organisations WHERE organisation_type = 'agent' ORDER BY organisation_name LIMIT 2000")->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['error'=>false,'data'=>'Reference data loaded.','code'=>['organisations'=>$orgs,'agents'=>$agents]]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error'=>true,'data'=>'Unable to load reference data.','code'=>null]);
    }
