<?php

    require_once dirname(__DIR__, 2)."/include/verify-user.php";

    try {

        $user_id = $my_details->id;
        $session_id = $my_details->session_id;

        $stmt = $conn->prepare("
            INSERT INTO account_events (
                id,
                user_id,
                event,
                ip_address,
                device_name,
                detail
            ) VALUES (
                :id,
                :user_id,
                'signout',
                :ip_address,
                :device_name,
                :detail
            )
        ");

        $stmt->execute([
            "id" => generateId(),
            "user_id" => $user_id,
            "ip_address" => $_SERVER["REMOTE_ADDR"] ?? null,
            "device_name" => $_SERVER["HTTP_USER_AGENT"] ?? null,
            "detail" => json_encode([
                "session_id" => $session_id
            ])
        ]);

        $delete_session = $conn->prepare("
            DELETE FROM sessions
            WHERE user_id = :user_id
            AND id = :session_id
        ");

        $delete_session->execute([
            "user_id" => $user_id,
            "session_id" => $session_id
        ]);

        setcookie("token", "", time() - 86400, "/");

        echo json_encode([
            "error" => false,
            "message" => "Logout successful"
        ]);

    } catch (Throwable $e) {

        error_log("Logout error: ".$e->getMessage());

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "message" => "An error occurred while logging out."
        ]);
    }