<?php

require_once dirname(__DIR__, 2) . "/include/set-header.php";

$code = [];
$error = true;
$data = "Unable to send SMS verification code.";

$honeypot = trim($_POST["honeypot"] ?? $_POST["website"] ?? "");
$phone = trim($_POST["phone"] ?? "");
$registration_ref = trim($_POST["registration_ref"] ?? "");

if ($honeypot !== "") {
    echo json_encode([
        "error" => false,
        "data" => "If your details are valid, you will receive further instructions.",
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

try {

    $conn->beginTransaction();

    $request_query = $conn->prepare("
        SELECT
            id,
            registration_ref,
            email,
            phone,
            status,
            email_verified_at,
            phone_verified_at,
            expires_at
        FROM registration_requests
        WHERE registration_ref = :registration_ref
        LIMIT 1
        FOR UPDATE
    ");

    $request_query->execute([
        ":registration_ref" => $registration_ref
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

    $expire = $conn->prepare("UPDATE registration_requests SET phone = :phone, status = 'verified' WHERE id = :id")->execute([
        ":id" => $request["id"],
        ":phone" => $phone
    ]);

    if ($request["status"] === "completed") {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "Registration has already been completed.",
            "code" => []
        ]);
        exit;
    }

    if ($request["status"] !== "verified") {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "Verify your email before requesting phone verification.",
            "code" => []
        ]);
        exit;
    }

    if (strtotime($request["expires_at"]) <= time()) {

        $expire = $conn->prepare("UPDATE registration_requests SET status = 'expired' WHERE id = :id");
        $expire->execute([":id" => $request["id"]]);

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
                "registration_ref" => $request["registration_ref"],
                "email" => hide_email($request["email"]),
                "phone_verified" => true
            ]
        ]);
        exit;
    }

    $latest = $conn->prepare("
        SELECT
            id,
            resend_count,
            last_sent_at
        FROM registration_otps
        WHERE registration_request_id = :registration_request_id
        AND channel = 'sms'
        AND purpose = 'registration_phone'
        AND revoked_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
    ");

    $latest->execute([
        ":registration_request_id" => $request["id"]
    ]);

    $previous = $latest->fetch(PDO::FETCH_ASSOC);

    if ($previous && !empty($previous["last_sent_at"])) {

        $last_sent = strtotime($previous["last_sent_at"]);

        if ($last_sent !== false && (time() - $last_sent) < 60) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Please wait before requesting another SMS code.",
                "code" => [
                    "retry_after" => 60 - (time() - $last_sent)
                ]
            ]);
            exit;
        }
    }

    $resend_count = $previous
        ? ((int)$previous["resend_count"] + 1)
        : 1;

    if ($resend_count > 10) {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "Too many SMS verification requests. Please try again later.",
            "code" => []
        ]);
        exit;
    }

    $revoke = $conn->prepare("
        UPDATE registration_otps
        SET revoked_at = NOW()
        WHERE registration_request_id = :registration_request_id
        AND channel = 'sms'
        AND purpose = 'registration_phone'
        AND verified_at IS NULL
        AND revoked_at IS NULL
    ");

    $revoke->execute([
        ":registration_request_id" => $request["id"]
    ]);

    $otp = str_pad(
        (string)random_int(0, 999999),
        6,
        "0",
        STR_PAD_LEFT
    );

    $otp_hash = password_hash($otp, PASSWORD_DEFAULT);
    $otp_id = generateId();
    $expires_at = date("Y-m-d H:i:s", time() + 300);

    $message = "Your TRINŪ access sequence is {$otp}. Valid for 5 minutes. Keep this information confidential.";

    $sms = send_sms($phone, $message);

    if (!$sms["success"]) {
        $conn->rollBack();

        error_log(
            "Registration SMS error: " .
            json_encode($sms["response"])
        );

        echo json_encode([
            "error" => true,
            "data" => "Unable to send SMS verification code. Please try again.",
            "code" => []
        ]);
        exit;
    }

    $insert = $conn->prepare("
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
            :registration_request_id,
            'sms',
            :destination,
            :otp_hash,
            'registration_phone',
            0,
            5,
            :resend_count,
            NOW(),
            :expires_at
        )
    ");

    $insert->execute([
        ":id" => $otp_id,
        ":registration_request_id" => $request["id"],
        ":destination" => $phone,
        ":otp_hash" => $otp_hash,
        ":resend_count" => $resend_count,
        ":expires_at" => $expires_at
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Verification code sent to your phone.",
        "code" => [
            "registration_ref" => $request["registration_ref"],
            "email" => hide_email($request["email"]),
            "phone" => $phone,
            "expires_in" => 300,
            "retry_after" => 60
        ]
    ]);

} catch (Throwable $e) {

    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log(
        "Registration SMS send error: " .
        $e->getMessage()
    );

    echo json_encode([
        "error" => true,
        "data" => "Unable to send SMS verification code.",
        "code" => []
    ]);
}