<?php
require_once __DIR__ . "/_bootstrap.php";
try {
    manifest_require_permission();
    if ($_SERVER["REQUEST_METHOD"] !== "GET") manifest_response(405, true, "Method not allowed.");
    $org = $conn->query("SELECT id, organisation_name AS name, rc_number AS rcNumber, verification_status AS status FROM organisations WHERE organisation_type = 'importer' AND verification_status = 'verified' ORDER BY organisation_name")->fetchAll(PDO::FETCH_ASSOC);
    $agents = $conn->query("SELECT id, organisation_name AS name, rc_number AS licenceNumber FROM organisations WHERE organisation_type = 'agent' AND verification_status = 'verified' ORDER BY organisation_name")->fetchAll(PDO::FETCH_ASSOC);
    manifest_response(200, false, "Manifest intake options loaded.", ["organisations" => $org, "agents" => $agents]);
} catch (Throwable $e) { manifest_log_exception($e); }
