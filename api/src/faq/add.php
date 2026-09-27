<?php
require_once dirname(__DIR__, 2) . '/include/verify-user.php';

$question = trim($_POST['question'] ?? '');
$answer   = trim($_POST['answer'] ?? '');
$category = $_POST['category'] ?? 'Charging';

$allowedCategories = [
    'Charging', 'Vehicles', 'Purchasing',
    'Warranty', 'Maintenance', 'Shipping'
];

if ($question === '' || $answer === '') {
    echo json_encode(['error' => true, 'data' => 'Question and answer are required']);
    exit;
}

if (!in_array($category, $allowedCategories, true)) {
    echo json_encode(['error' => true, 'data' => 'Invalid category']);
    exit;
}

try {
    $stmt = $conn->prepare("
        INSERT INTO faqs (question, answer, category)
        VALUES (:question, :answer, :category)
    ");

    $stmt->bindValue(':question', $question, PDO::PARAM_STR);
    $stmt->bindValue(':answer', $answer, PDO::PARAM_STR);
    $stmt->bindValue(':category', $category, PDO::PARAM_STR);
    $stmt->execute();

    save_activity_log("Added", "FAQ", $question, $my_details->email);

    echo json_encode([
        'error' => false,
        'data'  => 'FAQ added successfully'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => true, 'data' => 'Database error']);
}