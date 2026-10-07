<?php
    require_once dirname(__DIR__, 4) . "/include/verify-user.php";

    $userId = trim($_POST["user_id"] ?? "");
    $membershipId = trim($_POST["membership_id"] ?? "");
    $organisationId = trim((string)($my_details->organisation_id ?? ""));
    $invitedBy = trim((string)($my_details->id ?? ""));

    if ($userId === "" || $membershipId === "") {
        http_response_code(422);
        echo json_encode([
            "error" => true,
            "data" => "User ID and membership ID are required",
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
        $stmt = $conn->prepare("
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.account_status,
                om.id AS membership_id,
                om.membership_status,
                r.id AS role_id,
                r.role_key,
                r.role_name
            FROM organisation_members om
            INNER JOIN users u ON u.id = om.user_id
            LEFT JOIN roles r ON r.id = om.role_id
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

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            http_response_code(404);
            echo json_encode([
                "error" => true,
                "data" => "User membership not found",
                "code" => null
            ]);
            exit;
        }

        if ($user["membership_status"] === "removed") {
            http_response_code(409);
            echo json_encode([
                "error" => true,
                "data" => "This user has been removed from the organisation",
                "code" => null
            ]);
            exit;
        }

        if (empty($user["email"])) {
            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "This user does not have an email address",
                "code" => null
            ]);
            exit;
        }

        if (
            strtolower((string)$user["account_status"]) !== "pending" &&
            strtolower((string)$user["account_status"]) !== "pending_approval" &&
            strtolower((string)$user["account_status"]) !== "invited"
        ) {
            http_response_code(409);
            echo json_encode([
                "error" => true,
                "data" => "This user does not have a pending invitation",
                "code" => null
            ]);
            exit;
        }

        $conn->beginTransaction();

        $stmt = $conn->prepare("
            UPDATE user_invitations
            SET revoked_at = NOW()
            WHERE user_id = :user_id
            AND membership_id = :membership_id
            AND accepted_at IS NULL
            AND revoked_at IS NULL
        ");

        $stmt->execute([
            ":user_id" => $userId,
            ":membership_id" => $membershipId
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

        $subject = "Your organisation invitation has been re-sent";

        $message = "
            <div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#222\">
                <h2>Your invitation is ready</h2>
                <p>Hello " . htmlspecialchars($user["full_name"]) . ",</p>
                <p>Your invitation to join your organisation account has been re-sent.</p>
                <p>Your assigned role is <strong>" . htmlspecialchars($user["role_name"] ?? "User") . "</strong>.</p>
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
            $user["email"],
            $user["full_name"],
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
            "data" => "Invitation re-sent successfully",
            "code" => [
                "id" => $userId,
                "membership_id" => $membershipId,
                "email" => $user["email"],
                "expires_at" => $expiresAt
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