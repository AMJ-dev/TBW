<?php
    require_once dirname(__DIR__, 2) . '/include/set-header.php';

    $code = [];
    $error = true;
    $data = "Unable to send verification code.";

    $honeypot = trim($_POST['honeypot'] ?? $_POST['website'] ?? '');

    if ($honeypot !== '') {
        echo json_encode([
            'error' => false,
            'data' => 'If your details are valid, you will receive further instructions.',
            'code' => []
        ]);
        exit;
    }

    $account_type = trim($_POST['account_type'] ?? '');
    $full_name = trim($_POST['full_name'] ?? '');
    $email = strtolower(trim($_POST['email'] ?? ''));
    $phone = trim($_POST['phone'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    $organisation_name = trim($_POST['organisation'] ?? '');
    $rc_number = trim($_POST['rc_number'] ?? '');
    $tin = trim($_POST['tin'] ?? '');
    $job_title = trim($_POST['role'] ?? '');
    $agreed = filter_var($_POST['agreed'] ?? false, FILTER_VALIDATE_BOOLEAN);

    if (
        $account_type === '' ||
        $full_name === '' ||
        $email === '' ||
        $phone === '' ||
        $password === '' ||
        $confirm_password === '' ||
        $organisation_name === ''
    ) {
        echo json_encode([
            'error' => true,
            'data' => 'Please complete all required registration fields.',
            'code' => []
        ]);
        exit;
    }

    if (!in_array($account_type, ['importer', 'agent'], true)) {
        echo json_encode([
            'error' => true,
            'data' => 'Invalid account type.',
            'code' => []
        ]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'error' => true,
            'data' => 'Enter a valid email address.',
            'code' => []
        ]);
        exit;
    }

    if (strlen($password) < 8) {
        echo json_encode([
            'error' => true,
            'data' => 'Password must be at least 8 characters.',
            'code' => []
        ]);
        exit;
    }

    if ($password !== $confirm_password) {
        echo json_encode([
            'error' => true,
            'data' => 'Passwords do not match.',
            'code' => []
        ]);
        exit;
    }

    if ($account_type === 'agent' && $rc_number === '') {
        echo json_encode([
            'error' => true,
            'data' => 'RC number is required for licensed agents.',
            'code' => []
        ]);
        exit;
    }

    if (!$agreed) {
        echo json_encode([
            'error' => true,
            'data' => 'Accept the terms and privacy notice to continue.',
            'code' => []
        ]);
        exit;
    }

    try {

        $check_user = $conn->prepare("
            SELECT id
            FROM users
            WHERE email = :email
            OR phone = :phone
            LIMIT 1
        ");

        $check_user->bindValue(':email', $email, PDO::PARAM_STR);
        $check_user->bindValue(':phone', $phone, PDO::PARAM_STR);
        $check_user->execute();

        if ($check_user->fetch(PDO::FETCH_OBJ)) {
            echo json_encode([
                'error' => true,
                'data' => 'An account with this email or phone number already exists.',
                'code' => []
            ]);
            exit;
        }

        $check_pending = $conn->prepare("
            SELECT id
            FROM registration_requests
            WHERE (email = :email OR phone = :phone)
            AND status IN ('pending_otp', 'verified')
            AND expires_at > NOW()
            LIMIT 1
        ");

        $check_pending->bindValue(':email', $email, PDO::PARAM_STR);
        $check_pending->bindValue(':phone', $phone, PDO::PARAM_STR);
        $check_pending->execute();

        if ($check_pending->fetch(PDO::FETCH_OBJ)) {
            echo json_encode([
                'error' => true,
                'data' => 'A registration with this email or phone is already in progress. Please continue with that registration or wait for it to expire.',
                'code' => []
            ]);
            exit;
        }

        $registration_ref = sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0xffff)
        );

        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        $otp = (string)random_int(100000, 999999);
        $otp_hash = password_hash($otp, PASSWORD_DEFAULT);

        $request_expires_at = date('Y-m-d H:i:s', time() + 1800);
        $otp_expires_at = date('Y-m-d H:i:s', time() + 300);

        $conn->beginTransaction();
        $request_id = generateId();

        $insert_request = $conn->prepare("
            INSERT INTO registration_requests (
                id,
                registration_ref,
                account_type,
                full_name,
                email,
                phone,
                password_hash,
                organisation_name,
                rc_number,
                tin,
                job_title,
                status,
                terms_accepted,
                privacy_accepted,
                terms_version,
                privacy_version,
                ip_address,
                user_agent,
                expires_at
            ) VALUES (
                :id,
                :registration_ref,
                :account_type,
                :full_name,
                :email,
                :phone,
                :password_hash,
                :organisation_name,
                :rc_number,
                :tin,
                :job_title,
                'pending_otp',
                1,
                1,
                '1.0',
                '1.0',
                :ip_address,
                :user_agent,
                :expires_at
            )
        ");

        $insert_request->bindValue(':id', $request_id, PDO::PARAM_STR);
        $insert_request->bindValue(':registration_ref', $registration_ref, PDO::PARAM_STR);
        $insert_request->bindValue(':account_type', $account_type, PDO::PARAM_STR);
        $insert_request->bindValue(':full_name', $full_name, PDO::PARAM_STR);
        $insert_request->bindValue(':email', $email, PDO::PARAM_STR);
        $insert_request->bindValue(':phone', $phone, PDO::PARAM_STR);
        $insert_request->bindValue(':password_hash', $password_hash, PDO::PARAM_STR);
        $insert_request->bindValue(':organisation_name', $organisation_name, PDO::PARAM_STR);
        $insert_request->bindValue(':rc_number', $rc_number !== '' ? $rc_number : null, $rc_number !== '' ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $insert_request->bindValue(':tin', $tin !== '' ? $tin : null, $tin !== '' ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $insert_request->bindValue(':job_title', $job_title !== '' ? $job_title : null, $job_title !== '' ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $insert_request->bindValue(':ip_address', $_SERVER['REMOTE_ADDR'] ?? null, isset($_SERVER['REMOTE_ADDR']) ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $insert_request->bindValue(':user_agent', substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500), PDO::PARAM_STR);
        $insert_request->bindValue(':expires_at', $request_expires_at, PDO::PARAM_STR);
        $insert_request->execute();

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
            ) VALUES (
                :id,
                :request_id,
                'email',
                :destination,
                :otp_hash,
                'registration_email',
                0,
                5,
                0,
                NOW(),
                :expires_at
            )
        ");

        $insert_otp->bindValue(':id', $otp_id, PDO::PARAM_STR);
        $insert_otp->bindValue(':request_id', $request_id, PDO::PARAM_STR);
        $insert_otp->bindValue(':destination', $email, PDO::PARAM_STR);
        $insert_otp->bindValue(':otp_hash', $otp_hash, PDO::PARAM_STR);
        $insert_otp->bindValue(':expires_at', $otp_expires_at, PDO::PARAM_STR);
        $insert_otp->execute();

        $conn->commit();

        $subject = 'Your TRINU Registration Verification Code';

        $email_message = "
            <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#333;'>
                <h2 style='color:#2258BF;'>TRINU Registration</h2>
                <p>Hello " . htmlspecialchars($full_name, ENT_QUOTES, 'UTF-8') . ",</p>
                <p>Use the verification code below to verify your email address.</p>
                <div style='background:#f4f6fa;padding:20px;text-align:center;border-radius:8px;'>
                    <h1 style='letter-spacing:8px;color:#2258BF;'>" . htmlspecialchars($otp, ENT_QUOTES, 'UTF-8') . "</h1>
                </div>
                <p>This code expires in 5 minutes. You have a maximum of 5 verification attempts.</p>
                <p>If you did not request this code, you can ignore this email.</p>
                <p style='color:#777;font-size:12px;'>TRINU Bonded Terminal Digital Platform</p>
            </div>
        ";

        $sent = send_email($email, $full_name, $subject, $email_message);

        if (!$sent) {

            $conn->beginTransaction();

            $delete_request = $conn->prepare("
                DELETE FROM registration_requests
                WHERE id = :id
                AND status = 'pending_otp'
            ");

            $delete_request->bindValue(':id', $request_id, PDO::PARAM_INT);
            $delete_request->execute();

            $conn->commit();

            $data = "Unable to send verification code. Please try again.";

        } else {

            $error = false;
            $data = "Verification code sent to your email.";

            $code = [
                'registration_ref' => $registration_ref,
                'email' => hide_email($email),
                'expires_in' => 300,
                'retry_after' => 60
            ];
        }

    } catch (Throwable $e) {

        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log('Register send OTP error: ' . $e->getMessage());

        $data = "An error occurred. Please try again.";
    }

    echo json_encode([
        'error' => $error,
        'data' => $data,
        'code' => $code
    ]);