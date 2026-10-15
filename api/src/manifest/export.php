<?php
require_once __DIR__ . "/_bootstrap.php";
try {
    manifest_require_permission();
    if ($_SERVER["REQUEST_METHOD"] !== "GET") manifest_response(405, true, "Method not allowed.");
    $search = trim((string)($_GET["q"] ?? ""));
    $status = trim((string)($_GET["status"] ?? ""));
    $allowed = ["Pre-advice", "Validated", "Received", "Discrepancy", "Duplicate"];
    $where = [];
    $params = [];
    if ($search !== "") {
        $where[] = "(manifest_reference LIKE :q1 OR bill_of_lading LIKE :q2 OR vessel_name LIKE :q3 OR consignee_name LIKE :q4 OR agent_name LIKE :q5)";
        $like = "%" . $search . "%";
        for ($i = 1; $i <= 5; $i++) $params[":q$i"] = $like;
    }
    if (in_array($status, $allowed, true)) { $where[] = "status = :status"; $params[":status"] = $status; }
    $sql = "SELECT manifest_reference, bill_of_lading, vessel_name, shipping_line, origin_port, expected_arrival, container_count, package_count, gross_weight, consignee_name, agent_name, intake_source, status, notes, created_at FROM manifest_intakes" . ($where ? " WHERE " . implode(" AND ", $where) : "") . " ORDER BY created_at DESC LIMIT 10000";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    header_remove("Content-Type");
    header("Content-Type: text/csv; charset=utf-8");
    header("Content-Disposition: attachment; filename=trinu-manifest-intake-" . date("Ymd-His") . ".csv");
    header("X-Content-Type-Options: nosniff");
    $out = fopen("php://output", "w");
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, ["Manifest reference","Bill of lading","Vessel","Shipping line","Origin port","Expected arrival","Containers","Packages","Gross weight","Consignee","Licensed agent","Source","Status","Notes","Received at"]);
    while ($r = $stmt->fetch(PDO::FETCH_NUM)) {
        foreach ($r as &$value) {
            $value = (string)($value ?? "");
            if (preg_match('/^[=+@\-\t\r]/', $value)) $value = "'" . $value;
        }
        unset($value);
        fputcsv($out, $r);
    }
    fclose($out);
    exit;
} catch (Throwable $e) { manifest_log_exception($e); }
