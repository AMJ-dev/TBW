<?php
require_once dirname(__DIR__, 2) . '/include/verify-user.php';

$id = (int)($_POST['id'] ?? 0);

$stmt = $conn->prepare("SELECT title, image_url FROM news WHERE id=:id");
$stmt->execute([':id'=>$id]);
$news = $stmt->fetch(PDO::FETCH_OBJ);

if (!$news) {
    echo json_encode(['error'=>true,'data'=>'News not found']);
    exit;
}

delete_file($news->image_url);

$conn->prepare("DELETE FROM news WHERE id=:id")
     ->execute([':id'=>$id]);

save_activity_log("Deleted", "News", $news->title, $my_details->email);

echo json_encode(['error'=>false,'data'=>'News deleted successfully']);