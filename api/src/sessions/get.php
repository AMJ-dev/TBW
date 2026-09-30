<?php

    require_once dirname(__DIR__, 2)."/include/verify-user.php";

    try {

        $user_id = $my_details->id;
        $current_session_id = $my_details->session_id;

        $stmt = $conn->prepare("
            SELECT
                id,
                device_name,
                device_kind,
                os,
                browser,
                ip_address,
                location,
                is_trusted,
                mfa_verified,
                last_active_at,
                expires_at,
                created_at,
                CASE
                    WHEN id = :current_session_id THEN 1
                    ELSE 0
                END AS current
            FROM sessions
            WHERE user_id = :user_id
            AND revoked_at IS NULL
            AND mfa_verified = 1
            AND expires_at > NOW()
            ORDER BY last_active_at DESC
        ");

        $stmt->execute([
            ":user_id" => $user_id,
            ":current_session_id" => $current_session_id
        ]);

        $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($sessions as &$session) {
            $session["current"] = (int)$session["current"] === 1;
            $session["trusted"] = (int)$session["is_trusted"] === 1;

            unset($session["is_trusted"]);
            unset($session["mfa_verified"]);
        }

        unset($session);

        $stmt = $conn->prepare("
            SELECT
                id,
                event,
                detail,
                ip_address,
                device_name,
                created_at
            FROM account_events
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT 50
        ");

        $stmt->execute([
            ":user_id" => $user_id
        ]);

        $activity = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => "Sessions loaded successfully.",
            "code" => [
                "sessions" => $sessions,
                "activity" => $activity
            ]
        ]);

    } catch (Throwable $e) {

        error_log("My sessions error: ".$e->getMessage());

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "An error occurred while loading your sessions.",
            "code" => []
        ]);
    }