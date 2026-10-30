<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

try {
    $search = trim($_POST['search'] ?? $_POST['q'] ?? '');
    $limit = max(1, min((int) ($_POST['limit'] ?? 20), 100));
    $page = max(1, (int) ($_POST['page'] ?? 1));
    $offset = ($page - 1) * $limit;
    $today = date('Y-m-d');

    $where = "
        WHERE status = 'ACTIVE'
        AND (effective_from IS NULL OR effective_from <= :count_today_from)
        AND (effective_to IS NULL OR effective_to >= :count_today_to)
    ";

    $countParams = [
        ':count_today_from' => $today,
        ':count_today_to' => $today
    ];

    if ($search !== '') {
        $where .= "
            AND (
                hs_code LIKE :count_hs_code
                OR description LIKE :count_description
                OR category LIKE :count_category
            )
        ";

        $term = '%' . $search . '%';

        $countParams[':count_hs_code'] = $term;
        $countParams[':count_description'] = $term;
        $countParams[':count_category'] = $term;
    }

    $countSql = "
        SELECT COUNT(*)
        FROM customs_tariffs
        $where
    ";

    $countStmt = $conn->prepare($countSql);

    foreach ($countParams as $key => $value) {
        $countStmt->bindValue($key, $value, PDO::PARAM_STR);
    }

    $countStmt->execute();
    $total = (int) $countStmt->fetchColumn();

    $where = "
        WHERE status = 'ACTIVE'
        AND (effective_from IS NULL OR effective_from <= :list_today_from)
        AND (effective_to IS NULL OR effective_to >= :list_today_to)
    ";

    $listParams = [
        ':list_today_from' => $today,
        ':list_today_to' => $today
    ];

    if ($search !== '') {
        $where .= "
            AND (
                hs_code LIKE :list_hs_code
                OR description LIKE :list_description
                OR category LIKE :list_category
            )
        ";

        $term = '%' . $search . '%';

        $listParams[':list_hs_code'] = $term;
        $listParams[':list_description'] = $term;
        $listParams[':list_category'] = $term;
    }

    $sql = "
        SELECT
            id,
            hs_code,
            description,
            category,
            rate_type,
            rate,
            unit,
            import_duty,
            vat,
            levy,
            exc,
            wgl,
            ric,
            brl,
            wfl,
            sug,
            cem,
            cig,
            iro,
            crl,
            tpl,
            nau,
            nan,
            gts,
            date_of_version,
            effective_from,
            effective_to,
            status,
            source
        FROM customs_tariffs
        $where
        ORDER BY
            CASE
                WHEN hs_code = :exact_hs_code THEN 0
                WHEN hs_code LIKE :prefix_hs_code THEN 1
                ELSE 2
            END,
            hs_code ASC,
            description ASC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $conn->prepare($sql);

    foreach ($listParams as $key => $value) {
        $stmt->bindValue($key, $value, PDO::PARAM_STR);
    }

    $stmt->bindValue(':exact_hs_code', $search, PDO::PARAM_STR);
    $stmt->bindValue(':prefix_hs_code', $search . '%', PDO::PARAM_STR);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();

    $tariffs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "error" => false,
        "data" => "Customs tariffs loaded successfully.",
        "code" => [
            "tariffs" => $tariffs,
            "pagination" => [
                "page" => $page,
                "limit" => $limit,
                "total" => $total,
                "total_pages" => (int) ceil($total / $limit)
            ]
        ]
    ]);
} catch (Throwable $e) {

    echo json_encode([
        "error" => true,
        "data" => "Could not search customs tariffs.",
        "code" => $e->getMessage()
    ]);
}