<?php
require_once dirname(__DIR__, 2) . '/include/verify-user.php';

$title    = trim($_POST['title']);
$content  = $_POST['content'];
$category = $_POST['category'];
$featured = isset($_POST['featured']) ? 1 : 0;
$status   = $_POST['status'] ?? 'published';
$tags     = $_POST['tags'] ?? [];

$excerpt   = generate_excerpt($content);
$read_time = calculate_read_time($content);

/* Upload image */
$image_url = '';
if (!empty($_FILES['image']['name'])) {
    $upload = upload_files($_FILES['image'], $img_accept);
    if ($upload['error']) {
        exit(json_encode(['error' => true, 'message' => $upload['data']]));
    }
    $image_url = $upload['data'];
}

/* Insert news */
$sql = "INSERT INTO news 
(title, excerpt, content, category, image_url, featured, read_time, status)
VALUES (:title, :excerpt, :content, :category, :image_url, :featured, :read_time, :status)";

$stmt = $conn->prepare($sql);
$stmt->bindValue(':title', $title);
$stmt->bindValue(':excerpt', $excerpt);
$stmt->bindValue(':content', $content);
$stmt->bindValue(':category', $category);
$stmt->bindValue(':image_url', $image_url);
$stmt->bindValue(':featured', $featured, PDO::PARAM_INT);
$stmt->bindValue(':read_time', $read_time);
$stmt->bindValue(':status', $status);
$stmt->execute();

$news_id = $conn->lastInsertId();

/* Insert tags */
if (!empty($tags) && is_array($tags) && count($tags)>0) {
    $tagStmt = $conn->prepare(
        "INSERT INTO news_tags (news_id, tag) VALUES (:news_id, :tag)"
    );
    foreach ($tags as $tag) {
        $tagStmt->bindValue(':news_id', $news_id, PDO::PARAM_INT);
        $tagStmt->bindValue(':tag', trim($tag));
        $tagStmt->execute();
    }
}
save_activity_log("Added", "News", $title, $my_details->email);

echo json_encode(['success' => true, 'id' => $news_id]);