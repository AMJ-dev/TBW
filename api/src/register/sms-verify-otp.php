<?php

    require_once dirname(__DIR__, 2) . "/include/set-header.php";

    $code = [];
    $error = true;
    $data = "Unable to verify phone number.";

    $honeypot = trim($_POST["honeypot"] ?? $_POST["website"] ?? "");
    $phone = trim($_POST["phone"] ?? "");
    $verification_code = trim($_POST["verification_code"] ?? "");
    $registration_ref = trim($_POST["registration_ref"] ?? "");

    if ($honeypot !== "") {
        echo json_encode([
            "error" => false,
            "data" => "If your details are valid, your verification will be processed.",
            "code" => []
        ]);
        exit;
    }

    if ($registration_ref === "") {
        echo json_encode([
            "error" => true,
            "data" => "Registration reference is required.",
            "code" => []
        ]);
        exit;
    }

    if ($phone === "") {
        echo json_encode([
            "error" => true,
            "data" => "Phone number is required.",
            "code" => []
        ]);
        exit;
    }

    if (!preg_match("/^[0-9]{6}$/", $verification_code)) {
        echo json_encode([
            "error" => true,
            "data" => "Enter a valid 6-digit verification code.",
            "code" => []
        ]);
        exit;
    }

    try {

        $conn->beginTransaction();

        $request_query = $conn->prepare("
            SELECT
                id,
                registration_ref,
                phone,
                status,
                email_verified_at,
                phone_verified_at,
                expires_at
            FROM registration_requests
            WHERE registration_ref = :registration_ref
            AND phone = :phone
            LIMIT 1
            FOR UPDATE
        ");

        $request_query->execute([
            ":registration_ref" => $registration_ref,
            ":phone" => $phone
        ]);

        $request = $request_query->fetch(PDO::FETCH_ASSOC);

        if (!$request) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Registration request not found.",
                "code" => []
            ]);
            exit;
        }

        if ($request["status"] === "completed") {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Registration has already been completed.",
                "code" => []
            ]);
            exit;
        }

        if (!in_array($request["status"], ["pending_otp", "verified"], true)) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "This registration cannot be verified.",
                "code" => []
            ]);
            exit;
        }

        if (strtotime($request["expires_at"]) <= time()) {

            $expire = $conn->prepare("
                UPDATE registration_requests
                SET status = 'expired'
                WHERE id = :id
            ");

            $expire->execute([
                ":id" => $request["id"]
            ]);

            $conn->commit();

            echo json_encode([
                "error" => true,
                "data" => "Registration request has expired. Please register again.",
                "code" => []
            ]);
            exit;
        }

        if (!empty($request["phone_verified_at"])) {
            $conn->rollBack();

            echo json_encode([
                "error" => false,
                "data" => "Phone number is already verified.",
                "code" => [
                    "registration_ref" => $registration_ref,
                    "phone_verified" => true
                ]
            ]);
            exit;
        }

        $otp_query = $conn->prepare("
            SELECT
                id,
                otp_hash,
                attempts,
                max_attempts,
                expires_at
            FROM registration_otps
            WHERE registration_request_id = :registration_request_id
            AND channel = 'sms'
            AND destination = :destination
            AND purpose = 'registration_phone'
            AND verified_at IS NULL
            AND revoked_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            FOR UPDATE
        ");

        $otp_query->execute([
            ":registration_request_id" => $request["id"],
            ":destination" => $phone
        ]);

        $otp = $otp_query->fetch(PDO::FETCH_ASSOC);

        if (!$otp) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Verification code not found or has expired.",
                "code" => []
            ]);
            exit;
        }

        if (strtotime($otp["expires_at"]) <= time()) {

            $revoke = $conn->prepare("
                UPDATE registration_otps
                SET revoked_at = NOW()
                WHERE id = :id
            ");

            $revoke->execute([
                ":id" => $otp["id"]
            ]);

            $conn->commit();

            echo json_encode([
                "error" => true,
                "data" => "Verification code has expired. Please request a new code.",
                "code" => []
            ]);
            exit;
        }

        if ((int)$otp["attempts"] >= (int)$otp["max_attempts"]) {

            $revoke = $conn->prepare("
                UPDATE registration_otps
                SET revoked_at = NOW()
                WHERE id = :id
            ");

            $revoke->execute([
                ":id" => $otp["id"]
            ]);

            $conn->commit();

            echo json_encode([
                "error" => true,
                "data" => "Too many incorrect attempts. Please request a new code.",
                "code" => []
            ]);
            exit;
        }

        if (!password_verify($verification_code, $otp["otp_hash"])) {

            $attempt = $conn->prepare("
                UPDATE registration_otps
                SET attempts = attempts + 1
                WHERE id = :id
            ");

            $attempt->execute([
                ":id" => $otp["id"]
            ]);

            $conn->commit();

            $remaining = max(
                0,
                ((int)$otp["max_attempts"] - ((int)$otp["attempts"] + 1))
            );

            echo json_encode([
                "error" => true,
                "data" => "Invalid verification code.",
                "code" => [
                    "attempts_remaining" => $remaining
                ]
            ]);
            exit;
        }

        $verify = $conn->prepare("
            UPDATE registration_otps
            SET verified_at = NOW()
            WHERE id = :id
            AND verified_at IS NULL
            AND revoked_at IS NULL
        ");

        $verify->execute([
            ":id" => $otp["id"]
        ]);

        if ($verify->rowCount() !== 1) {
            throw new RuntimeException("Unable to verify SMS code.");
        }

        $update_request = $conn->prepare("
            UPDATE registration_requests
            SET
                phone_verified_at = NOW(),
                status = CASE
                    WHEN email_verified_at IS NOT NULL THEN 'verified'
                    ELSE status
                END
            WHERE id = :id
        ");

        $update_request->execute([
            ":id" => $request["id"]
        ]);

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Phone number verified successfully.",
            "code" => [
                "registration_ref" => $registration_ref,
                "phone" => $phone,
                "phone_verified" => true,
                "registration_verified" => !empty($request["email_verified_at"])
            ]
        ]);

    } catch (Throwable $e) {

        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log("Registration SMS verification error: " . $e->getMessage());

        echo json_encode([
            "error" => true,
            "data" => "Unable to verify phone number.",
            "code" => []
        ]);
    }