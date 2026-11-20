<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";
    
    $fullName = trim($_POST["full_name"] ?? "");
    $email = strtolower(trim($_POST["email"] ?? ""));
    $phone = trim($_POST["phone"] ?? "");
    $roleId = trim($_POST["role_id"] ?? "");

    if ($fullName === "" || $email === "" || $phone === "" || $roleId === "") {
        echo json_encode([
            "error" => true,
            "data" => "Full name, email, phone and role are required",
            "code" => null
        ]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
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
            echo json_encode([
                "error" => true,
                "data" => "Role not found",
                "code" => null
            ]);
            exit;
        }

        if ((int)$role["is_active"] !== 1 || $role["scope"] !== "organisation") {
            $conn->rollBack();
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
                echo json_encode([
                    "error" => true,
                    "data" => "A user with this " . $matchedBy . " already exists",
                    "code" => null
                ]);
                exit;
            }

            if ($existingUser["id"] === $invitedBy) {
                $conn->rollBack();
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

        $token = generateId();
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
            <div style='margin:0;padding:0;background-color:#FAF0E3;'>
                <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color:#FAF0E3;padding:40px 16px;'>
                    <tr>
                        <td align='center'>
                            <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='max-width:600px;background-color:#FFFBF5;border:1px solid #E8D9C2;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;'>

                                <tr>
                                    <td style='background-color:#FF6600;padding:28px 32px;'>
                                        <div style='font-size:24px;font-weight:800;letter-spacing:2px;color:#FFFFFF;'>
                                            TRINŪ
                                        </div>
                                        <div style='font-size:11px;font-weight:600;letter-spacing:1.5px;color:#FFE3CF;text-transform:uppercase;margin-top:5px;'>
                                            Bonded Terminal Digital Platform
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td style='padding:36px 32px 30px;'>
                                        <div style='display:inline-block;background-color:#FFF0E5;color:#D95700;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:7px 12px;border-radius:20px;margin-bottom:20px;'>
                                            Account invitation
                                        </div>

                                        <h1 style='margin:0 0 14px;font-size:25px;line-height:1.3;font-weight:800;color:#2B2A28;'>
                                            You're invited to join TRINŪ
                                        </h1>

                                        <p style='margin:0 0 16px;font-size:15px;line-height:1.7;color:#2B2A28;'>
                                            Hello " . htmlspecialchars($fullName, ENT_QUOTES, "UTF-8") . ",
                                        </p>

                                        <p style='margin:0 0 24px;font-size:14px;line-height:1.8;color:#6B6357;'>
                                            You have been invited to join the TRINŪ Bonded Terminal Digital Platform. Your account has been prepared and is ready for activation.
                                        </p>

                                        <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:26px;'>
                                            <tr>
                                                <td style='background-color:#FAF0E3;border:1px solid #E8D9C2;border-radius:12px;padding:20px;'>
                                                    <div style='font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8C7C69;margin-bottom:8px;'>
                                                        Assigned account role
                                                    </div>
                                                    <div style='font-size:17px;font-weight:700;color:#2B2A28;'>
                                                        " . htmlspecialchars($role["role_name"], ENT_QUOTES, "UTF-8") . "
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style='margin:0 0 24px;font-size:14px;line-height:1.8;color:#6B6357;'>
                                            Accept your invitation to complete your account setup and get started.
                                        </p>

                                        <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0'>
                                            <tr>
                                                <td align='center' style='padding:4px 0 28px;'>
                                                    <a href='" . htmlspecialchars($invitationURL, ENT_QUOTES, "UTF-8") . "' style='display:inline-block;background-color:#FF6600;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;padding:16px 34px;border-radius:8px;letter-spacing:0.3px;'>
                                                        Accept Invitation
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <div style='padding:16px;background-color:#FFF4E9;border-left:3px solid #FF6600;border-radius:4px;'>
                                            <p style='margin:0;font-size:13px;line-height:1.7;color:#765C45;'>
                                                <strong style='color:#2B2A28;'>Invitation expiry:</strong>
                                                This invitation link expires in <strong>72 hours</strong>. Please accept it before it expires.
                                            </p>
                                        </div>

                                        <p style='margin:24px 0 0;font-size:13px;line-height:1.7;color:#6B6357;'>
                                            If you were not expecting this invitation, you can safely ignore this email.
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <td style='padding:0 32px;'>
                                        <div style='border-top:1px solid #E8D9C2;height:1px;line-height:1px;font-size:0;'>&nbsp;</div>
                                    </td>
                                </tr>

                                <tr>
                                    <td style='padding:24px 32px 30px;text-align:center;'>
                                        <div style='font-size:14px;font-weight:800;letter-spacing:1.5px;color:#FF6600;'>
                                            TRINŪ
                                        </div>
                                        <p style='margin:8px 0 0;font-size:11px;line-height:1.6;color:#8C7C69;'>
                                            Bonded Terminal Digital Platform
                                        </p>
                                        <p style='margin:12px 0 0;font-size:11px;line-height:1.6;color:#B8A894;'>
                                            This is an automated message. Please do not reply.
                                        </p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>
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

        if ((int)$e->getCode() === 23000) {
            echo json_encode([
                "error" => true,
                "data" => "Email or phone number already exists",
                "code" => null
            ]);
            exit;
        }

        echo json_encode([
            "error" => true,
            "data" => $e->getMessage(),
            "code" => null
        ]);
    }