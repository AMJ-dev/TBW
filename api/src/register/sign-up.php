<?php

    require_once dirname(__DIR__, 2) . '/include/set-header.php';


    $input = json_decode(file_get_contents('php://input'), true);
    $input = is_array($input) ? array_merge($_POST, $input) : $_POST;

    $code = [];
    $error = true;
    $data = "Unable to complete registration.";

    $honeypot = trim($input['honeypot'] ?? $input['website'] ?? '');

    if ($honeypot !== '') {
        echo json_encode([
            'error' => false,
            'data' => 'If your details are valid, you will receive further instructions.',
            'code' => []
        ]);
        exit;
    }

    $registration_ref = trim($input['registration_ref'] ?? '');

    if ($registration_ref === '') {
        echo json_encode([
            'error' => true,
            'data' => 'Registration reference is required.',
            'code' => []
        ]);
        exit;
    }

    try {

        $conn->beginTransaction();

        $request_query = $conn->prepare("
            SELECT *
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

        if ($request->status !== 'verified' || $request->email_verified_at === null) {
            $conn->rollBack();

            echo json_encode([
                'error' => true,
                'data' => 'Please verify your email before completing registration.',
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

        $check_user = $conn->prepare("
            SELECT id
            FROM users
            WHERE email = :email
            OR phone = :phone
            LIMIT 1
        ");

        $check_user->bindValue(':email', $request->email, PDO::PARAM_STR);
        $check_user->bindValue(':phone', $request->phone, PDO::PARAM_STR);
        $check_user->execute();

        if ($check_user->fetch(PDO::FETCH_OBJ)) {
            $conn->rollBack();

            echo json_encode([
                'error' => true,
                'data' => 'An account with this email or phone number already exists.',
                'code' => []
            ]);
            exit;
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

        $organisation_query->bindValue(':id', $organisation_id, PDO::PARAM_STR);
        $organisation_query->bindValue(':organisation_name', $request->organisation_name, PDO::PARAM_STR);
        $organisation_query->bindValue(':rc_number', $request->rc_number, $request->rc_number !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $organisation_query->bindValue(':tin', $request->tin, $request->tin !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $organisation_query->bindValue(':organisation_type', $request->account_type, PDO::PARAM_STR);
        $organisation_query->execute();

        $user_id = generateId();
        $user_query = $conn->prepare("
            INSERT INTO users (
                id,
                organisation_id,
                full_name,
                email,
                phone,
                password_hash,
                email_verified_at,
                account_status,
                password_changed_at
            ) VALUES (
                :id,
                :organisation_id,
                :full_name,
                :email,
                :phone,
                :password_hash,
                :email_verified_at,
                'pending_approval',
                NOW()
            )
        ");

        $user_query->bindValue(':id', $user_id, PDO::PARAM_STR);
        $user_query->bindValue(':organisation_id', $organisation_id, PDO::PARAM_STR);
        $user_query->bindValue(':full_name', $request->full_name, PDO::PARAM_STR);
        $user_query->bindValue(':email', $request->email, PDO::PARAM_STR);
        $user_query->bindValue(':phone', $request->phone, PDO::PARAM_STR);
        $user_query->bindValue(':password_hash', $request->password_hash, PDO::PARAM_STR);
        $user_query->bindValue(':email_verified_at', $request->email_verified_at, PDO::PARAM_STR);
        $user_query->execute();

        $membership_id = generateId();
        $membership_query = $conn->prepare("
            INSERT INTO organisation_members (
                id,
                organisation_id,
                user_id,
                member_role,
                job_title,
                membership_status,
                joined_at
            ) VALUES (
                :id,
                :organisation_id,
                :user_id,
                'owner',
                :job_title,
                'pending',
                NULL
            )
        ");

        $membership_query->bindValue(':id', $membership_id, PDO::PARAM_STR);
        $membership_query->bindValue(':organisation_id', $organisation_id, PDO::PARAM_STR);
        $membership_query->bindValue(':user_id', $user_id, PDO::PARAM_STR);
        $membership_query->bindValue(':job_title', $request->job_title, $request->job_title !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $membership_query->execute();

        $complete_request = $conn->prepare("
            UPDATE registration_requests
            SET status = 'completed',
                completed_user_id = :user_id
            WHERE id = :id
            AND status = 'verified'
        ");

        $complete_request->bindValue(':user_id', $user_id, PDO::PARAM_STR);
        $complete_request->bindValue(':id', $request->id, PDO::PARAM_STR);
        $complete_request->execute();

        if ($complete_request->rowCount() !== 1) {
            throw new RuntimeException('Unable to complete registration request.');
        }

        $conn->commit();

        $error = false;
        $data = "Registration submitted successfully. Your account is pending approval.";

        $code = [
            'registration_ref' => $registration_ref,
            'user_id' => $user_id,
            'organisation_id' => $organisation_id,
            'status' => 'pending_approval'
        ];

    } catch (PDOException $e) {

        if ($conn->inTransaction()) {
            $conn->rollBack();
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

        error_log('Sign-up error: ' . $e->getMessage());

        $data = "An error occurred. Please try again.";
    }

    echo json_encode([
        'error' => $error,
        'data' => $data,
        'code' => $code
    ]);