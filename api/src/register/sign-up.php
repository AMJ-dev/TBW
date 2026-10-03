<?php

require_once dirname(__DIR__, 2) . "/include/set-header.php";

$honeypot = trim($_POST["honeypot"] ?? "");

if ($honeypot !== "") {
    echo json_encode([
        "error" => false,
        "data" => "If your details are valid, you will receive further instructions.",
        "code" => []
    ]);
    exit;
}

$registration_ref = trim($_POST["registration_ref"] ?? "");
$full_name = trim($_POST["full_name"] ?? "");
$password = $_POST["password"] ?? "";
$confirm_password = $_POST["confirm_password"] ?? "";
$account_type = trim($_POST["account_type"] ?? "");
$organisation_name = trim($_POST["organisation"] ?? "");
$rc_number = trim($_POST["rc_number"] ?? "");
$tin = trim($_POST["tin"] ?? "");
$date_of_incorporation = trim($_POST["date_of_incorporation"] ?? "");
$sector = trim($_POST["sector"] ?? "");
$registered_address = trim($_POST["registered_address"] ?? "");
$website = trim($_POST["website"] ?? "");
$job_title = trim($_POST["role"] ?? "");
$agreed = filter_var($_POST["agreed"] ?? false, FILTER_VALIDATE_BOOLEAN);
$email_verification_code = trim($_POST["email_verification_code"] ?? "");
$phone_verification_code = trim($_POST["phone_verification_code"] ?? "");

if ($registration_ref === "") {
    echo json_encode([
        "error" => true,
        "data" => "Registration reference is required.",
        "code" => []
    ]);
    exit;
}

if (
    $full_name === "" ||
    $password === "" ||
    $confirm_password === "" ||
    $account_type === "" ||
    $organisation_name === "" ||
    $rc_number === "" ||
    $date_of_incorporation === "" ||
    $sector === "" ||
    $registered_address === ""
) {
    echo json_encode([
        "error" => true,
        "data" => "Please complete all required registration fields.",
        "code" => []
    ]);
    exit;
}

if (!in_array($account_type, ["importer", "agent"], true)) {
    echo json_encode([
        "error" => true,
        "data" => "Invalid account type.",
        "code" => []
    ]);
    exit;
}

if (strlen($password) < 8) {
    echo json_encode([
        "error" => true,
        "data" => "Password must be at least 8 characters.",
        "code" => []
    ]);
    exit;
}

if ($password !== $confirm_password) {
    echo json_encode([
        "error" => true,
        "data" => "Passwords do not match.",
        "code" => []
    ]);
    exit;
}

if ($account_type === "agent" && $rc_number === "") {
    echo json_encode([
        "error" => true,
        "data" => "RC number is required for licensed agents.",
        "code" => []
    ]);
    exit;
}

if (!$agreed) {
    echo json_encode([
        "error" => true,
        "data" => "Accept the terms and privacy notice to continue.",
        "code" => []
    ]);
    exit;
}

if (!preg_match("/^[0-9]{6}$/", $email_verification_code)) {
    echo json_encode([
        "error" => true,
        "data" => "A valid 6-digit email verification code is required.",
        "code" => []
    ]);
    exit;
}

if (!preg_match("/^[0-9]{6}$/", $phone_verification_code)) {
    echo json_encode([
        "error" => true,
        "data" => "A valid 6-digit phone verification code is required.",
        "code" => []
    ]);
    exit;
}

$date_check = DateTime::createFromFormat("Y-m-d", $date_of_incorporation);

if (!$date_check || $date_check->format("Y-m-d") !== $date_of_incorporation) {
    echo json_encode([
        "error" => true,
        "data" => "Enter a valid date of incorporation.",
        "code" => []
    ]);
    exit;
}

if ($website !== "" && !filter_var($website, FILTER_VALIDATE_URL)) {
    echo json_encode([
        "error" => true,
        "data" => "Enter a valid website URL.",
        "code" => []
    ]);
    exit;
}

$max_file_size = 5 * 1024 * 1024;

$accepted_mimes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp"
];

$required_documents = [
    "cac",
    "tin",
    "signatory_id",
    "directors_list",
    "utility_bill"
]; 

if (
    !isset($_FILES["directors_list"]) ||
    $_FILES["directors_list"]["error"] !== UPLOAD_ERR_OK ||
    $_FILES["directors_list"]["type"] !== "application/pdf"
) {
    echo json_encode([
        "error" => true,
        "data" => "The directors and shareholders list must be a PDF file.",
        "code" => []
    ]);
    exit;
}

foreach ($required_documents as $document) {
    if (
        !isset($_FILES[$document]) ||
        $_FILES[$document]["error"] !== UPLOAD_ERR_OK
    ) {
        echo json_encode([
            "error" => true,
            "data" => "Required document missing: " . $document,
            "code" => []
        ]);
        exit;
    }

    if ($_FILES[$document]["size"] > $max_file_size) {
        echo json_encode([
            "error" => true,
            "data" => "Each document must be 5MB or smaller.",
            "code" => []
        ]);
        exit;
    }

    if (!in_array($_FILES[$document]["type"], $accepted_mimes, true)) {
        echo json_encode([
            "error" => true,
            "data" => "Only PDF, JPG, PNG or WebP files are accepted.",
            "code" => []
        ]);
        exit;
    }
}

$licences = [];

if (!empty($_POST["licences"])) {
    $decoded = json_decode($_POST["licences"], true);

    if (!is_array($decoded)) {
        echo json_encode([
            "error" => true,
            "data" => "Invalid licence information.",
            "code" => []
        ]);
        exit;
    }

    foreach ($decoded as $licence) {
        if (
            empty($licence["id"]) ||
            empty($licence["type"]) ||
            empty($licence["reference"])
        ) {
            continue;
        }

        $licences[] = [
            "id" => trim($licence["id"]),
            "type" => trim($licence["type"]),
            "reference" => trim($licence["reference"])
        ];
    }
}

if ($account_type === "agent") {
    $hasNcs = false;

    foreach ($licences as $licence) {
        if (
            $licence["type"] === "ncs_customs_agent" &&
            $licence["reference"] !== ""
        ) {
            $hasNcs = true;
            break;
        }
    }

    if (!$hasNcs) {
        echo json_encode([
            "error" => true,
            "data" => "Licensed agents must provide an NCS Customs Agent Licence.",
            "code" => []
        ]);
        exit;
    }
}

try {
    $conn->beginTransaction();

    $requestStmt = $conn->prepare("
        SELECT *
        FROM registration_requests
        WHERE registration_ref = :registration_ref
        LIMIT 1
        FOR UPDATE
    ");

    $requestStmt->execute([
        ":registration_ref" => $registration_ref
    ]);

    $request = $requestStmt->fetch(PDO::FETCH_OBJ);

    if (!$request) {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "Registration request not found.",
            "code" => []
        ]);
        exit;
    }

    if ($request->status === "completed") {
        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Registration has already been submitted.",
            "code" => [
                "registration_ref" => $registration_ref,
                "user_id" => $request->completed_user_id,
                "status" => "completed"
            ]
        ]);
        exit;
    }

    if (!in_array($request->status, ["pending_otp", "verified"], true)) {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "This registration cannot be completed in its current status.",
            "code" => []
        ]);
        exit;
    }

    if (strtotime($request->expires_at) <= time()) {
        $conn->prepare("
            UPDATE registration_requests
            SET status = 'expired'
            WHERE id = :id
        ")->execute([
            ":id" => $request->id
        ]);

        $conn->commit();

        echo json_encode([
            "error" => true,
            "data" => "Registration request has expired. Please register again.",
            "code" => []
        ]);
        exit;
    }

    $email = strtolower(trim($request->email ?? ""));
    $phone = trim($request->phone ?? "");

    if ($email === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "The registration email is invalid or missing.",
            "code" => []
        ]);
        exit;
    }

    if ($phone === "" || !is_valid_phone($phone)) {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "The registration phone number is invalid or missing.",
            "code" => []
        ]);
        exit;
    }

    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    $emailOtpStmt = $conn->prepare("
        SELECT *
        FROM registration_otps
        WHERE registration_request_id = :request_id
        AND channel = 'email'
        AND destination = :destination
        AND purpose = 'registration_email'
        AND revoked_at IS NULL
        AND verified_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
    ");

    $emailOtpStmt->execute([
        ":request_id" => $request->id,
        ":destination" => $email
    ]);

    $emailOtp = $emailOtpStmt->fetch(PDO::FETCH_OBJ);

    if (!$request->email_verified_at) {
        if (!$emailOtp || strtotime($emailOtp->expires_at) <= time()) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Email verification code has expired or is unavailable.",
                "code" => []
            ]);
            exit;
        }

        if (!password_verify($email_verification_code, $emailOtp->otp_hash)) {
            $conn->prepare("
                UPDATE registration_otps
                SET attempts = attempts + 1
                WHERE id = :id
            ")->execute([
                ":id" => $emailOtp->id
            ]);

            $conn->commit();

            echo json_encode([
                "error" => true,
                "data" => "Invalid email verification code.",
                "code" => []
            ]);
            exit;
        }

        $now = date("Y-m-d H:i:s");

        $conn->prepare("
            UPDATE registration_otps
            SET verified_at = :now
            WHERE id = :id
        ")->execute([
            ":now" => $now,
            ":id" => $emailOtp->id
        ]);

        $conn->prepare("
            UPDATE registration_requests
            SET
                email_verified_at = :now,
                status = 'verified'
            WHERE id = :id
        ")->execute([
            ":now" => $now,
            ":id" => $request->id
        ]);

        $request->email_verified_at = $now;
        $request->status = "verified";
    }

    $phoneOtpStmt = $conn->prepare("
        SELECT *
        FROM registration_otps
        WHERE registration_request_id = :request_id
        AND channel = 'sms'
        AND destination = :destination
        AND purpose = 'registration_phone'
        AND revoked_at IS NULL
        AND verified_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
    ");

    $phoneOtpStmt->execute([
        ":request_id" => $request->id,
        ":destination" => $phone
    ]);

    $phoneOtp = $phoneOtpStmt->fetch(PDO::FETCH_OBJ);

    if (!$request->phone_verified_at) {
        if (!$phoneOtp || strtotime($phoneOtp->expires_at) <= time()) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Phone verification code has expired or is unavailable.",
                "code" => []
            ]);
            exit;
        }

        if (!password_verify($phone_verification_code, $phoneOtp->otp_hash)) {
            $conn->prepare("
                UPDATE registration_otps
                SET attempts = attempts + 1
                WHERE id = :id
            ")->execute([
                ":id" => $phoneOtp->id
            ]);

            $conn->commit();

            echo json_encode([
                "error" => true,
                "data" => "Invalid phone verification code.",
                "code" => []
            ]);
            exit;
        }

        $now = date("Y-m-d H:i:s");

        $conn->prepare("
            UPDATE registration_otps
            SET verified_at = :now
            WHERE id = :id
        ")->execute([
            ":now" => $now,
            ":id" => $phoneOtp->id
        ]);

        $conn->prepare("
            UPDATE registration_requests
            SET phone_verified_at = :now
            WHERE id = :id
        ")->execute([
            ":now" => $now,
            ":id" => $request->id
        ]);

        $request->phone_verified_at = $now;
    }

    if (
        empty($request->email_verified_at) ||
        empty($request->phone_verified_at)
    ) {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "Both email and phone must be verified.",
            "code" => []
        ]);
        exit;
    }

    $existingUser = $conn->prepare("
        SELECT id
        FROM users
        WHERE email = :email
        OR phone = :phone
        LIMIT 1
    ");

    $existingUser->execute([
        ":email" => $email,
        ":phone" => $phone
    ]);

    if ($existingUser->fetch(PDO::FETCH_ASSOC)) {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "An account with this email or phone number already exists.",
            "code" => []
        ]);
        exit;
    }

    $existingOrganisation = $conn->prepare("
        SELECT id
        FROM organisations
        WHERE rc_number = :rc_number
        OR (
            :tin IS NOT NULL
            AND :tin <> ''
            AND tin = :tin
        )
        LIMIT 1
    ");

    $existingOrganisation->execute([
        ":rc_number" => $rc_number,
        ":tin" => $tin !== "" ? $tin : null
    ]);

    if ($existingOrganisation->fetch(PDO::FETCH_ASSOC)) {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "An organisation with this RC number or TIN already exists.",
            "code" => []
        ]);
        exit;
    }

    $uploadedFiles = [];

    foreach ($required_documents as $document) {
        $upload = upload_files(
            $_FILES[$document],
            $accepted_mimes
        );

        if ($upload["error"]) {
            throw new RuntimeException(
                "Unable to upload " . $document . " document."
            );
        }

        $uploadedFiles[$document] = $upload["data"];
    }

    $licenceUploads = [];

    foreach ($licences as $index => $licence) {
        $fileKey = "licence_file_" . $index;

        if (!isset($_FILES[$fileKey])) {
            continue;
        }

        if ($_FILES[$fileKey]["error"] !== UPLOAD_ERR_OK) {
            throw new RuntimeException(
                "Unable to upload licence document."
            );
        }

        if ($_FILES[$fileKey]["size"] > $max_file_size) {
            throw new RuntimeException(
                "Each licence document must be 5MB or smaller."
            );
        }

        if (!in_array($_FILES[$fileKey]["type"], $accepted_mimes, true)) {
            throw new RuntimeException(
                "Only PDF, JPG, PNG or WebP files are accepted."
            );
        }

        $upload = upload_files(
            $_FILES[$fileKey],
            $accepted_mimes
        );

        if ($upload["error"]) {
            throw new RuntimeException(
                "Unable to upload licence document."
            );
        }

        $licenceUploads[$licence["id"]] = $upload["data"];
    }

    $organisationId = generateId();

    $organisationStmt = $conn->prepare("
        INSERT INTO organisations (
            id,
            organisation_name,
            rc_number,
            tin,
            date_of_incorporation,
            sector,
            registered_address,
            website,
            organisation_type,
            verification_status
        )
        VALUES (
            :id,
            :organisation_name,
            :rc_number,
            :tin,
            :date_of_incorporation,
            :sector,
            :registered_address,
            :website,
            :organisation_type,
            'pending'
        )
    ");

    $organisationStmt->execute([
        ":id" => $organisationId,
        ":organisation_name" => $organisation_name,
        ":rc_number" => $rc_number,
        ":tin" => $tin !== "" ? $tin : null,
        ":date_of_incorporation" => $date_of_incorporation,
        ":sector" => $sector,
        ":registered_address" => $registered_address,
        ":website" => $website !== "" ? $website : null,
        ":organisation_type" => $account_type
    ]);

    $userId = generateId();

    $userStmt = $conn->prepare("
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
        )
        VALUES (
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

    $userStmt->execute([
        ":id" => $userId,
        ":organisation_id" => $organisationId,
        ":full_name" => $full_name,
        ":email" => $email,
        ":phone" => $phone,
        ":password_hash" => $password_hash,
        ":email_verified_at" => $request->email_verified_at,
        ":phone_verified_at" => $request->phone_verified_at
    ]);

    $roleStmt = $conn->prepare("
        SELECT id
        FROM roles
        WHERE role_key = 'organisation_owner'
        AND scope = 'organisation'
        AND is_active = 1
        LIMIT 1
    ");

    $roleStmt->execute();

    $ownerRole = $roleStmt->fetch(PDO::FETCH_ASSOC);

    if (!$ownerRole) {
        throw new RuntimeException(
            "Organisation owner role is not configured."
        );
    }

    $memberStmt = $conn->prepare("
        INSERT INTO organisation_members (
            id,
            organisation_id,
            user_id,
            role_id,
            job_title,
            membership_status,
            joined_at
        )
        VALUES (
            :id,
            :organisation_id,
            :user_id,
            :role_id,
            :job_title,
            'pending',
            NULL
        )
    ");

    $memberStmt->execute([
        ":id" => generateId(),
        ":organisation_id" => $organisationId,
        ":user_id" => $userId,
        ":role_id" => $ownerRole["id"],
        ":job_title" => $job_title !== "" ? $job_title : null
    ]);

    $documentStmt = $conn->prepare("
        INSERT INTO registration_documents (
            id,
            registration_request_id,
            document_type,
            file_path,
            original_name,
            mime_type,
            file_size
        )
        VALUES (
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
        $documentStmt->execute([
            ":id" => generateId(),
            ":registration_request_id" => $request->id,
            ":document_type" => $document,
            ":file_path" => $uploadedFiles[$document],
            ":original_name" => $_FILES[$document]["name"],
            ":mime_type" => $_FILES[$document]["type"],
            ":file_size" => $_FILES[$document]["size"]
        ]);
    }

    $licenceStmt = $conn->prepare("
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
        )
        VALUES (
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
        if (!isset($licenceUploads[$licence["id"]])) {
            continue;
        }

        $fileKey = "licence_file_" . $index;

        $licenceStmt->execute([
            ":id" => generateId(),
            ":registration_request_id" => $request->id,
            ":licence_type" => $licence["type"],
            ":licence_reference" => $licence["reference"],
            ":file_path" => $licenceUploads[$licence["id"]],
            ":original_name" => $_FILES[$fileKey]["name"],
            ":mime_type" => $_FILES[$fileKey]["type"],
            ":file_size" => $_FILES[$fileKey]["size"]
        ]);
    }

    $conn->prepare("
        UPDATE registration_requests
        SET
            status = 'completed',
            completed_user_id = :user_id,
            updated_at = NOW()
        WHERE id = :id
    ")->execute([
        ":user_id" => $userId,
        ":id" => $request->id
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Registration submitted successfully.",
        "code" => [
            "registration_ref" => $registration_ref,
            "user_id" => $userId,
            "organisation_id" => $organisationId,
            "status" => "pending_approval"
        ]
    ]);

} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log("Sign up error: " . $e->getMessage());

    echo json_encode([
        "error" => true,
        "data" => $e->getMessage(),
        "code" => []
    ]);
}