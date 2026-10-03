<?php

require_once dirname(__DIR__, 2) . "/include/set-header.php";

$error = true;
$data = "Unable to send verification code.";
$code = [];

$honeypot = trim($_POST["honeypot"] ?? $_POST["website"] ?? "");

if ($honeypot !== "" && !isset($_POST["website"])) {
    echo json_encode([
        "error" => false,
        "data" => "If your details are valid, you will receive further instructions.",
        "code" => []
    ]);
    exit;
}

$email = strtolower(trim($_POST["email"] ?? ""));

if ($email === "") {
    echo json_encode([
        "error" => true,
        "data" => "Email is required.",
        "code" => []
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "error" => true,
        "data" => "Enter a valid email address.",
        "code" => []
    ]);
    exit;
}

try {
    $check_user = $conn->prepare("
        SELECT id
        FROM users
        WHERE email = :email
        LIMIT 1
    ");

    $check_user->execute([
        ":email" => $email
    ]);

    if ($check_user->fetch(PDO::FETCH_OBJ)) {
        echo json_encode([
            "error" => true,
            "data" => "An account with this email already exists.",
            "code" => []
        ]);
        exit;
    }

    $conn->beginTransaction();

    $check_request = $conn->prepare("
        SELECT
            id,
            registration_ref,
            status,
            expires_at
        FROM registration_requests
        WHERE email = :email
        AND status IN ('pending_otp', 'verified')
        AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
    ");

    $check_request->execute([
        ":email" => $email
    ]);

    $existing_request = $check_request->fetch(PDO::FETCH_OBJ);

    if ($existing_request) {
        $request_id = $existing_request->id;
        $registration_ref = $existing_request->registration_ref;

        $reset_request = $conn->prepare("
            UPDATE registration_requests
            SET
                status = 'pending_otp',
                email_verified_at = NULL,
                updated_at = NOW()
            WHERE id = :id
        ");

        $reset_request->execute([
            ":id" => $request_id
        ]);
    } else {
        $request_id = generateId();
        $registration_ref = generateId();
        $request_expires_at = date("Y-m-d H:i:s", strtotime("+30 minutes"));

        $insert_request = $conn->prepare("
            INSERT INTO registration_requests (
                id,
                registration_ref,
                email,
                status,
                expires_at
            )
            VALUES (
                :id,
                :registration_ref,
                :email,
                'pending_otp',
                :expires_at
            )
        ");

        $insert_request->execute([
            ":id" => $request_id,
            ":registration_ref" => $registration_ref,
            ":email" => $email,
            ":expires_at" => $request_expires_at
        ]);
    }

    $revoke_otps = $conn->prepare("
        UPDATE registration_otps
        SET revoked_at = NOW()
        WHERE registration_request_id = :request_id
        AND channel = 'email'
        AND purpose = 'registration_email'
        AND verified_at IS NULL
        AND revoked_at IS NULL
    ");

    $revoke_otps->execute([
        ":request_id" => $request_id
    ]);

    $otp = (string) random_int(100000, 999999);
    $otp_hash = password_hash($otp, PASSWORD_DEFAULT);
    $otp_expires_at = date("Y-m-d H:i:s", strtotime("+10 minutes"));
    $otp_id = generateId();

    $insert_otp = $conn->prepare("
        INSERT INTO registration_otps (
            id,
            registration_request_id,
            channel,
            destination,
            otp_hash,
            purpose,
            attempts,
            max_attempts,
            resend_count,
            last_sent_at,
            expires_at
        )
        VALUES (
            :id,
            :request_id,
            'email',
            :destination,
            :otp_hash,
            'registration_email',
            0,
            5,
            1,
            NOW(),
            :expires_at
        )
    ");

    $insert_otp->execute([
        ":id" => $otp_id,
        ":request_id" => $request_id,
        ":destination" => $email,
        ":otp_hash" => $otp_hash,
        ":expires_at" => $otp_expires_at
    ]);

    $conn->commit();

    $subject = "Your TRINU Registration Verification Code";

    $email_message = "
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#333;'>
            <h2 style='color:#2258BF;'>TRINU Registration</h2>
            <p>Use the verification code below to verify your email address.</p>
            <div style='background:#f4f6fa;padding:20px;text-align:center;border-radius:8px;'>
                <h1 style='letter-spacing:8px;color:#2258BF;'>" . htmlspecialchars($otp, ENT_QUOTES, "UTF-8") . "</h1>
            </div>
            <p>This code expires in 10 minutes.</p>
            <p>You have a maximum of 5 verification attempts.</p>
            <p>If you did not request this code, you can ignore this email.</p>
            <p style='color:#777;font-size:12px;'>TRINU Bonded Terminal Digital Platform</p>
        </div>
    ";

    $sent = send_email(
        $email,
        $AppName,
        $subject,
        $email_message
    );

    if (!$sent) {
        $conn->beginTransaction();

        $revoke_failed_otp = $conn->prepare("
            UPDATE registration_otps
            SET revoked_at = NOW()
            WHERE id = :id
        ");

        $revoke_failed_otp->execute([
            ":id" => $otp_id
        ]);

        $conn->commit();

        echo json_encode([
            "error" => true,
            "data" => "Unable to send verification code. Please try again.",
            "code" => []
        ]);
        exit;
    }

    $error = false;
    $data = "Verification code sent to your email.";

    $code = [
        "registration_ref" => $registration_ref,
        "email" => hide_email($email),
        "expires_in" => 600,
        "retry_after" => 60
    ];

} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log("Register send OTP error: " . $e->getMessage());

    $error = true;
    $data = "An error occurred. Please try again.";
    $code = $e->getMessage();
}

echo json_encode([
    "error" => $error,
    "data" => $data,
    "code" => $code
]);