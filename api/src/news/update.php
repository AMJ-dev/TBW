<?php
require_once dirname(__DIR__, 2) . '/include/verify-user.php';

$id       = (int) $_POST['id'];
$title    = trim($_POST['title']);
$content  = $_POST['content'];
$category = $_POST['category'];
$featured = isset($_POST['featured']) ? 1 : 0;
$status   = $_POST['status'] ?? 'published';
$tags     = $_POST['tags'] ?? [];

$excerpt   = generate_excerpt($content);
$read_time = calculate_read_time($content);

/* Get existing image */
$stmt = $conn->prepare("SELECT image_url FROM news WHERE id = :id");
$stmt->bindValue(':id', $id, PDO::PARAM_INT);
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);

$image_url = $row['image_url'] ?? '';

/* Replace image if new one uploaded */
if (!empty($_FILES['image']['name'])) {
    delete_file($image_url);

    $upload = upload_files($_FILES['image'], $img_accept);
    if ($upload['error']) {
        exit(json_encode(['error' => true, 'message' => $upload['data']]));
    }
    $image_url = $upload['data'];
}

/* Update news */
$sql = "UPDATE news SET
    title = :title,
    excerpt = :excerpt,
    content = :content,
    category = :category,
    image_url = :image_url,
    featured = :featured,
    read_time = :read_time,
    status = :status
WHERE id = :id";

$stmt = $conn->prepare($sql);
$stmt->bindValue(':title', $title);
$stmt->bindValue(':excerpt', $excerpt);
$stmt->bindValue(':content', $content);
$stmt->bindValue(':category', $category);
$stmt->bindValue(':image_url', $image_url);
$stmt->bindValue(':featured', $featured, PDO::PARAM_INT);
$stmt->bindValue(':read_time', $read_time);
$stmt->bindValue(':status', $status);
$stmt->bindValue(':id', $id, PDO::PARAM_INT);
$stmt->execute();

/* Replace tags */
$del = $conn->prepare("DELETE FROM news_tags WHERE news_id = :id");
$del->bindValue(':id', $id, PDO::PARAM_INT);
$del->execute();

if (!empty($tags) && is_array($tags) && count($tags)>0) {
    $tagStmt = $conn->prepare(
        "INSERT INTO news_tags (news_id, tag) VALUES (:news_id, :tag)"
    );
    foreach ($tags as $tag) {
        $tagStmt->bindValue(':news_id', $id, PDO::PARAM_INT);
        $tagStmt->bindValue(':tag', trim($tag));
        $tagStmt->execute();
    }
}
save_activity_log("Updated", "News", $title, $my_details->email);

echo json_encode(['success' => true]);