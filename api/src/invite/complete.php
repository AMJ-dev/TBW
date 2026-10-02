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
    $fullName = trim($_POST["full_name"] ?? "");
    $phone = trim($_POST["phone"] ?? "");
    $password = $_POST["password"] ?? "";
    $passwordConfirmation = $_POST["password_confirmation"] ?? "";

    if ($token === "" || $fullName === "" || $password === "") {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Required fields are missing",
            "code" => null
        ]);
        exit;
    }

    if ($password !== $passwordConfirmation) {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Passwords do not match",
            "code" => null
        ]);
        exit;
    }

    if (
        strlen($password) < 10 ||
        !preg_match("/[A-Z]/", $password) ||
        !preg_match("/[a-z]/", $password) ||
        !preg_match("/\d/", $password) ||
        !preg_match("/[^A-Za-z0-9]/", $password)
    ) {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Password does not meet the requirements",
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
                u.email,
                u.phone AS current_phone,
                u.account_type
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

        if ($invite["accepted_at"] !== null) {
            $conn->rollBack();

            http_response_code(409);
            echo json_encode([
                "error" => true,
                "data" => "Invitation has already been used",
                "code" => null
            ]);
            exit;
        }

        if ($invite["revoked_at"] !== null) {
            $conn->rollBack();

            http_response_code(410);
            echo json_encode([
                "error" => true,
                "data" => "Invitation has been revoked",
                "code" => null
            ]);
            exit;
        }

        if (strtotime($invite["expires_at"]) < time()) {
            $conn->rollBack();

            http_response_code(410);
            echo json_encode([
                "error" => true,
                "data" => "Invitation has expired",
                "code" => null
            ]);
            exit;
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $updateUser = $conn->prepare("
            UPDATE users
            SET
                full_name = :full_name,
                phone = :phone,
                password_hash = :password_hash,
                email_verified_at = COALESCE(email_verified_at, NOW()),
                password_changed_at = NOW(),
                updated_at = NOW()
            WHERE id = :id
        ");

        $updateUser->execute([
            ":full_name" => $fullName,
            ":phone" => $phone !== "" ? $phone : null,
            ":password_hash" => $passwordHash,
            ":id" => $invite["user_id"]
        ]);

        $hasPhone = $phone !== "";

        if ($hasPhone) {
            $otp = str_pad((string) random_int(0, 999999), 6, "0", STR_PAD_LEFT);
            $otpHash = password_hash($otp, PASSWORD_DEFAULT);
            $expiresAt = date("Y-m-d H:i:s", time() + 600);

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

            $otpStmt = $conn->prepare("
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
                    0,
                    NOW(),
                    :expires_at,
                    NOW()
                )
            ");

            $otpStmt->execute([
                ":id" => generateId(),
                ":user_id" => $invite["user_id"],
                ":otp_hash" => $otpHash,
                ":destination" => $phone,
                ":expires_at" => $expiresAt
            ]);

            $smsMessage = "Your TRÏNŪ verification code is {$otp}. It expires in 10 minutes.";

            send_sms($phone, $smsMessage);
        } else {
            $conn->prepare("
                UPDATE users
                SET account_status = 'active'
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
        }

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => $hasPhone
                ? "Account created. Phone verification required."
                : "Account activated successfully.",
            "code" => [
                "phone_verification_required" => $hasPhone,
                "email_verified" => true
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