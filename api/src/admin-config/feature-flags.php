<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

try {
    if ($_SERVER["REQUEST_METHOD"] !== "GET") {
        http_response_code(405);
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed",
            "code" => null
        ]);
        exit;
    }

    $q = $conn->prepare("SELECT * FROM feature_flag_config LIMIT 1");
    $q->execute();
    $config = $q->fetch(PDO::FETCH_ASSOC);

    if (!$config) {
        http_response_code(404);
        echo json_encode([
            "error" => true,
            "data" => "Feature flag configuration has not been initialized",
            "code" => null
        ]);
        exit;
    }

    $q = $conn->prepare("
        SELECT
            id,
            flag_key AS `key`,
            label,
            description AS `desc`,
            scope,
            enabled,
            requires_approval
        FROM feature_flags
        ORDER BY label ASC
    ");
    $q->execute();
    $flags = $q->fetchAll(PDO::FETCH_ASSOC);

    foreach ($flags as &$flag) {
        $flag["enabled"] = (bool) $flag["enabled"];
        $flag["requires_approval"] = (bool) $flag["requires_approval"];
    }
    unset($flag);

    echo json_encode([
        "error" => false,
        "data" => true,
        "code" => [
            "configuration_id" => $config["id"],
            "audit_all_changes" => (bool) $config["audit_all_changes"],
            "require_reason" => (bool) $config["require_reason"],
            "flags" => $flags
        ]
    ]);
} catch (Throwable $e) {
    error_log("Get feature flags error: " . $e->getMessage());
    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Unable to retrieve feature flags",
        "code" => null
    ]);
}