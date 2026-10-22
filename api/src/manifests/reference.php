<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $orgs = $conn->query("SELECT id, organisation_name AS name, rc_number, verification_status AS status FROM organisations WHERE organisation_type <> 'agent' ORDER BY CASE WHEN verification_status='verified' THEN 0 ELSE 1 END, organisation_name LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);
        $agents = $conn->query("SELECT id, organisation_name AS name, COALESCE(rc_number,'') AS licence_number, contact_email, contact_phone, verification_status AS status FROM organisations WHERE organisation_type='agent' ORDER BY CASE WHEN verification_status='verified' THEN 0 ELSE 1 END, organisation_name LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['error'=>false,'data'=>'Reference data loaded.','code'=>['organisations'=>$orgs,'agents'=>$agents]]);
    } catch (Throwable $e) {
        
        echo json_encode(['error'=>true,'data'=>'Unable to load reference data.','code'=>null]);
    }
