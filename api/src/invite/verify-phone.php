<?php
    require_once dirname(__DIR__, 2) . "/include/set-header.php";

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed",
            "code" => null
        ]);
        exit;
    }

    $token = trim($_POST["token"] ?? "");
    $code = trim($_POST["code"] ?? "");

    if ($token === "" || $code === "") {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Token and verification code are required",
            "code" => null
        ]);
        exit;
    }

    if (!preg_match("/^\d{6}$/", $code)) {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Invalid verification code",
            "code" => null
        ]);
        exit;
    }

    try {
        $conn->beginTransaction();

        $tokenHash = hash("sha256", $token);

        $inviteStmt = $conn->prepare("
            SELECT
                ui.id AS invitation_id,
                ui.user_id,
                ui.expires_at,
                ui.accepted_at,
                ui.revoked_at,
                u.phone,
                u.account_type
            FROM user_invitations ui
            INNER JOIN users u
                ON u.id = ui.user_id
            WHERE ui.token_hash = :token_hash
            LIMIT 1
            FOR UPDATE
        ");

        $inviteStmt->execute([
            ":token_hash" => $tokenHash
        ]);

        $invite = $inviteStmt->fetch(PDO::FETCH_ASSOC);

        if (!$invite) {
            $conn->rollBack();

            http_response_code(404);
            echo json_encode([
                "error" => true,
                "data" => "Invalid invitation",
                "code" => null
            ]);
            exit;
        }

        if ($invite["accepted_at"] !== null) {
            $conn->rollBack();

            http_response_code(409);
            echo json_encode([
                "error" => true,
                "data" => "Invitation has already been completed",
                "code" => null
            ]);
            exit;
        }

        if ($invite["revoked_at"] !== null || strtotime($invite["expires_at"]) < time()) {
            $conn->rollBack();

            http_response_code(410);
            echo json_encode([
                "error" => true,
                "data" => "Invitation is no longer valid",
                "code" => null
            ]);
            exit;
        }

        $otpStmt = $conn->prepare("
            SELECT *
            FROM otp_codes
            WHERE user_id = :user_id
            AND purpose = 'phone_verify'
            AND verified_at IS NULL
            AND revoked_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            FOR UPDATE
        ");

        $otpStmt->execute([
            ":user_id" => $invite["user_id"]
        ]);

        $otp = $otpStmt->fetch(PDO::FETCH_ASSOC);

        if (!$otp) {
            $conn->rollBack();

            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "No active verification code was found",
                "code" => null
            ]);
            exit;
        }

        if (strtotime($otp["expires_at"]) < time()) {
            $conn->rollBack();

            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "Verification code has expired",
                "code" => null
            ]);
            exit;
        }

        if ((int) $otp["attempts"] >= (int) $otp["max_attempts"]) {
            $conn->rollBack();

            http_response_code(429);
            echo json_encode([
                "error" => true,
                "data" => "Too many verification attempts",
                "code" => null
            ]);
            exit;
        }

        if (!password_verify($code, $otp["otp_hash"])) {
            $conn->prepare("
                UPDATE otp_codes
                SET attempts = attempts + 1
                WHERE id = :id
            ")->execute([
                ":id" => $otp["id"]
            ]);

            $conn->commit();

            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "Incorrect verification code",
                "code" => null
            ]);
            exit;
        }

        $conn->prepare("
            UPDATE otp_codes
            SET verified_at = NOW()
            WHERE id = :id
        ")->execute([
            ":id" => $otp["id"]
        ]);

        $conn->prepare("
            UPDATE users
            SET
                phone_verified_at = NOW(),
                account_status = 'active',
                updated_at = NOW()
            WHERE id = :id
        ")->execute([
            ":id" => $invite["user_id"]
        ]);

        if ($invite["account_type"] === "organisation") {
            $conn->prepare("
                UPDATE organisation_members
                SET
                    membership_status = 'active',
                    joined_at = COALESCE(joined_at, NOW())
                WHERE user_id = :user_id
                AND membership_status != 'revoked'
            ")->execute([
                ":user_id" => $invite["user_id"]
            ]);
        }

        $conn->prepare("
            UPDATE user_invitations
            SET accepted_at = NOW()
            WHERE id = :id
        ")->execute([
            ":id" => $invite["invitation_id"]
        ]);

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Phone verified successfully. Your account is now active.",
            "code" => [
                "phone_verified" => true,
                "email_verified" => true,
                "account_status" => "active"
            ]
        ]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => $e->getMessage(),
            "code" => null
        ]);
    }