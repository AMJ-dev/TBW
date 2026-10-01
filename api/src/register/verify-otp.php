<?php
    require_once dirname(__DIR__, 2) . '/include/set-header.php';

    $code = [];
    $error = true;
    $data = "Unable to verify email.";

    $honeypot = trim($_POST['honeypot'] ?? $_POST['website'] ?? '');

    if ($honeypot !== '') {
        echo json_encode([
            'error' => false,
            'data' => 'If your details are valid, you will receive further instructions.',
            'code' => []
        ]);
        exit;
    }

    $registration_ref = trim($_POST['registration_ref'] ?? '');
    $verification_code = trim($_POST['verification_code'] ?? '');

    if ($registration_ref === '' || $verification_code === '') {
        echo json_encode([
            'error' => true,
            'data' => 'Registration reference and verification code are required.',
            'code' => []
        ]);
        exit;
    }

    if (!preg_match('/^\d{6}$/', $verification_code)) {
        echo json_encode([
            'error' => true,
            'data' => 'Enter a valid 6-digit verification code.',
            'code' => []
        ]);
        exit;
    }

    try {

        $conn->beginTransaction();

        $request_query = $conn->prepare("
            SELECT id, email, full_name, status, expires_at, email_verified_at
            FROM registration_requests
            WHERE registration_ref = :registration_ref
            LIMIT 1
            FOR UPDATE
        ");

        $request_query->bindValue(':registration_ref', $registration_ref, PDO::PARAM_STR);
        $request_query->execute();

        $request = $request_query->fetch(PDO::FETCH_OBJ);

        if (!$request) {
            $conn->rollBack();

            echo json_encode([
                'error' => true,
                'data' => 'Registration request not found.',
                'code' => []
            ]);
            exit;
        }

        if ($request->status === 'verified' && $request->email_verified_at !== null) {
            $conn->commit();

            echo json_encode([
                'error' => false,
                'data' => 'Email already verified.',
                'code' => [
                    'registration_ref' => $registration_ref,
                    'email' => hide_email($request->email),
                    'verified' => true
                ]
            ]);
            exit;
        }

        if ($request->status !== 'pending_otp') {
            $conn->rollBack();

            echo json_encode([
                'error' => true,
                'data' => 'This registration cannot be verified in its current status.',
                'code' => []
            ]);
            exit;
        }

        if (strtotime($request->expires_at) <= time()) {

            $expire_request = $conn->prepare("
                UPDATE registration_requests
                SET status = 'expired'
                WHERE id = :id
            ");

            $expire_request->bindValue(':id', $request->id, PDO::PARAM_INT);
            $expire_request->execute();

            $conn->commit();

            echo json_encode([
                'error' => true,
                'data' => 'Registration request has expired. Please register again.',
                'code' => []
            ]);
            exit;
        }

        $otp_query = $conn->prepare("
            SELECT id, otp_hash, attempts, max_attempts, expires_at
            FROM registration_otps
            WHERE registration_request_id = :request_id
            AND channel = 'email'
            AND purpose = 'registration_email'
            AND verified_at IS NULL
            AND revoked_at IS NULL
            ORDER BY id DESC
            LIMIT 1
            FOR UPDATE
        ");

        $otp_query->bindValue(':request_id', $request->id, PDO::PARAM_INT);
        $otp_query->execute();

        $otp_record = $otp_query->fetch(PDO::FETCH_OBJ);

        if (!$otp_record) {
            $conn->rollBack();

            echo json_encode([
                'error' => true,
                'data' => 'No active verification code found. Please request a new code.',
                'code' => []
            ]);
            exit;
        }

        if (strtotime($otp_record->expires_at) <= time()) {
            $conn->rollBack();

            echo json_encode([
                'error' => true,
                'data' => 'Verification code has expired. Please request a new code.',
                'code' => []
            ]);
            exit;
        }

        if ((int)$otp_record->attempts >= (int)$otp_record->max_attempts) {

            $lock_otp = $conn->prepare("
                UPDATE registration_otps
                SET revoked_at = NOW()
                WHERE id = :id
            ");

            $lock_otp->bindValue(':id', $otp_record->id, PDO::PARAM_INT);
            $lock_otp->execute();

            $lock_request = $conn->prepare("
                UPDATE registration_requests
                SET status = 'locked'
                WHERE id = :id
            ");

            $lock_request->bindValue(':id', $request->id, PDO::PARAM_INT);
            $lock_request->execute();

            $conn->commit();

            echo json_encode([
                'error' => true,
                'data' => 'Maximum verification attempts exceeded. Please register again.',
                'code' => []
            ]);
            exit;
        }

        if (!password_verify($verification_code, $otp_record->otp_hash)) {

            $increment = $conn->prepare("
                UPDATE registration_otps
                SET attempts = attempts + 1
                WHERE id = :id
            ");

            $increment->bindValue(':id', $otp_record->id, PDO::PARAM_INT);
            $increment->execute();

            $attempts_left = max(
                0,
                (int)$otp_record->max_attempts - (int)$otp_record->attempts - 1
            );

            if ($attempts_left === 0) {

                $revoke = $conn->prepare("
                    UPDATE registration_otps
                    SET revoked_at = NOW()
                    WHERE id = :id
                ");

                $revoke->bindValue(':id', $otp_record->id, PDO::PARAM_INT);
                $revoke->execute();

                $lock_request = $conn->prepare("
                    UPDATE registration_requests
                    SET status = 'locked'
                    WHERE id = :id
                ");

                $lock_request->bindValue(':id', $request->id, PDO::PARAM_INT);
                $lock_request->execute();
            }

            $conn->commit();

            echo json_encode([
                'error' => true,
                'data' => $attempts_left > 0
                    ? "Incorrect verification code. {$attempts_left} attempts remaining."
                    : "Maximum attempts exceeded. Please register again.",
                'code' => [
                    'attempts_left' => $attempts_left
                ]
            ]);
            exit;
        }

        $verify_otp = $conn->prepare("
            UPDATE registration_otps
            SET verified_at = NOW()
            WHERE id = :id
        ");

        $verify_otp->bindValue(':id', $otp_record->id, PDO::PARAM_INT);
        $verify_otp->execute();

        $verify_request = $conn->prepare("
            UPDATE registration_requests
            SET email_verified_at = NOW(),
                status = 'verified'
            WHERE id = :id
            AND status = 'pending_otp'
        ");

        $verify_request->bindValue(':id', $request->id, PDO::PARAM_INT);
        $verify_request->execute();

        $conn->commit();

        $error = false;
        $data = "Email verified successfully.";

        $code = [
            'registration_ref' => $registration_ref,
            'email' => hide_email($request->email),
            'verified' => true
        ];

    } catch (Throwable $e) {

        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log('Register verify OTP error: ' . $e->getMessage());

        $data = "An error occurred. Please try again.";
    }

    echo json_encode([
        'error' => $error,
        'data' => $data,
        'code' => $code
    ]);