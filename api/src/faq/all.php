<?php
require_once dirname(__DIR__, 2) . '/include/conn.php';

$category = $_GET['category'] ?? null;

try {
    if ($category) {
        $stmt = $conn->prepare("
            SELECT id, question, answer, category, created_at
            FROM faqs
            WHERE is_active = 1 AND category = :category
            ORDER BY created_at DESC
        ");
        $stmt->bindValue(':category', $category, PDO::PARAM_STR);
        $stmt->execute();
    } else {
        $stmt = $conn->query("
            SELECT id, question, answer, category, created_at
            FROM faqs
            WHERE is_active = 1
            ORDER BY created_at DESC
        ");
    }

    $faqs = $stmt->fetchAll(PDO::FETCH_OBJ);

    echo json_encode([
        'error' => false,
        'data'  => $faqs
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => true, 'data' => 'Database error']);
}