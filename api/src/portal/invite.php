<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";
    
    $fullName = trim($_POST["full_name"] ?? "");
    $email = strtolower(trim($_POST["email"] ?? ""));
    $phone = trim($_POST["phone"] ?? "");
    $roleId = trim($_POST["role_id"] ?? "");

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

    $organisationId = trim((string)($my_details->organisation_id ?? ""));
    $invitedBy = trim((string)($my_details->id ?? ""));

    if ($organisationId === "" || $invitedBy === "") {
        http_response_code(403);
        echo json_encode([
            "error" => true,
            "data" => "Organisation information is not available",
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

        if ((int)$role["is_active"] !== 1 || $role["scope"] !== "organisation") {
            $conn->rollBack();

            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "Selected role is not available",
                "code" => null
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT
                id,
                organisation_id,
                account_type,
                full_name,
                email,
                phone,
                account_status
            FROM users
            WHERE email = :email
            OR phone = :phone
            LIMIT 1
        ");

        $stmt->execute([
            ":email" => $email,
            ":phone" => $phone
        ]);

        $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existingUser) {
            if (strcasecmp($existingUser["email"], $email) === 0) {
                $matchedBy = "email";
            } else {
                $matchedBy = "phone";
            }

            if ($existingUser["organisation_id"] !== $organisationId) {
                $conn->rollBack();

                http_response_code(409);
                echo json_encode([
                    "error" => true,
                    "data" => "A user with this " . $matchedBy . " already exists",
                    "code" => null
                ]);
                exit;
            }

            if ($existingUser["id"] === $invitedBy) {
                $conn->rollBack();

                http_response_code(409);
                echo json_encode([
                    "error" => true,
                    "data" => "You cannot invite yourself",
                    "code" => null
                ]);
                exit;
            }

            $userId = $existingUser["id"];

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

            $member = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($member && $member["membership_status"] === "active") {
                $conn->rollBack();

                http_response_code(409);
                echo json_encode([
                    "error" => true,
                    "data" => "This user is already an active member of your organisation",
                    "code" => null
                ]);
                exit;
            }

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
                ":user_id" => $userId
            ]);

            if ($stmt->fetch(PDO::FETCH_ASSOC)) {
                $conn->rollBack();

                http_response_code(409);
                echo json_encode([
                    "error" => true,
                    "data" => "An active invitation already exists for this user",
                    "code" => null
                ]);
                exit;
            }

            $stmt = $conn->prepare("
                UPDATE users
                SET
                    full_name = :full_name,
                    email = :email,
                    phone = :phone,
                    account_type = 'organisation',
                    organisation_id = :organisation_id,
                    account_status = 'pending_approval'
                WHERE id = :id
            ");

            $stmt->execute([
                ":full_name" => $fullName,
                ":email" => $email,
                ":phone" => $phone,
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
                    full_name,
                    email,
                    phone,
                    password_hash,
                    account_status
                ) VALUES (
                    :id,
                    :organisation_id,
                    'organisation',
                    :full_name,
                    :email,
                    :phone,
                    :password_hash,
                    'pending_approval'
                )
            ");

            $stmt->execute([
                ":id" => $userId,
                ":organisation_id" => $organisationId,
                ":full_name" => $fullName,
                ":email" => $email,
                ":phone" => $phone,
                ":password_hash" => password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT)
            ]);

            $member = null;
        }

        if ($member) {
            $stmt = $conn->prepare("
                UPDATE organisation_members
                SET
                    role_id = :role_id,
                    membership_status = 'pending',
                    invited_by = :invited_by,
                    joined_at = NULL
                WHERE id = :id
            ");

            $stmt->execute([
                ":role_id" => $roleId,
                ":invited_by" => $invitedBy,
                ":id" => $member["id"]
            ]);
        } else {
            $stmt = $conn->prepare("
                INSERT INTO organisation_members (
                    id,
                    organisation_id,
                    user_id,
                    role_id,
                    membership_status,
                    invited_by
                ) VALUES (
                    :id,
                    :organisation_id,
                    :user_id,
                    :role_id,
                    'pending',
                    :invited_by
                )
            ");

            $stmt->execute([
                ":id" => generateId(),
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

        $token = rtrim(strtr(base64_encode(random_bytes(48)), "+/", "-_"), "=");
        $tokenHash = hash("sha256", $token);
        $invitationId = generateId();
        $expiresAt = date("Y-m-d H:i:s", time() + 72 * 60 * 60);

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
            ":invited_by" => $invitedBy
        ]);

        $invitationURL = rtrim($baseURL, "/") . "/invitation/" . $token;

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

            http_response_code(500);
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

        if ((int)$e->getCode() === 23000) {
            http_response_code(409);
            echo json_encode([
                "error" => true,
                "data" => "Email or phone number already exists",
                "code" => null
            ]);
            exit;
        }

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => $e->getMessage(),
            "code" => null
        ]);
    }