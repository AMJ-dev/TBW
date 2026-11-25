<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $userId = trim($_POST["user_id"] ?? "");
    $membershipId = trim($_POST["membership_id"] ?? "");
    $organisationId = trim((string)($my_details->organisation_id ?? ""));
    $invitedBy = trim((string)($my_details->id ?? ""));

    if ($userId === "" || $membershipId === "") {
        
        echo json_encode([
            "error" => true,
            "data" => "User ID and membership ID are required",
            "code" => null
        ]);
        exit;
    }

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
                om.id AS membership_id,
                om.membership_status,
                u.id,
                u.full_name,
                u.email,
                r.role_name
            FROM organisation_members om
            INNER JOIN users u
                ON u.id = om.user_id
            INNER JOIN roles r
                ON r.id = om.role_id
            WHERE om.id = :membership_id
            AND om.user_id = :user_id
            AND om.organisation_id = :organisation_id
            LIMIT 1
        ");

        $stmt->execute([
            ":membership_id" => $membershipId,
            ":user_id" => $userId,
            ":organisation_id" => $organisationId
        ]);

        $member = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$member) {
            $conn->rollBack();

            
            echo json_encode([
                "error" => true,
                "data" => "Organisation membership not found",
                "code" => null
            ]);
            exit;
        }

        if ($member["membership_status"] !== "pending") {
            $conn->rollBack();

            
            echo json_encode([
                "error" => true,
                "data" => "This user does not have a pending invitation",
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
                "data" => "The current invitation has not expired yet",
                "code" => null
            ]);
            exit;
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

        $subject = "Your TRINŪ invitation has been re-sent";

        $message = "
            <div style='display:inline-block;background-color:#FFF0E5;color:#D95700;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:7px 12px;border-radius:20px;margin-bottom:20px;'>
                Invitation reminder
            </div>

            <h1 style='margin:0 0 14px;font-size:25px;line-height:1.3;font-weight:800;color:#2B2A28;'>
                Your invitation has been re-sent
            </h1>

            <p style='margin:0 0 16px;font-size:15px;line-height:1.7;color:#2B2A28;'>
                Hello " . htmlspecialchars($member["full_name"], ENT_QUOTES, "UTF-8") . ",
            </p>

            <p style='margin:0 0 24px;font-size:14px;line-height:1.8;color:#6B6357;'>
                Your invitation to join the TRINŪ Bonded Terminal Digital Platform has been re-sent. You can now use the updated invitation link below to complete your account setup.
            </p>

            <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:26px;'>
                <tr>
                    <td bgcolor='#FAF0E3' style='background-color:#FAF0E3;border:1px solid #E8D9C2;border-radius:12px;padding:20px;'>
                        <div style='font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8C7C69;margin-bottom:8px;'>
                            Assigned account role
                        </div>
                        <div style='font-size:17px;font-weight:700;color:#2B2A28;'>
                            " . htmlspecialchars($member["role_name"], ENT_QUOTES, "UTF-8") . "
                        </div>
                    </td>
                </tr>
            </table>

            <p style='margin:0 0 24px;font-size:14px;line-height:1.8;color:#6B6357;'>
                Click below to accept your invitation and continue.
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
                    This invitation link expires in <strong>72 hours</strong>. Make sure to complete your account setup before it expires.
                </p>
            </div>

            <p style='margin:24px 0 0;font-size:13px;line-height:1.7;color:#6B6357;'>
                If you were not expecting this invitation, you can safely ignore this email.
            </p>
        ";

        $sent = send_email(
            $member["email"],
            $member["full_name"],
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
            "data" => "Invitation re-sent successfully",
            "code" => [
                "user_id" => $userId,
                "membership_id" => $membershipId,
                "email" => $member["email"],
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