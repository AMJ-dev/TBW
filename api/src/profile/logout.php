<?php
    require_once dirname(__DIR__, 2)."/include/verify-user.php";

    $delete_session = $conn->prepare("DELETE FROM `sessions` WHERE `sessions`.`user_id` = :user_id AND `sessions`.`id` = :session_id");
    $delete_session->execute(["user_id" => $decoded->id, "session_id" => $decoded->session_id]);

    setcookie("token", "", time() - 86400, "/");

    echo json_encode([
        "error" => false,
        "message" => "Logout successful"
    ]);