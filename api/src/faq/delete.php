<?php
require_once dirname(__DIR__, 2) . '/include/verify-user.php';

$id = (int)($_POST['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(['error' => true, 'data' => 'Invalid FAQ ID']);
    exit;
}

try {
    $get = $conn->prepare("SELECT question FROM faqs WHERE id = :id");
    $get->bindValue(':id', $id, PDO::PARAM_INT);
    $get->execute();
    $faq = $get->fetch(PDO::FETCH_OBJ);

    $stmt = $conn->prepare("DELETE FROM faqs WHERE id = :id");
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        echo json_encode(['error' => true, 'data' => 'FAQ not found']);
        exit;
    }

    save_activity_log("Deleted", "FAQ", $faq->question, $my_details->email);

    echo json_encode([
        'error' => false,
        'data'  => 'FAQ deleted successfully'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => true, 'data' => 'Database error']);
}