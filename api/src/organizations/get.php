<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    if ($_SERVER["REQUEST_METHOD"] === "GET") {
        try {
            $stmt = $conn->prepare("
                SELECT
                    o.id,
                    o.organisation_name AS name,
                    o.organisation_type AS org_type,
                    o.rc_number,
                    o.tin,
                    o.verification_status AS status,
                    o.rejection_reason,
                    o.verified_by,
                    o.verified_at,
                    o.created_at,
                    o.updated_at,
                    owner.email AS contact_email,
                    owner.phone AS contact_phone
                FROM organisations o
                LEFT JOIN organisation_members om
                    ON om.organisation_id = o.id
                    AND om.membership_status != 'revoked'
                    AND om.role_id = (
                        SELECT id
                        FROM roles
                        WHERE role_key = 'organisation_owner'
                        AND scope = 'organisation'
                        AND is_active = 1
                        LIMIT 1
                    )
                LEFT JOIN users owner
                    ON owner.id = om.user_id
                ORDER BY o.created_at DESC
            ");

            $stmt->execute();

            $organizations = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $metricsStmt = $conn->query("
                SELECT
                    COUNT(*) AS total,
                    SUM(organisation_type = 'terminal') AS terminals,
                    SUM(organisation_type = 'importer') AS importers,
                    SUM(organisation_type = 'agent') AS agents,
                    SUM(verification_status = 'pending') AS pending,
                    SUM(verification_status = 'verified') AS verified,
                    SUM(verification_status = 'rejected') AS rejected
                FROM organisations
            ");

            $metrics = $metricsStmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                "error" => false,
                "data" => "Organizations retrieved successfully",
                "code" => [
                    "organizations" => $organizations,
                    "metrics" => [
                        "total" => (int)$metrics["total"],
                        "terminals" => (int)$metrics["terminals"],
                        "importers" => (int)$metrics["importers"],
                        "agents" => (int)$metrics["agents"],
                        "pending" => (int)$metrics["pending"],
                        "verified" => (int)$metrics["verified"],
                        "rejected" => (int)$metrics["rejected"]
                    ]
                ]
            ]);
        } catch (Throwable $e) {
            http_response_code(500);

            echo json_encode([
                "error" => true,
                "data" => $e->getMessage(),
                "code" => null
            ]);
        }

        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $name = trim($_POST["name"] ?? "");
        $org_type = trim($_POST["org_type"] ?? "");
        $rc_number = trim($_POST["rc_number"] ?? "");
        $tin = trim($_POST["tin"] ?? "");
        $contact_email = trim($_POST["contact_email"] ?? "");
        $contact_phone = trim($_POST["contact_phone"] ?? "");

        if ($name === "") {
            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "Organisation name is required",
                "code" => null
            ]);

            exit;
        }

        if (!in_array($org_type, ["terminal", "importer", "agent"], true)) {
            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "Invalid organisation type",
                "code" => null
            ]);

            exit;
        }

        if ($rc_number === "") {
            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "RC number is required",
                "code" => null
            ]);

            exit;
        }

        if ($contact_email !== "" && !filter_var($contact_email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "Invalid contact email",
                "code" => null
            ]);

            exit;
        }

        try {
            $check = $conn->prepare("
                SELECT id
                FROM organisations
                WHERE rc_number = :rc
                OR (:tin <> '' AND tin = :tin)
                LIMIT 1
            ");

            $check->execute([
                ":rc" => $rc_number,
                ":tin" => $tin
            ]);

            if ($check->fetch(PDO::FETCH_ASSOC)) {
                http_response_code(409);

                echo json_encode([
                    "error" => true,
                    "data" => "An organisation with this RC number or TIN already exists",
                    "code" => null
                ]);

                exit;
            }

            $organisation_id = generateId();

            $conn->beginTransaction();

            $stmt = $conn->prepare("
                INSERT INTO organisations (
                    id,
                    organisation_name,
                    rc_number,
                    tin,
                    organisation_type,
                    verification_status
                ) VALUES (
                    :id,
                    :name,
                    :rc,
                    :tin,
                    :type,
                    'pending'
                )
            ");

            $stmt->execute([
                ":id" => $organisation_id,
                ":name" => $name,
                ":rc" => $rc_number,
                ":tin" => $tin !== "" ? $tin : null,
                ":type" => $org_type
            ]);

            if ($contact_email !== "" && $contact_phone !== "") {
                $userCheck = $conn->prepare("
                    SELECT id
                    FROM users
                    WHERE email = :email
                    OR phone = :phone
                    LIMIT 1
                ");

                $userCheck->execute([
                    ":email" => $contact_email,
                    ":phone" => $contact_phone
                ]);

                if (!$userCheck->fetch(PDO::FETCH_ASSOC)) {
                    $user_id = generateId();

                    $roleStmt = $conn->prepare("
                        SELECT id
                        FROM roles
                        WHERE role_key = 'organisation_owner'
                        AND scope = 'organisation'
                        AND is_active = 1
                        LIMIT 1
                    ");

                    $roleStmt->execute();

                    $role = $roleStmt->fetch(PDO::FETCH_ASSOC);

                    if ($role) {
                        $userStmt = $conn->prepare("
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

                        $userStmt->execute([
                            ":id" => $user_id,
                            ":organisation_id" => $organisation_id,
                            ":full_name" => $name,
                            ":email" => $contact_email,
                            ":phone" => $contact_phone,
                            ":password_hash" => password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT)
                        ]);

                        $memberStmt = $conn->prepare("
                            INSERT INTO organisation_members (
                                id,
                                organisation_id,
                                user_id,
                                role_id,
                                job_title,
                                membership_status
                            ) VALUES (
                                :id,
                                :organisation_id,
                                :user_id,
                                :role_id,
                                'Organisation Owner',
                                'pending'
                            )
                        ");

                        $memberStmt->execute([
                            ":id" => generateId(),
                            ":organisation_id" => $organisation_id,
                            ":user_id" => $user_id,
                            ":role_id" => $role["id"]
                        ]);
                    }
                }
            }

            $conn->commit();

            echo json_encode([
                "error" => false,
                "data" => "Organisation registered successfully",
                "code" => [
                    "id" => $organisation_id,
                    "name" => $name,
                    "org_type" => $org_type,
                    "rc_number" => $rc_number,
                    "tin" => $tin !== "" ? $tin : null,
                    "status" => "pending",
                    "contact_email" => $contact_email !== "" ? $contact_email : null,
                    "contact_phone" => $contact_phone !== "" ? $contact_phone : null
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

        exit;
    }

    http_response_code(405);

    echo json_encode([
        "error" => true,
        "data" => "Method not allowed",
        "code" => null
    ]);