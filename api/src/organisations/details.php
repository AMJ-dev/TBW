<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $id = trim($_GET["id"] ?? "");

    if ($id === "") {
        

        echo json_encode([
            "error" => true,
            "data" => "Invalid organisation ID",
            "code" => $id
        ]);

        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] !== "GET") {
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed",
            "code" => null
        ]);

        exit;
    }

    require_once __DIR__."/single.php";