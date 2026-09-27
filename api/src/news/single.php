<?php
require_once dirname(__DIR__, 2) . '/include/conn.php';

$id = (int)($_GET['id'] ?? 0);

$stmt = $conn->prepare("SELECT * FROM news WHERE id=:id LIMIT 1");
$stmt->execute([':id'=>$id]);
$news = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$news) {
    echo json_encode(['error'=>true,'data'=>'Not found']);
    exit;
}

$conn->prepare("UPDATE news SET views = views + 1 WHERE id=:id")->execute([':id'=>$id]);
$tags = $conn->prepare("SELECT tag FROM news_tags WHERE news_id=:id");
$tags->execute([':id'=>$id]);
$news['tags'] = $tags->fetchAll(PDO::FETCH_COLUMN);


echo json_encode(['error'=>false,'data'=>$news]);