<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

try {
    $stmt = $conn->prepare("
        SELECT *
        FROM portal_receiving
        ORDER BY created_at DESC
    ");

    $stmt->execute();

    $receiving = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "error" => false,
        "data" => $receiving,
        "code" => null
    ]);
} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Could not load receiving records.",
        "code" => null
    ]);
}