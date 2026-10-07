<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $userId = trim($_POST["user_id"] ?? "");
    $membershipId = trim($_POST["membership_id"] ?? "");
    $organisationId = trim((string)($my_details->organisation_id ?? ""));
    $invitedBy = trim((string)($my_details->id ?? ""));

    if ($userId === "" || $membershipId === "") {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "User ID and membership ID are required",
            "code" => null
        ]);
        exit;
    }

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

            http_response_code(404);
            echo json_encode([
                "error" => true,
                "data" => "Organisation membership not found",
                "code" => null
            ]);
            exit;
        }

        if ($member["membership_status"] !== "pending") {
            $conn->rollBack();

            http_response_code(400);
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

            http_response_code(409);
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

        $subject = "Your TRINŪ invitation has been re-sent";

        $message = "
            <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#333;'>
                <h2 style='color:#2258BF;'>TRINŪ</h2>
                <p>Hello " . htmlspecialchars($member["full_name"], ENT_QUOTES, "UTF-8") . ",</p>
                <p>Your invitation to join the TRINŪ Bonded Terminal Digital Platform has been re-sent.</p>
                <p>Your role is <strong>" . htmlspecialchars($member["role_name"], ENT_QUOTES, "UTF-8") . "</strong>.</p>
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
            $member["email"],
            $member["full_name"],
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

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => $e->getMessage(),
            "code" => null
        ]);
    }