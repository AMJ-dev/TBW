<?php
    require_once dirname(__DIR__, 2) . '/include/conn.php';

    if (!isset($_GET['id']) || !filter_var($_GET['id'], FILTER_VALIDATE_INT)) {
        echo json_encode(['error' => true, 'message' => 'Invalid or missing news ID']);
        exit;
    }

    $currentId = (int)$_GET['id'];

    try {
        $stmtCurrent = $conn->prepare("SELECT id, category FROM news WHERE id = :id LIMIT 1");
        $stmtCurrent->execute([':id' => $currentId]);
        $currentNews = $stmtCurrent->fetch(PDO::FETCH_ASSOC);

        if (!$currentNews) {
            echo json_encode(['error' => true, 'message' => 'News article not found']);
            exit;
        }

        $currentCategory = $currentNews['category'];
        $stmtRelated = $conn->prepare("
            SELECT id, title, excerpt, image_url, category, views, featured, created_at
            FROM news
            WHERE category = :category AND id != :id
            ORDER BY id DESC
            LIMIT 3
        ");
        $stmtRelated->execute([
            ':category' => $currentCategory,
            ':id' => $currentId
        ]);
        $relatedData = $stmtRelated->fetchAll(PDO::FETCH_ASSOC);

        $count = count($relatedData);

        if ($count < 3) {
            $remaining = 3 - $count;
            $stmtOthers = $conn->prepare("
                SELECT id, title, excerpt, image_url, category, views, featured, created_at
                FROM news
                WHERE category != :category
                ORDER BY id DESC
                LIMIT :limit
            ");
            $stmtOthers->bindValue(':category', $currentCategory);
            $stmtOthers->bindValue(':limit', $remaining, PDO::PARAM_INT);
            $stmtOthers->execute();

            $otherData = $stmtOthers->fetchAll(PDO::FETCH_ASSOC);
            $data = array_merge($relatedData, $otherData);
        } else {
            $data = $relatedData;
        }

        echo json_encode(['error' => false, 'data' => $data]);

    } catch (PDOException $e) {
        error_log("News related query error: " . $e->getMessage());
        echo json_encode(['error' => true, 'message' => 'A database error occurred.']);
    }