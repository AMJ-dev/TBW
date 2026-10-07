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

    if ($token === "") {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Invitation token is required",
            "code" => null
        ]);
        exit;
    }

    try {
        $conn->beginTransaction();

        $tokenHash = hash("sha256", $token);

        $stmt = $conn->prepare("
            SELECT
                ui.id AS invitation_id,
                ui.user_id,
                ui.expires_at,
                ui.accepted_at,
                ui.revoked_at,
                u.phone
            FROM user_invitations ui
            INNER JOIN users u
                ON u.id = ui.user_id
            WHERE ui.token_hash = :token_hash
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->execute([
            ":token_hash" => $tokenHash
        ]);

        $invite = $stmt->fetch(PDO::FETCH_ASSOC);

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

        if (
            $invite["accepted_at"] !== null ||
            $invite["revoked_at"] !== null ||
            strtotime($invite["expires_at"]) < time()
        ) {
            $conn->rollBack();

            http_response_code(410);
            echo json_encode([
                "error" => true,
                "data" => "Invitation is no longer valid",
                "code" => null
            ]);
            exit;
        }

        if (empty($invite["phone"])) {
            $conn->rollBack();

            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "No phone number is available for verification",
                "code" => null
            ]);
            exit;
        }

        $lastOtpStmt = $conn->prepare("
            SELECT created_at, resend_count
            FROM otp_codes
            WHERE user_id = :user_id
            AND purpose = 'phone_verify'
            AND revoked_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
        ");

        $lastOtpStmt->execute([
            ":user_id" => $invite["user_id"]
        ]);

        $lastOtp = $lastOtpStmt->fetch(PDO::FETCH_ASSOC);

        if ($lastOtp) {
            $seconds = time() - strtotime($lastOtp["created_at"]);

            if ($seconds < 60) {
                $conn->rollBack();

                http_response_code(429);
                echo json_encode([
                    "error" => true,
                    "data" => "Please wait before requesting another code",
                    "code" => [
                        "retry_after" => 60 - $seconds
                    ]
                ]);
                exit;
            }

            if ((int) $lastOtp["resend_count"] >= 5) {
                $conn->rollBack();

                http_response_code(429);
                echo json_encode([
                    "error" => true,
                    "data" => "Too many verification codes requested",
                    "code" => null
                ]);
                exit;
            }
        }

        $conn->prepare("
            UPDATE otp_codes
            SET revoked_at = NOW()
            WHERE user_id = :user_id
            AND purpose = 'phone_verify'
            AND verified_at IS NULL
            AND revoked_at IS NULL
        ")->execute([
            ":user_id" => $invite["user_id"]
        ]);

        $otp = str_pad((string) random_int(0, 999999), 6, "0", STR_PAD_LEFT);
        $otpHash = password_hash($otp, PASSWORD_DEFAULT);
        $expiresAt = date("Y-m-d H:i:s", time() + 600);

        $resendCount = $lastOtp
            ? ((int) $lastOtp["resend_count"] + 1)
            : 0;

        $insertOtp = $conn->prepare("
            INSERT INTO otp_codes (
                id,
                user_id,
                otp_hash,
                channel,
                destination,
                purpose,
                attempts,
                max_attempts,
                resend_count,
                last_sent_at,
                expires_at,
                created_at
            )
            VALUES (
                :id,
                :user_id,
                :otp_hash,
                'sms',
                :destination,
                'phone_verify',
                0,
                5,
                :resend_count,
                NOW(),
                :expires_at,
                NOW()
            )
        ");

        $insertOtp->execute([
            ":id" => generateId(),
            ":user_id" => $invite["user_id"],
            ":otp_hash" => $otpHash,
            ":destination" => $invite["phone"],
            ":resend_count" => $resendCount,
            ":expires_at" => $expiresAt
        ]);

        $sent = send_sms(
            $invite["phone"],
            "Your TRÏNŪ verification code is {$otp}. It expires in 10 minutes."
        ); 

        if ($sent === false) {
            $conn->rollBack();

            http_response_code(500);
            echo json_encode([
                "error" => true,
                "data" => "Unable to send verification code",
                "code" => null
            ]);
            exit;
        }

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Verification code sent successfully",
            "code" => [
                "expires_at" => $expiresAt,
                "resend_after" => 60
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