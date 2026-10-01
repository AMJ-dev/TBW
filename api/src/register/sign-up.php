<?php
    require_once dirname(__DIR__, 2) . '/include/set-header.php';

    $code = [];
    $error = true;
    $data = "Unable to complete registration.";

    $honeypot = trim($_POST['honeypot'] ?? $_POST['website'] ?? '');
    $registration_ref = trim($_POST['registration_ref'] ?? '');
    $email_verification_code = trim($_POST['email_verification_code'] ?? '');
    $phone_verification_code = trim($_POST['phone_verification_code'] ?? '');

    if ($honeypot !== '') {
        echo json_encode([
            'error' => false,
            'data' => 'If your details are valid, you will receive further instructions.',
            'code' => []
        ]);
        exit;
    }

    if ($registration_ref === '') {
        echo json_encode([
            'error' => true,
            'data' => 'Registration reference is required.',
            'code' => []
        ]);
        exit;
    }

    if (!preg_match('/^[0-9]{6}$/', $email_verification_code)) {
        echo json_encode([
            'error' => true,
            'data' => 'A valid 6-digit email verification code is required.',
            'code' => []
        ]);
        exit;
    }

    if (!preg_match('/^[0-9]{6}$/', $phone_verification_code)) {
        echo json_encode([
            'error' => true,
            'data' => 'A valid 6-digit phone verification code is required.',
            'code' => []
        ]);
        exit;
    }

    $max_file_size = 5 * 1024 * 1024;

    $accepted_mimes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

    $required_documents = [
        'cac',
        'tin',
        'signatory_id'
    ];

    $uploaded_files = [];

    try {

        $conn->beginTransaction();

        $request_query = $conn->prepare("
            SELECT *
            FROM registration_requests
            WHERE registration_ref = :registration_ref
            LIMIT 1
            FOR UPDATE
        ");

        $request_query->execute([
            ':registration_ref' => $registration_ref
        ]);

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

        if ($request->status === 'completed') {
            $conn->commit();

            echo json_encode([
                'error' => false,
                'data' => 'Registration has already been submitted.',
                'code' => [
                    'registration_ref' => $registration_ref,
                    'user_id' => $request->completed_user_id,
                    'status' => 'completed'
                ]
            ]);
            exit;
        }

        if (!in_array($request->status, ['pending_otp', 'verified'], true)) {
            $conn->rollBack();

            echo json_encode([
                'error' => true,
                'data' => 'This registration cannot be completed in its current status.',
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

            $expire_request->execute([
                ':id' => $request->id
            ]);

            $conn->commit();

            echo json_encode([
                'error' => true,
                'data' => 'Registration request has expired. Please register again.',
                'code' => []
            ]);
            exit;
        }

        $email_otp_query = $conn->prepare("
            SELECT
                id,
                otp_hash,
                attempts,
                max_attempts,
                expires_at,
                verified_at,
                revoked_at
            FROM registration_otps
            WHERE registration_request_id = :request_id
            AND channel = 'email'
            AND destination = :destination
            AND purpose = 'registration_email'
            AND revoked_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            FOR UPDATE
        ");

        $email_otp_query->execute([
            ':request_id' => $request->id,
            ':destination' => $request->email
        ]);

        $email_otp = $email_otp_query->fetch(PDO::FETCH_OBJ);

        if (!$email_otp) {
            $conn->rollBack();

            echo json_encode([
                'error' => true,
                'data' => 'No email verification code found. Please request a new code.',
                'code' => []
            ]);
            exit;
        }

        if (strtotime($email_otp->expires_at) <= time()) {

            if ($email_otp->verified_at === null) {
                $revoke_email = $conn->prepare("
                    UPDATE registration_otps
                    SET revoked_at = NOW()
                    WHERE id = :id
                ");

                $revoke_email->execute([
                    ':id' => $email_otp->id
                ]);

                $conn->commit();

                echo json_encode([
                    'error' => true,
                    'data' => 'Email verification code has expired. Please request a new code.',
                    'code' => []
                ]);
                exit;
            }
        }

        if (
            $email_otp->verified_at === null &&
            (int)$email_otp->attempts >= (int)$email_otp->max_attempts
        ) {

            $revoke_email = $conn->prepare("
                UPDATE registration_otps
                SET revoked_at = NOW()
                WHERE id = :id
            ");

            $revoke_email->execute([
                ':id' => $email_otp->id
            ]);

            $lock_request = $conn->prepare("
                UPDATE registration_requests
                SET status = 'locked'
                WHERE id = :id
            ");

            $lock_request->execute([
                ':id' => $request->id
            ]);

            $conn->commit();

            echo json_encode([
                'error' => true,
                'data' => 'Maximum email verification attempts exceeded. Please register again.',
                'code' => []
            ]);
            exit;
        }

        if (!password_verify($email_verification_code, $email_otp->otp_hash)) {

            if ($email_otp->verified_at === null) {
                $attempt_email = $conn->prepare("
                    UPDATE registration_otps
                    SET attempts = attempts + 1
                    WHERE id = :id
                ");

                $attempt_email->execute([
                    ':id' => $email_otp->id
                ]);
            }

            $conn->commit();

            echo json_encode([
                'error' => true,
                'data' => 'Invalid email verification code.',
                'code' => []
            ]);
            exit;
        }

        if ($email_otp->verified_at === null) {

            $verify_email = $conn->prepare("
                UPDATE registration_otps
                SET verified_at = NOW()
                WHERE id = :id
                AND verified_at IS NULL
                AND revoked_at IS NULL
            ");

            $verify_email->execute([
                ':id' => $email_otp->id
            ]);
        }

        $update_email = $conn->prepare("
            UPDATE registration_requests
            SET email_verified_at = COALESCE(email_verified_at, NOW())
            WHERE id = :id
        ");

        $update_email->execute([
            ':id' => $request->id
        ]);

        $request->email_verified_at = $request->email_verified_at ?? date('Y-m-d H:i:s');

        $phone_otp_query = $conn->prepare("
            SELECT
                id,
                otp_hash,
                attempts,
                max_attempts,
                expires_at,
                verified_at,
                revoked_at
            FROM registration_otps
            WHERE registration_request_id = :request_id
            AND channel = 'sms'
            AND destination = :destination
            AND purpose = 'registration_phone'
            AND revoked_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            FOR UPDATE
        ");

        $phone_otp_query->execute([
            ':request_id' => $request->id,
            ':destination' => $request->phone
        ]);

        $phone_otp = $phone_otp_query->fetch(PDO::FETCH_OBJ);

        if (!$phone_otp) {
            $conn->rollBack();

            echo json_encode([
                'error' => true,
                'data' => 'No phone verification code found. Please request a new code.',
                'code' => []
            ]);
            exit;
        }

        if (strtotime($phone_otp->expires_at) <= time()) {

            if ($phone_otp->verified_at === null) {
                $revoke_phone = $conn->prepare("
                    UPDATE registration_otps
                    SET revoked_at = NOW()
                    WHERE id = :id
                ");

                $revoke_phone->execute([
                    ':id' => $phone_otp->id
                ]);

                $conn->commit();

                echo json_encode([
                    'error' => true,
                    'data' => 'Phone verification code has expired. Please request a new code.',
                    'code' => []
                ]);
                exit;
            }
        }

        if (
            $phone_otp->verified_at === null &&
            (int)$phone_otp->attempts >= (int)$phone_otp->max_attempts
        ) {

            $revoke_phone = $conn->prepare("
                UPDATE registration_otps
                SET revoked_at = NOW()
                WHERE id = :id
            ");

            $revoke_phone->execute([
                ':id' => $phone_otp->id
            ]);

            $lock_request = $conn->prepare("
                UPDATE registration_requests
                SET status = 'locked'
                WHERE id = :id
            ");

            $lock_request->execute([
                ':id' => $request->id
            ]);

            $conn->commit();

            echo json_encode([
                'error' => true,
                'data' => 'Maximum phone verification attempts exceeded. Please register again.',
                'code' => []
            ]);
            exit;
        }

        if (!password_verify($phone_verification_code, $phone_otp->otp_hash)) {

            if ($phone_otp->verified_at === null) {
                $attempt_phone = $conn->prepare("
                    UPDATE registration_otps
                    SET attempts = attempts + 1
                    WHERE id = :id
                ");

                $attempt_phone->execute([
                    ':id' => $phone_otp->id
                ]);
            }

            $conn->commit();

            echo json_encode([
                'error' => true,
                'data' => 'Invalid phone verification code.',
                'code' => []
            ]);
            exit;
        }

        if ($phone_otp->verified_at === null) {

            $verify_phone = $conn->prepare("
                UPDATE registration_otps
                SET verified_at = NOW()
                WHERE id = :id
                AND verified_at IS NULL
                AND revoked_at IS NULL
            ");

            $verify_phone->execute([
                ':id' => $phone_otp->id
            ]);
        }

        $update_phone = $conn->prepare("
            UPDATE registration_requests
            SET phone_verified_at = COALESCE(phone_verified_at, NOW())
            WHERE id = :id
        ");

        $update_phone->execute([
            ':id' => $request->id
        ]);

        $request->phone_verified_at = $request->phone_verified_at ?? date('Y-m-d H:i:s');

        if (
            empty($request->email_verified_at) ||
            empty($request->phone_verified_at)
        ) {
            $conn->rollBack();

            echo json_encode([
                'error' => true,
                'data' => 'Both email and phone number must be verified before completing registration.',
                'code' => []
            ]);
            exit;
        }

        $set_verified = $conn->prepare("
            UPDATE registration_requests
            SET status = 'verified'
            WHERE id = :id
        ");

        $set_verified->execute([
            ':id' => $request->id
        ]);

        $request->status = 'verified';

        if (
            !$request->terms_accepted ||
            !$request->privacy_accepted
        ) {
            $conn->rollBack();

            echo json_encode([
                'error' => true,
                'data' => 'Terms and privacy acceptance is required.',
                'code' => []
            ]);
            exit;
        }

        foreach ($required_documents as $document) {

            if (
                !isset($_FILES[$document]) ||
                $_FILES[$document]['error'] !== UPLOAD_ERR_OK
            ) {
                throw new RuntimeException(
                    "Required document missing: " . $document
                );
            }

            if ($_FILES[$document]['size'] > $max_file_size) {
                throw new RuntimeException(
                    "Each document must be 5MB or smaller."
                );
            }

            if (!in_array($_FILES[$document]['type'], $accepted_mimes, true)) {
                throw new RuntimeException(
                    "Only PDF, JPG, PNG, or WebP files are accepted."
                );
            }
        }

        $licences = [];

        if (!empty($_POST['licences'])) {

            $decoded_licences = json_decode(
                $_POST['licences'],
                true
            );

            if (!is_array($decoded_licences)) {
                throw new RuntimeException("Invalid licence information.");
            }

            foreach ($decoded_licences as $licence) {

                if (
                    empty($licence['id']) ||
                    empty($licence['type']) ||
                    empty($licence['reference'])
                ) {
                    continue;
                }

                $licences[] = [
                    'id' => trim($licence['id']),
                    'type' => trim($licence['type']),
                    'reference' => trim($licence['reference'])
                ];
            }
        }

        if ($request->account_type === 'agent') {

            $has_ncs = false;

            foreach ($licences as $licence) {

                if (
                    $licence['type'] === 'ncs_customs_agent' &&
                    $licence['reference'] !== ''
                ) {
                    $has_ncs = true;
                    break;
                }
            }

            if (!$has_ncs) {
                throw new RuntimeException(
                    "Licensed agents must provide an NCS Customs Agent Licence."
                );
            }
        }

        $check_user = $conn->prepare("
            SELECT id
            FROM users
            WHERE email = :email
            OR phone = :phone
            LIMIT 1
        ");

        $check_user->execute([
            ':email' => $request->email,
            ':phone' => $request->phone
        ]);

        if ($check_user->fetch(PDO::FETCH_OBJ)) {
            $conn->rollBack();

            echo json_encode([
                'error' => true,
                'data' => 'An account with this email or phone number already exists.',
                'code' => []
            ]);
            exit;
        }

        $organisation_check = $conn->prepare("
            SELECT id
            FROM organisations
            WHERE
                (:rc_number IS NOT NULL AND :rc_number <> '' AND rc_number = :rc_number)
                OR
                (:tin IS NOT NULL AND :tin <> '' AND tin = :tin)
            LIMIT 1
        ");

        $organisation_check->execute([
            ':rc_number' => $request->rc_number,
            ':tin' => $request->tin
        ]);

        if ($organisation_check->fetch(PDO::FETCH_OBJ)) {
            $conn->rollBack();

            echo json_encode([
                'error' => true,
                'data' => 'An organisation with this RC number or TIN already exists.',
                'code' => []
            ]);
            exit;
        }

        foreach ($required_documents as $document) {

            $upload = upload_files(
                $_FILES[$document],
                $accepted_mimes
            );

            if ($upload['error']) {
                throw new RuntimeException(
                    "Unable to upload " . $document . " document."
                );
            }

            $uploaded_files[] = $upload['data'];
        }

        $licence_uploads = [];

        foreach ($licences as $index => $licence) {

            $file_key = 'licence_file_' . $index;

            if (!isset($_FILES[$file_key])) {
                continue;
            }

            if ($_FILES[$file_key]['error'] !== UPLOAD_ERR_OK) {
                throw new RuntimeException(
                    "Unable to upload licence document."
                );
            }

            if ($_FILES[$file_key]['size'] > $max_file_size) {
                throw new RuntimeException(
                    "Each licence document must be 5MB or smaller."
                );
            }

            if (!in_array($_FILES[$file_key]['type'], $accepted_mimes, true)) {
                throw new RuntimeException(
                    "Only PDF, JPG, PNG, or WebP files are accepted."
                );
            }

            $upload = upload_files(
                $_FILES[$file_key],
                $accepted_mimes
            );

            if ($upload['error']) {
                throw new RuntimeException(
                    "Unable to upload licence document."
                );
            }

            $uploaded_files[] = $upload['data'];

            $licence_uploads[$licence['id']] = $upload['data'];
        }

        $organisation_id = generateId();

        $organisation_query = $conn->prepare("
            INSERT INTO organisations (
                id,
                organisation_name,
                rc_number,
                tin,
                organisation_type,
                verification_status
            ) VALUES (
                :id,
                :organisation_name,
                :rc_number,
                :tin,
                :organisation_type,
                'pending'
            )
        ");

        $organisation_query->execute([
            ':id' => $organisation_id,
            ':organisation_name' => $request->organisation_name,
            ':rc_number' => $request->rc_number,
            ':tin' => $request->tin,
            ':organisation_type' => $request->account_type
        ]);

        $user_id = generateId();

        $user_query = $conn->prepare("
            INSERT INTO users (
                id,
                organisation_id,
                account_type,
                full_name,
                email,
                phone,
                password_hash,
                email_verified_at,
                phone_verified_at,
                account_status,
                password_changed_at
            ) VALUES (
                :id,
                :organisation_id,
                'organisation',
                :full_name,
                :email,
                :phone,
                :password_hash,
                :email_verified_at,
                :phone_verified_at,
                'pending_approval',
                NOW()
            )
        ");

        $user_query->execute([
            ':id' => $user_id,
            ':organisation_id' => $organisation_id,
            ':full_name' => $request->full_name,
            ':email' => $request->email,
            ':phone' => $request->phone,
            ':password_hash' => $request->password_hash,
            ':email_verified_at' => $request->email_verified_at,
            ':phone_verified_at' => $request->phone_verified_at
        ]);

        $role_query = $conn->prepare("
            SELECT id
            FROM roles
            WHERE role_key = 'organisation_owner'
            AND scope = 'organisation'
            AND is_active = 1
            LIMIT 1
        ");

        $role_query->execute();

        $role = $role_query->fetch(PDO::FETCH_OBJ);

        if (!$role) {
            throw new RuntimeException(
                "Organisation owner role is not configured."
            );
        }

        $membership_id = generateId();

        $membership_query = $conn->prepare("
            INSERT INTO organisation_members (
                id,
                organisation_id,
                user_id,
                role_id,
                job_title,
                membership_status,
                joined_at
            ) VALUES (
                :id,
                :organisation_id,
                :user_id,
                :role_id,
                :job_title,
                'pending',
                NULL
            )
        ");

        $membership_query->execute([
            ':id' => $membership_id,
            ':organisation_id' => $organisation_id,
            ':user_id' => $user_id,
            ':role_id' => $role->id,
            ':job_title' => $request->job_title
        ]);

        $document_insert = $conn->prepare("
            INSERT INTO registration_documents (
                id,
                registration_request_id,
                document_type,
                file_path,
                original_name,
                mime_type,
                file_size
            ) VALUES (
                :id,
                :registration_request_id,
                :document_type,
                :file_path,
                :original_name,
                :mime_type,
                :file_size
            )
        ");

        foreach ($required_documents as $document) {

            $document_insert->execute([
                ':id' => generateId(),
                ':registration_request_id' => $request->id,
                ':document_type' => $document,
                ':file_path' => $uploaded_files[array_search($document, $required_documents)],
                ':original_name' => $_FILES[$document]['name'],
                ':mime_type' => $_FILES[$document]['type'],
                ':file_size' => $_FILES[$document]['size']
            ]);
        }

        $licence_insert = $conn->prepare("
            INSERT INTO registration_documents (
                id,
                registration_request_id,
                document_type,
                licence_type,
                licence_reference,
                file_path,
                original_name,
                mime_type,
                file_size
            ) VALUES (
                :id,
                :registration_request_id,
                'licence',
                :licence_type,
                :licence_reference,
                :file_path,
                :original_name,
                :mime_type,
                :file_size
            )
        ");

        foreach ($licences as $index => $licence) {

            if (!isset($licence_uploads[$licence['id']])) {
                continue;
            }

            $file_key = 'licence_file_' . $index;

            $licence_insert->execute([
                ':id' => generateId(),
                ':registration_request_id' => $request->id,
                ':licence_type' => $licence['type'],
                ':licence_reference' => $licence['reference'],
                ':file_path' => $licence_uploads[$licence['id']],
                ':original_name' => $_FILES[$file_key]['name'],
                ':mime_type' => $_FILES[$file_key]['type'],
                ':file_size' => $_FILES[$file_key]['size']
            ]);
        }

        $email_event = $conn->prepare("
            INSERT INTO account_events (
                id,
                user_id,
                event,
                ip_address,
                device_name,
                detail
            ) VALUES (
                :id,
                :user_id,
                'email_verified',
                :ip_address,
                :device_name,
                :detail
            )
        ");

        $email_event->execute([
            ':id' => generateId(),
            ':user_id' => $user_id,
            ':ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            ':device_name' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 128),
            ':detail' => json_encode([
                'message' => 'Email verified during registration.',
                'registration_ref' => $registration_ref
            ])
        ]);

        $phone_event = $conn->prepare("
            INSERT INTO account_events (
                id,
                user_id,
                event,
                ip_address,
                device_name,
                detail
            ) VALUES (
                :id,
                :user_id,
                'phone_verified',
                :ip_address,
                :device_name,
                :detail
            )
        ");

        $phone_event->execute([
            ':id' => generateId(),
            ':user_id' => $user_id,
            ':ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            ':device_name' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 128),
            ':detail' => json_encode([
                'message' => 'Phone number verified during registration.',
                'registration_ref' => $registration_ref
            ])
        ]);

        $complete_request = $conn->prepare("
            UPDATE registration_requests
            SET
                status = 'completed',
                completed_user_id = :user_id
            WHERE id = :id
            AND status = 'verified'
            AND email_verified_at IS NOT NULL
            AND phone_verified_at IS NOT NULL
        ");

        $complete_request->execute([
            ':user_id' => $user_id,
            ':id' => $request->id
        ]);

        if ($complete_request->rowCount() !== 1) {
            throw new RuntimeException(
                'Unable to complete registration request.'
            );
        }

        $conn->commit();

        $error = false;
        $data = "Registration submitted successfully. Your account is pending approval.";

        $code = [
            'registration_ref' => $registration_ref,
            'user_id' => $user_id,
            'organisation_id' => $organisation_id,
            'email_verified' => true,
            'phone_verified' => true,
            'status' => 'pending_approval'
        ];

    } catch (PDOException $e) {

        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        foreach ($uploaded_files as $file) {
            $path = dirname(__DIR__, 1) . "/" . $file;

            if (is_file($path)) {
                @unlink($path);
            }
        }

        error_log('Sign-up database error: ' . $e->getMessage());

        if ($e->getCode() === '23000') {
            $data = "An account or organisation with these details already exists.";
        } else {
            $data = "An error occurred while completing registration.";
        }

    } catch (Throwable $e) {

        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        foreach ($uploaded_files as $file) {
            $path = dirname(__DIR__, 1) . "/" . $file;

            if (is_file($path)) {
                @unlink($path);
            }
        }

        error_log('Sign-up error: ' . $e->getMessage());

        $data = $e->getMessage();
    }

    echo json_encode([
        'error' => $error,
        'data' => $data,
        'code' => $code
    ]);