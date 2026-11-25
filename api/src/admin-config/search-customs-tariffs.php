<?php
    require_once dirname(__DIR__, 2) . "/include/set-header.php";

    header("Content-Type: application/json; charset=utf-8");

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed.",
            "code" => null
        ]);
        exit;
    }

    try {
        $search = trim((string) ($_POST["search"] ?? $_POST["q"] ?? ""));
        $search = mb_substr($search, 0, 100);

        $limit = (int) ($_POST["limit"] ?? 20);
        $limit = max(1, min($limit, 100));

        $page = (int) ($_POST["page"] ?? 1);
        $page = max(1, $page);

        $offset = ($page - 1) * $limit;

        $asOf = trim((string) ($_POST["as_of"] ?? date("Y-m-d")));

        $date = DateTime::createFromFormat("!Y-m-d", $asOf);
        $dateErrors = DateTime::getLastErrors();

        if (
            !$date ||
            ($dateErrors !== false && (
                $dateErrors["warning_count"] > 0 ||
                $dateErrors["error_count"] > 0
            )) ||
            $date->format("Y-m-d") !== $asOf
        ) {
            echo json_encode([
                "error" => true,
                "data" => "Invalid tariff effective date.",
                "code" => null
            ]);
            exit;
        }

        $where = "
            WHERE status = 'ACTIVE'
            AND (effective_from IS NULL OR effective_from <= :effective_from)
            AND (effective_to IS NULL OR effective_to >= :effective_to)
        ";

        $params = [
            ":effective_from" => $asOf,
            ":effective_to" => $asOf
        ];

        if ($search !== "") {
            $where .= "
                AND (
                    hs_code LIKE :search_hs_code
                    OR description LIKE :search_description
                    OR category LIKE :search_category
                )
            ";

            $term = "%" . $search . "%";

            $params[":search_hs_code"] = $term;
            $params[":search_description"] = $term;
            $params[":search_category"] = $term;
        }

        $countStmt = $conn->prepare("
            SELECT COUNT(*)
            FROM customs_tariffs
            $where
        ");

        foreach ($params as $key => $value) {
            $countStmt->bindValue($key, $value, PDO::PARAM_STR);
        }

        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        $orderSql = "";

        if ($search !== "") {
            $orderSql = "
                CASE
                    WHEN hs_code = :exact_hs_code THEN 0
                    WHEN hs_code LIKE :prefix_hs_code THEN 1
                    ELSE 2
                END,
            ";
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
                $orderSql
                hs_code ASC,
                description ASC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $conn->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }

        if ($search !== "") {
            $stmt->bindValue(":exact_hs_code", $search, PDO::PARAM_STR);
            $stmt->bindValue(":prefix_hs_code", $search . "%", PDO::PARAM_STR);
        }

        $stmt->bindValue(":limit", $limit, PDO::PARAM_INT);
        $stmt->bindValue(":offset", $offset, PDO::PARAM_INT);

        $stmt->execute();

        $tariffs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($tariffs as &$tariff) {
            foreach ([
                "rate",
                "import_duty",
                "vat",
                "levy",
                "exc",
                "wgl",
                "ric",
                "brl",
                "wfl",
                "sug",
                "cem",
                "cig",
                "iro",
                "crl",
                "tpl",
                "nau",
                "nan",
                "gts"
            ] as $field) {
                if (array_key_exists($field, $tariff) && $tariff[$field] !== null) {
                    $tariff[$field] = (float) $tariff[$field];
                }
            }
        }
        unset($tariff);

        echo json_encode([
            "error" => false,
            "data" => "Customs tariffs loaded successfully.",
            "code" => [
                "as_of" => $asOf,
                "tariffs" => $tariffs,
                "pagination" => [
                    "page" => $page,
                    "limit" => $limit,
                    "total" => $total,
                    "total_pages" => (int) ceil($total / $limit)
                ]
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } catch (Throwable $e) {
        error_log("Could not search customs tariffs: " . $e->getMessage());

        echo json_encode([
            "error" => true,
            "data" => "Could not search customs tariffs.",
            "code" => null
        ]);
    }
