<?php
require_once dirname(__DIR__, 2) . '/include/conn.php';

$stmt = $conn->query("
    SELECT id, title, excerpt, image_url, category, views, featured, created_at
    FROM news
    ORDER BY id DESC
");

$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['error'=>false,'data'=>$data]);