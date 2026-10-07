<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $fullName = trim($_POST["full_name"] ?? "");
    $email = strtolower(trim($_POST["email"] ?? ""));
    $phone = trim($_POST["phone"] ?? "");
    $roleId = trim($_POST["role_id"] ?? "");
    $organisationId = trim((string)($my_details->organisation_id ?? ""));
    $invitedBy = trim((string)($my_details->id ?? ""));

    if ($fullName === "") {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Full name is required",
            "code" => null
        ]);
        exit;
    }

    if ($email === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "A valid email address is required",
            "code" => null
        ]);
        exit;
    }

    if ($phone === "") {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Phone number is required",
            "code" => null
        ]);
        exit;
    }

    if ($roleId === "") {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "Role is required",
            "code" => null
        ]);
        exit;
    }

    if ($organisationId === "") {
        http_response_code(403);
        echo json_encode([
            "error" => true,
            "data" => "Organisation not found",
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

        if ($role["scope"] !== "organisation") {
            $conn->rollBack();

            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "Invalid organisation role",
                "code" => null
            ]);
            exit;
        }

        if (
            !(
                $role["is_active"] == 1 ||
                $role["is_active"] === "1" ||
                $role["is_active"] === "active"
            )
        ) {
            $conn->rollBack();

            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "This role is not active",
                "code" => null
            ]);
            exit;
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
            WHERE LOWER(email) = :email
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
            if (
                isset($user["email"]) &&
                strcasecmp(trim((string)$user["email"]), $email) === 0
            ) {
                $existingUser = $user;
            }

            if (
                trim((string)($user["phone"] ?? "")) === $phone &&
                (
                    !$existingUser ||
                    (string)$existingUser["id"] !== (string)$user["id"]
                )
            ) {
                $conn->rollBack();

                http_response_code(409);
                echo json_encode([
                    "error" => true,
                    "data" => "A user with this phone number already exists",
                    "code" => null
                ]);
                exit;
            }
        }

        if ($existingUser) {
            $existingUserId = $existingUser["id"];

            $stmt = $conn->prepare("
                SELECT
                    id,
                    expires_at,
                    accepted_at,
                    revoked_at
                FROM user_invitations
                WHERE user_id = :user_id
                AND accepted_at IS NULL
                AND revoked_at IS NULL
                AND expires_at > NOW()
                ORDER BY created_at DESC
                LIMIT 1
            ");

            $stmt->execute([
                ":user_id" => $existingUserId
            ]);

            $activeInvitation = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($activeInvitation) {
                $conn->rollBack();

                http_response_code(409);
                echo json_encode([
                    "error" => true,
                    "data" => "An active invitation already exists for this email address",
                    "code" => null
                ]);
                exit;
            }

            $existingStatus = strtolower(trim((string)$existingUser["account_status"]));

            if (
                $existingStatus !== "pending" &&
                $existingStatus !== "pending_approval" &&
                $existingStatus !== "invited"
            ) {
                $conn->rollBack();

                http_response_code(409);
                echo json_encode([
                    "error" => true,
                    "data" => "A user with this email address already exists",
                    "code" => null
                ]);
                exit;
            }

            $userId = $existingUserId;

            $stmt = $conn->prepare("
                UPDATE users
                SET
                    full_name = :full_name,
                    phone = :phone,
                    account_status = 'pending_approval',
                    account_type = 'organisation',
                    organisation_id = :organisation_id,
                    updated_at = NOW()
                WHERE id = :id
            ");

            $stmt->execute([
                ":full_name" => $fullName,
                ":phone" => $phone,
                ":organisation_id" => $organisationId,
                ":id" => $userId
            ]);
        } else {
            $userId = generateId();

            $stmt = $conn->prepare("
                INSERT INTO users (
                    id,
                    full_name,
                    email,
                    phone,
                    password_hash,
                    account_status,
                    account_type,
                    organisation_id,
                    created_at,
                    updated_at
                ) VALUES (
                    :id,
                    :full_name,
                    :email,
                    :phone,
                    :password_hash,
                    'pending_approval',
                    'organisation',
                    :organisation_id,
                    NOW(),
                    NOW()
                )
            ");

            $stmt->execute([
                ":id" => $userId,
                ":full_name" => $fullName,
                ":email" => $email,
                ":phone" => $phone,
                ":password_hash" => "",
                ":organisation_id" => $organisationId
            ]);
        }

        $stmt = $conn->prepare("
            SELECT
                id,
                membership_status
            FROM organisation_members
            WHERE organisation_id = :organisation_id
            AND user_id = :user_id
            LIMIT 1
        ");

        $stmt->execute([
            ":organisation_id" => $organisationId,
            ":user_id" => $userId
        ]);

        $membership = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($membership) {
            if ($membership["membership_status"] === "active") {
                $conn->rollBack();

                http_response_code(409);
                echo json_encode([
                    "error" => true,
                    "data" => "This user is already a member of your organisation",
                    "code" => null
                ]);
                exit;
            }

            $stmt = $conn->prepare("
                UPDATE organisation_members
                SET
                    role_id = :role_id,
                    membership_status = 'pending',
                    invited_by = :invited_by,
                    updated_at = NOW()
                WHERE id = :id
            ");

            $stmt->execute([
                ":role_id" => $roleId,
                ":invited_by" => $invitedBy,
                ":id" => $membership["id"]
            ]);

            $membershipId = $membership["id"];
        } else {
            $membershipId = generateId();

            $stmt = $conn->prepare("
                INSERT INTO organisation_members (
                    id,
                    organisation_id,
                    user_id,
                    role_id,
                    membership_status,
                    invited_by,
                    created_at,
                    updated_at
                ) VALUES (
                    :id,
                    :organisation_id,
                    :user_id,
                    :role_id,
                    'pending',
                    :invited_by,
                    NOW(),
                    NOW()
                )
            ");

            $stmt->execute([
                ":id" => $membershipId,
                ":organisation_id" => $organisationId,
                ":user_id" => $userId,
                ":role_id" => $roleId,
                ":invited_by" => $invitedBy
            ]);
        }

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

        $token = rtrim(
            strtr(
                base64_encode(random_bytes(48)),
                '+/',
                '-_'
            ),
            '='
        );

        $tokenHash = hash("sha256", $token);
        $invitationId = generateId();
        $expiresAt = date("Y-m-d H:i:s", time() + (72 * 60 * 60));

        $stmt = $conn->prepare("
            INSERT INTO user_invitations (
                id,
                user_id,
                membership_id,
                token_hash,
                expires_at,
                invited_by,
                created_at
            ) VALUES (
                :id,
                :user_id,
                :membership_id,
                :token_hash,
                :expires_at,
                :invited_by,
                NOW()
            )
        ");

        $stmt->execute([
            ":id" => $invitationId,
            ":user_id" => $userId,
            ":membership_id" => $membershipId,
            ":token_hash" => $tokenHash,
            ":expires_at" => $expiresAt,
            ":invited_by" => $invitedBy
        ]);

        $baseURL = rtrim($baseURL ?? "", "/") . "/";
        $invitationURL = $baseURL . "invitation/" . $token;

        $subject = "You're invited to join your organisation account";

        $message = "
            <div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#222\">
                <h2>You have been invited</h2>
                <p>Hello " . htmlspecialchars($fullName) . ",</p>
                <p>You have been invited to join your organisation account.</p>
                <p>Your assigned role is <strong>" . htmlspecialchars($role["role_name"]) . "</strong>.</p>
                <p>
                    <a href=\"" . htmlspecialchars($invitationURL) . "\"
                    style=\"display:inline-block;padding:12px 20px;background:#f97316;color:#fff;text-decoration:none;border-radius:6px\">
                        Accept invitation
                    </a>
                </p>
                <p>This invitation expires in 72 hours.</p>
            </div>
        ";

        $emailSent = send_email(
            $email,
            $fullName,
            $subject,
            $message
        );

        if (!$emailSent) {
            $conn->rollBack();

            http_response_code(500);
            echo json_encode([
                "error" => true,
                "data" => "Invitation could not be sent",
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
                "membership_id" => $membershipId,
                "email" => $email,
                "expires_at" => $expiresAt,
                "invitation_url" => $invitationURL
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