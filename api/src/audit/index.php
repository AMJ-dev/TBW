<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        if ($_SERVER["REQUEST_METHOD"] !== "POST") {
            http_response_code(405);
            echo json_encode([
                "error" => true,
                "data" => "Method not allowed.",
                "code" => 405
            ]);
            exit;
        }

        $page = max(1, (int) ($_POST["page"] ?? 1));
        $limit = (int) ($_POST["limit"] ?? 20);
        $limit = max(1, min($limit, 100));
        $offset = ($page - 1) * $limit;

        $search = trim($_POST["search"] ?? "");
        $category = trim($_POST["category"] ?? "");
        $severity = strtoupper(trim($_POST["severity"] ?? ""));

        $allowedSeverities = ["INFO", "WARNING", "ERROR", "CRITICAL"];

        if ($severity !== "" && !in_array($severity, $allowedSeverities, true)) {
            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "Invalid severity filter.",
                "code" => 400
            ]);
            exit;
        }

        $where = [];
        $params = [];

        if ($search !== "") {
            $where[] = "(
                u.full_name LIKE :search_actor
                OR a.action LIKE :search_action
                OR a.category LIKE :search_category
                OR a.entity_type LIKE :search_entity_type
                OR a.entity_id LIKE :search_entity_id
                OR a.entity_reference LIKE :search_reference
                OR a.description LIKE :search_description
                OR a.reason LIKE :search_reason
                OR a.ip_address LIKE :search_ip
            )";

            $searchValue = "%" . $search . "%";

            $params[":search_actor"] = $searchValue;
            $params[":search_action"] = $searchValue;
            $params[":search_category"] = $searchValue;
            $params[":search_entity_type"] = $searchValue;
            $params[":search_entity_id"] = $searchValue;
            $params[":search_reference"] = $searchValue;
            $params[":search_description"] = $searchValue;
            $params[":search_reason"] = $searchValue;
            $params[":search_ip"] = $searchValue;
        }

        if ($category !== "") {
            $where[] = "a.category = :category";
            $params[":category"] = $category;
        }

        $summaryWhere = $where;
        $summaryParams = $params;

        if ($severity !== "") {
            $where[] = "a.severity = :severity";
            $params[":severity"] = $severity;
        }

        $whereSql = $where
            ? "WHERE " . implode(" AND ", $where)
            : "";

        $summaryWhereSql = $summaryWhere
            ? "WHERE " . implode(" AND ", $summaryWhere)
            : "";

        $countStmt = $conn->prepare("
            SELECT COUNT(*)
            FROM activity_logs a
            LEFT JOIN users u ON u.id = a.actor_id
            $whereSql
        ");

        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $totalPages = max(1, (int) ceil($total / $limit));

        $summaryStmt = $conn->prepare("
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(a.severity = 'WARNING'), 0) AS warnings,
                COALESCE(SUM(a.severity = 'ERROR'), 0) AS errors,
                COALESCE(SUM(a.severity = 'CRITICAL'), 0) AS critical
            FROM activity_logs a
            LEFT JOIN users u ON u.id = a.actor_id
            $summaryWhereSql
        ");

        $summaryStmt->execute($summaryParams);
        $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);

        $logsStmt = $conn->prepare("
            SELECT
                a.id,
                a.request_id,
                a.organisation_id,
                a.actor_id,
                COALESCE(u.full_name, 'System') AS actor_name,
                a.category,
                a.action,
                a.entity_type,
                a.entity_id,
                a.entity_reference,
                a.description,
                a.reason,
                a.old_values,
                a.new_values,
                a.metadata,
                a.ip_address,
                a.user_agent,
                a.severity,
                a.created_at
            FROM activity_logs a
            LEFT JOIN users u ON u.id = a.actor_id
            $whereSql
            ORDER BY a.created_at DESC, a.id DESC
            LIMIT :limit OFFSET :offset
        ");

        foreach ($params as $key => $value) {
            $logsStmt->bindValue($key, $value);
        }

        $logsStmt->bindValue(":limit", $limit, PDO::PARAM_INT);
        $logsStmt->bindValue(":offset", $offset, PDO::PARAM_INT);

        $logsStmt->execute();

        $logs = $logsStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($logs as &$log) {
            $log["old_values"] = $log["old_values"]
                ? json_decode($log["old_values"], true)
                : null;

            $log["new_values"] = $log["new_values"]
                ? json_decode($log["new_values"], true)
                : null;

            $log["metadata"] = $log["metadata"]
                ? json_decode($log["metadata"], true)
                : null;
        }

        unset($log);

        echo json_encode([
            "error" => false,
            "data" => [
                "logs" => $logs,
                "pagination" => [
                    "page" => $page,
                    "limit" => $limit,
                    "total" => $total,
                    "total_pages" => $totalPages
                ],
                "summary" => [
                    "total" => (int) $summary["total"],
                    "warnings" => (int) $summary["warnings"],
                    "errors" => (int) $summary["errors"],
                    "critical" => (int) $summary["critical"]
                ]
            ],
            "code" => 200
        ]);

    } catch (Throwable $e) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not load audit logs.",
            "code" => 500
        ]);
    }
