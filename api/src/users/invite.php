<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $accountType = trim($_POST["account_type"] ?? "");
    $fullName = trim($_POST["full_name"] ?? "");
    $email = strtolower(trim($_POST["email"] ?? ""));
    $phone = trim($_POST["phone"] ?? "");
    $roleId = trim($_POST["role_id"] ?? "");
    $organisationId = trim($_POST["organisation_id"] ?? "");
    $jobTitle = trim($_POST["job_title"] ?? "");

    if (!in_array($accountType, ["system", "organisation"], true)) {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Invalid account type",
            "code" => null
        ]);
        exit;
    }

    if ($fullName === "" || $email === "" || $phone === "" || $roleId === "") {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Full name, email, phone and role are required",
            "code" => null
        ]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Invalid email address",
            "code" => null
        ]);
        exit;
    }

    if ($accountType === "organisation" && $organisationId === "") {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Organisation is required",
            "code" => null
        ]);
        exit;
    }

    try {
        $conn->beginTransaction();

        $stmt = $conn->prepare("
            SELECT
                id,
                role_key,
                role_name,
                scope,
                is_active
            FROM roles
            WHERE id = :id
            LIMIT 1
        ");

        $stmt->execute([
            ":id" => $roleId
        ]);

        $role = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$role) {
            $conn->rollBack();

            http_response_code(404);
            echo json_encode([
                "error" => true,
                "data" => "Role not found",
                "code" => null
            ]);
            exit;
        }

        if (!(bool)$role["is_active"]) {
            $conn->rollBack();

            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "Selected role is not active",
                "code" => null
            ]);
            exit;
        }

        if ($role["scope"] !== $accountType) {
            $conn->rollBack();

            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "Selected role does not match the account type",
                "code" => null
            ]);
            exit;
        }
        if ($accountType === "system") {
            $get_org = $conn->prepare("SELECT id FROM organisations WHERE organisation_type = :organisation_type");
            $get_org->execute([":organisation_type" => 'terminal']);
            $organisationId = $get_org->fetch(PDO::FETCH_ASSOC)['id'];
        }
        if ($accountType === "organisation") {
            $stmt = $conn->prepare("
                SELECT
                    id,
                    organisation_name,
                    verification_status
                FROM organisations
                WHERE id = :id
                LIMIT 1
            ");

            $stmt->execute([
                ":id" => $organisationId
            ]);

            $organisation = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$organisation) {
                $conn->rollBack();

                http_response_code(404);
                echo json_encode([
                    "error" => true,
                    "data" => "Organisation not found",
                    "code" => null
                ]);
                exit;
            }
        }

        $stmt = $conn->prepare("
            SELECT
                id,
                email,
                phone,
                account_status,
                account_type,
                organisation_id
            FROM users
            WHERE email = :email
               OR phone = :phone
            LIMIT 2
        ");

        $stmt->execute([
            ":email" => $email,
            ":phone" => $phone
        ]);

        $existingUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $existingUser = null;

        foreach ($existingUsers as $user) {
            if (strcasecmp(trim($user["email"]), $email) === 0) {
                $existingUser = $user;
            }

            if (
                trim((string)$user["phone"]) === $phone &&
                (!$existingUser || (string)$existingUser["id"] !== (string)$user["id"])
            ) {
                $conn->rollBack();
                echo json_encode([
                    "error" => true,
                    "data" => "A user with this phone number already exists",
                    "code" => null
                ]);
                exit;
            }
        }

        if ($existingUser) {
            if ($existingUser["account_status"] === "pending_approval") {
                $stmt = $conn->prepare("
                    SELECT id
                    FROM user_invitations
                    WHERE user_id = :user_id
                    AND accepted_at IS NULL
                    AND revoked_at IS NULL
                    AND expires_at > NOW()
                    ORDER BY created_at DESC
                    LIMIT 1
                ");

                $stmt->execute([
                    ":user_id" => $existingUser["id"]
                ]);

                if ($stmt->fetch(PDO::FETCH_ASSOC)) {
                    $conn->rollBack();
                    echo json_encode([
                        "error" => true,
                        "data" => "An active invitation already exists for this email address",
                        "code" => null
                    ]);
                    exit;
                }
            } else {
                $conn->rollBack();
                echo json_encode([
                    "error" => true,
                    "data" => "A user with this email address already exists",
                    "code" => null
                ]);
                exit;
            }

            $userId = $existingUser["id"];

            $stmt = $conn->prepare("
                UPDATE users
                SET
                    full_name = :full_name,
                    phone = :phone,
                    account_type = :account_type,
                    organisation_id = :organisation_id,
                    account_status = 'pending_approval',
                    updated_at = NOW()
                WHERE id = :id
            ");

            $stmt->execute([
                ":full_name" => $fullName,
                ":phone" => $phone,
                ":account_type" => $accountType,
                ":organisation_id" => $organisationId,
                ":id" => $userId
            ]);
        } else {
            $userId = generateId();

            $stmt = $conn->prepare("
                INSERT INTO users (
                    id,
                    organisation_id,
                    account_type,
                    system_role_id,
                    full_name,
                    email,
                    phone,
                    password_hash,
                    account_status,
                    created_at,
                    updated_at
                ) VALUES (
                    :id,
                    :organisation_id,
                    :account_type,
                    :system_role_id,
                    :full_name,
                    :email,
                    :phone,
                    '',
                    'pending_approval',
                    NOW(),
                    NOW()
                )
            ");

            $stmt->execute([
                ":id" => $userId,
                ":organisation_id" => $organisationId,
                ":account_type" => $accountType,
                ":system_role_id" => $accountType === "system" ? $roleId : null,
                ":full_name" => $fullName,
                ":email" => $email,
                ":phone" => $phone
            ]);
        }

        if ($accountType === "organisation") {
            $stmt = $conn->prepare("
                SELECT id
                FROM organisation_members
                WHERE organisation_id = :organisation_id
                AND user_id = :user_id
                LIMIT 1
            ");

            $stmt->execute([
                ":organisation_id" => $organisationId,
                ":user_id" => $userId
            ]);

            $member = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($member) {
                $stmt = $conn->prepare("
                    UPDATE organisation_members
                    SET
                        role_id = :role_id,
                        job_title = :job_title,
                        membership_status = 'pending',
                        invited_by = :invited_by,
                        joined_at = NULL
                    WHERE id = :id
                ");

                $stmt->execute([
                    ":role_id" => $roleId,
                    ":job_title" => $jobTitle !== "" ? $jobTitle : null,
                    ":invited_by" => $my_details->id,
                    ":id" => $member["id"]
                ]);
            } else {
                $stmt = $conn->prepare("
                    INSERT INTO organisation_members (
                        id,
                        organisation_id,
                        user_id,
                        role_id,
                        job_title,
                        membership_status,
                        invited_by
                    ) VALUES (
                        :id,
                        :organisation_id,
                        :user_id,
                        :role_id,
                        :job_title,
                        'pending',
                        :invited_by
                    )
                ");

                $stmt->execute([
                    ":id" => generateId(),
                    ":organisation_id" => $organisationId,
                    ":user_id" => $userId,
                    ":role_id" => $roleId,
                    ":job_title" => $jobTitle !== "" ? $jobTitle : null,
                    ":invited_by" => $my_details->id
                ]);
            }
        }

        $token = rtrim(strtr(base64_encode(random_bytes(48)), '+/', '-_'), '=');
        $tokenHash = hash("sha256", $token);
        $invitationId = generateId();
        $expiresAt = date("Y-m-d H:i:s", time() + 72 * 60 * 60);

        $stmt = $conn->prepare("
            UPDATE user_invitations
            SET revoked_at = NOW()
            WHERE user_id = :user_id
            AND accepted_at IS NULL
            AND revoked_at IS NULL
        ");

        $stmt->execute([
            ":user_id" => $userId
        ]);

        $stmt = $conn->prepare("
            INSERT INTO user_invitations (
                id,
                user_id,
                token_hash,
                expires_at,
                invited_by
            ) VALUES (
                :id,
                :user_id,
                :token_hash,
                :expires_at,
                :invited_by
            )
        ");

        $stmt->execute([
            ":id" => $invitationId,
            ":user_id" => $userId,
            ":token_hash" => $tokenHash,
            ":expires_at" => $expiresAt,
            ":invited_by" => $my_details->id
        ]);

        $baseURL = rtrim($baseURL, "/") . "/";
        $invitationURL = $baseURL . "invitation/" . $token;

        $subject = "You have been invited to TRINŪ";

        $message = "
            <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#333;'>
                <h2 style='color:#2258BF;'>TRINŪ</h2>
                <p>Hello " . htmlspecialchars($fullName, ENT_QUOTES, "UTF-8") . ",</p>
                <p>You have been invited to join the TRINŪ Bonded Terminal Digital Platform.</p>
                <p>Your account has been prepared with the role <strong>" . htmlspecialchars($role["role_name"], ENT_QUOTES, "UTF-8") . "</strong>.</p>
                <div style='text-align:center;margin:30px 0;'>
                    <a href='" . htmlspecialchars($invitationURL, ENT_QUOTES, "UTF-8") . "' style='display:inline-block;background:#2258BF;color:#fff;text-decoration:none;padding:14px 24px;border-radius:7px;'>
                        Accept Invitation
                    </a>
                </div>
                <p>This invitation expires in 72 hours.</p>
                <p>If you were not expecting this invitation, you can safely ignore this email.</p>
                <p style='color:#777;font-size:12px;'>TRINŪ Bonded Terminal Digital Platform</p>
            </div>
        ";

        $sent = send_email(
            $email,
            $fullName,
            $subject,
            $message
        );

        if (!$sent) {
            $conn->rollBack();
            echo json_encode([
                "error" => true,
                "data" => "Unable to send invitation email. Please try again.",
                "code" => null
            ]);
            exit;
        }

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Invitation sent successfully",
            "code" => [
                "id" => $userId,
                "email" => $email,
                "expires_at" => $expiresAt,
                "invitation_url" => $invitationURL
            ]
        ]);

    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        echo json_encode([
            "error" => true,
            "data" => $e->getMessage(),
            "code" => null
        ]);
    }
?>