<?php
    require_once dirname(__DIR__, 3)."/include/verify-user.php";

    try {

        $user_id = $my_details->id;
        $current_session_id = $my_details->session_id;
        $session_id = trim($_GET["id"] ?? "");

        if (empty($session_id)) {
            echo json_encode([
                "error" => true,
                "data" => "Session ID is required.",
                "code" => []
            ]);
            exit;
        }

        if ($session_id === $current_session_id) {
            echo json_encode([
                "error" => true,
                "data" => "You cannot revoke your current session.",
                "code" => []
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT id
            FROM sessions
            WHERE id = :session_id
            AND user_id = :user_id
            AND revoked_at IS NULL
            LIMIT 1
        ");

        $stmt->execute([
            ":session_id" => $session_id,
            ":user_id" => $user_id
        ]);

        if (!$stmt->fetch()) {
            echo json_encode([
                "error" => true,
                "data" => "Session not found.",
                "code" => []
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            UPDATE sessions
            SET
                revoked_at = NOW(),
                revoked_reason = 'user_revoked'
            WHERE id = :session_id
            AND user_id = :user_id
            AND revoked_at IS NULL
            LIMIT 1
        ");

        $stmt->execute([
            ":session_id" => $session_id,
            ":user_id" => $user_id
        ]);

        echo json_encode([
            "error" => false,
            "data" => "Session revoked successfully.",
            "code" => [
                "id" => $session_id
            ]
        ]);

    } catch (Throwable $e) {

        error_log("Session revoke error: ".$e->getMessage());

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "An error occurred while revoking the session.",
            "code" => []
        ]);
    }