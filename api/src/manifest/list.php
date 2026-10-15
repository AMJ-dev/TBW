<?php
require_once __DIR__ . "/_bootstrap.php";
try {
    manifest_require_permission();
    if ($_SERVER["REQUEST_METHOD"] !== "GET") manifest_response(405, true, "Method not allowed.");
    $page = max(1, (int)($_GET["page"] ?? 1));
    $limit = min(100, max(1, (int)($_GET["limit"] ?? 25)));
    $offset = ($page - 1) * $limit;
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
    if ($status !== "" && in_array($status, $allowed, true)) {
        $where[] = "status = :status";
        $params[":status"] = $status;
    }
    $clause = $where ? " WHERE " . implode(" AND ", $where) : "";
    $count = $conn->prepare("SELECT COUNT(*) FROM manifest_intakes" . $clause);
    $count->execute($params);
    $total = (int)$count->fetchColumn();
    $sql = "SELECT id, manifest_reference AS manifestRef, bill_of_lading AS bl, vessel_name AS vessel, shipping_line AS shippingLine, origin_port AS originPort, expected_arrival AS eta, container_count AS containers, package_count AS packages, gross_weight AS grossWeight, consignee_name AS consignee, agent_name AS agent, intake_source AS source, status, created_at AS receivedAt, notes, duplicate_of AS duplicateOf FROM manifest_intakes" . $clause . " ORDER BY created_at DESC LIMIT " . $limit . " OFFSET " . $offset;
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$row) {
        $row["containers"] = (int)$row["containers"];
        $row["packages"] = (int)$row["packages"];
        $row["grossWeight"] = $row["grossWeight"] === null ? "" : (string)$row["grossWeight"];
        $row["eta"] = $row["eta"] ?? "";
        $row["vessel"] = $row["vessel"] ?? "";
        $row["shippingLine"] = $row["shippingLine"] ?? "";
        $row["originPort"] = $row["originPort"] ?? "";
        $row["agent"] = $row["agent"] ?? "";
        $row["notes"] = $row["notes"] ?? "";
        $row["duplicateOf"] = $row["duplicateOf"] ?? null;
    }
    manifest_response(200, false, "Manifest intake records loaded.", ["items" => $rows, "pagination" => ["page" => $page, "limit" => $limit, "total" => $total, "pages" => (int)ceil($total / $limit)]]);
} catch (Throwable $e) { manifest_log_exception($e); }
