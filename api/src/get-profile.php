<?php
    require_once dirname(__DIR__, 1) . "/include/verify-user.php";
    $error = false;
    $data  = null;

    try {
        $data = [
            "id"            => (string)$my_details->id,
            "full_name"    => $my_details->full_name,
            "email"         => $my_details->email
        ];
    } catch (Throwable $e) {
        $error = true;
        $data  = $e->getMessage();
    }

    echo json_encode([
        "error" => $error,
        "data"  => $data
    ]);