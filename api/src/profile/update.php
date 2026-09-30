<?php
    require_once dirname(__DIR__, 2)."/include/verify-user.php";

    try {

        $full_name = isset($_POST["full_name"]) ? trim($_POST["full_name"]) : null;
        $phone = isset($_POST["phone"]) ? trim($_POST["phone"]) : null;
        $role_in_org = isset($_POST["role_in_org"]) ? trim($_POST["role_in_org"]) : null;
        $device_info = isset($_POST["device_info"]) ? trim($_POST["device_info"]) : null;

        if ($full_name === null || mb_strlen($full_name) < 2) {
            echo json_encode([
                "error" => true,
                "data" => "Enter a valid full name.",
                "code" => []
            ]);
            exit;
        }

        if ($phone !== null && $phone !== "" && !preg_match('/^\+?[\d\s\-()]{7,20}$/', $phone)) {
            echo json_encode([
                "error" => true,
                "data" => "Enter a valid phone number.",
                "code" => []
            ]);
            exit;
        }

        $conn->beginTransaction();

        $stmt = $conn->prepare("
            UPDATE users
            SET
                full_name = :full_name,
                phone = :phone,
                updated_at = NOW()
            WHERE id = :user_id
            LIMIT 1
        ");

        $stmt->execute([
            ":full_name" => $full_name,
            ":phone" => $phone === "" ? null : $phone,
            ":user_id" => $my_details->id
        ]);

        if ($role_in_org !== null) {
            $stmt = $conn->prepare("
                UPDATE organisation_members
                SET job_title = :job_title
                WHERE user_id = :user_id
                AND membership_status = 'active'
            ");

            $stmt->execute([
                ":job_title" => $role_in_org === "" ? null : $role_in_org,
                ":user_id" => $my_details->id
            ]);
        }

        $stmt = $conn->prepare("
            SELECT
                u.id,
                u.email,
                u.full_name,
                u.phone,
                u.pics,
                u.account_type,
                u.mfa_enabled,
                u.last_login_at,
                u.created_at,
                om.job_title AS role_in_org,
                o.organisation_name,
                o.organisation_type
            FROM users u
            LEFT JOIN organisations o
                ON o.id = u.organisation_id
            LEFT JOIN organisation_members om
                ON om.user_id = u.id
                AND om.membership_status = 'active'
            WHERE u.id = :user_id
            LIMIT 1
        ");

        $stmt->execute([
            ":user_id" => $my_details->id
        ]);

        $profile = $stmt->fetch(PDO::FETCH_ASSOC);

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Profile updated successfully.",
            "code" => [
                "id" => $profile["id"],
                "email" => $profile["email"],
                "full_name" => $profile["full_name"],
                "phone" => $profile["phone"],
                "pics" => $profile["pics"],
                "account_type" => $profile["account_type"],
                "role_in_org" => $profile["role_in_org"],
                "organisation_name" => $profile["organisation_name"],
                "organisation_type" => $profile["organisation_type"],
                "mfa_enabled" => (int)$profile["mfa_enabled"] === 1,
                "last_login_at" => $profile["last_login_at"],
                "created_at" => $profile["created_at"]
            ]
        ]);

    } catch (Throwable $e) {

        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log("Profile update error: " . $e->getMessage());

        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "An error occurred while updating your profile.",
            "code" => []
        ]);
    }