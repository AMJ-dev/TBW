<?php
    require_once dirname(__DIR__, 2) . "/include/check-user.php";

    $id = $my_details->organisation_id;

    if ($id === "") {
        http_response_code(400);

        echo json_encode([
            "error" => true,
            "data" => "Invalid organisation ID",
            "code" => $id
        ]);

        exit;
    }

    require_once __DIR__."/single.php";