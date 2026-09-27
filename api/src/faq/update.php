<?php
require_once dirname(__DIR__, 2) . '/include/verify-user.php';

$id       = (int)($_POST['id'] ?? 0);
$question = trim($_POST['question'] ?? '');
$answer   = trim($_POST['answer'] ?? '');
$category = $_POST['category'] ?? 'Charging';

$allowedCategories = [
    'Charging', 'Vehicles', 'Purchasing',
    'Warranty', 'Maintenance', 'Shipping'
];

if ($id <= 0) {
    echo json_encode(['error' => true, 'data' => 'Invalid FAQ ID']);
    exit;
}

if ($question === '' || $answer === '') {
    echo json_encode(['error' => true, 'data' => 'Question and answer are required']);
    exit;
}

if (!in_array($category, $allowedCategories, true)) {
    echo json_encode(['error' => true, 'data' => 'Invalid category']);
    exit;
}

try {
    $chk = $conn->prepare("SELECT id FROM faqs WHERE id = :id LIMIT 1");
    $chk->bindValue(':id', $id, PDO::PARAM_INT);
    $chk->execute();

    if (!$chk->fetch()) {
        echo json_encode(['error' => true, 'data' => 'FAQ not found']);
        exit;
    }

    $upd = $conn->prepare("
        UPDATE faqs
        SET question = :question,
            answer   = :answer,
            category = :category
        WHERE id = :id
    ");

    $upd->bindValue(':question', $question, PDO::PARAM_STR);
    $upd->bindValue(':answer', $answer, PDO::PARAM_STR);
    $upd->bindValue(':category', $category, PDO::PARAM_STR);
    $upd->bindValue(':id', $id, PDO::PARAM_INT);
    $upd->execute();

    save_activity_log("Updated", "FAQ", $question, $my_details->email);

    echo json_encode([
        'error' => false,
        'data'  => 'FAQ updated successfully'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => true, 'data' => 'Database error']);
}