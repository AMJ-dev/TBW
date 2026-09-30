<?php
    require_once dirname(__DIR__, 2)."/include/verify-user.php";

    try {

        $user_id = $my_details->id;
        $current_session_id = $my_details->session_id;

        $stmt = $conn->prepare("
            UPDATE sessions
            SET
                revoked_at = NOW(),
                revoked_reason = 'user_revoked_others'
            WHERE user_id = :user_id
            AND id <> :current_session_id
            AND revoked_at IS NULL
        ");

        $stmt->execute([
            ":user_id" => $user_id,
            ":current_session_id" => $current_session_id
        ]);

        echo json_encode([
            "error" => false,
            "data" => "All other sessions have been revoked.",
            "code" => [
                "revoked" => $stmt->rowCount()
            ]
        ]);

    } catch (Throwable $e) {

        error_log("Revoke other sessions error: ".$e->getMessage());

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "An error occurred while revoking other sessions.",
            "code" => []
        ]);
    }