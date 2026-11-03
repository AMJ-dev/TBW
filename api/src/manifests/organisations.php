<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET' && ($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: GET, POST');
   
    echo json_encode(['error'=>true,'data'=>'Method not allowed.','code'=>null]);
    exit;
}
$q = trim((string)($_GET['q'] ?? $_POST['q'] ?? ''));
if (strlen($q) < 2) {
    echo json_encode(['error'=>false,'data'=>'Enter at least two characters.','code'=>[]]);
    exit;
}
try {
    $stmt = $conn->prepare("SELECT id,organisation_name AS name,rc_number,verification_status AS status FROM organisations WHERE organisation_type <> 'agent' AND (organisation_name LIKE :name OR rc_number LIKE :rc) ORDER BY CASE WHEN verification_status='verified' THEN 0 ELSE 1 END,organisation_name LIMIT 20");
    $like = '%'.$q.'%';
    $stmt->execute([':name'=>$like,':rc'=>$like]);
    echo json_encode(['error'=>false,'data'=>'Organisations loaded.','code'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Throwable $e) {
    
    echo json_encode(['error'=>true,'data'=>'Unable to load organisations.','code'=>null]);
}
