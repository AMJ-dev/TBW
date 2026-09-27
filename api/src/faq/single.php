<?php
require_once dirname(__DIR__, 2) . '/include/conn.php';

$id = (int)($_GET['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(['error' => true, 'data' => 'Invalid FAQ ID']);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT id, question, answer, category, created_at, updated_at
        FROM faqs
        WHERE id = :id AND is_active = 1
        LIMIT 1
    ");
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();

    $faq = $stmt->fetch(PDO::FETCH_OBJ);

    if (!$faq) {
        echo json_encode(['error' => true, 'data' => 'FAQ not found']);
        exit;
    }

    echo json_encode([
        'error' => false,
        'data'  => $faq
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => true, 'data' => 'Database error']);
}