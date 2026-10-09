<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    header("Content-Type: application/json; charset=utf-8");

    function respond(bool $error, string $data, $code = null, int $status = 200): void{
        http_response_code($status);
        echo json_encode([
            "error" => $error,
            "data" => $data,
            "code" => $code
        ]);
        exit;
    }

    try {
        if (strtoupper($_SERVER["REQUEST_METHOD"] ?? "GET") === "OPTIONS") {
            http_response_code(204);
            exit;
        }

        if (($my_details->account_status ?? "") !== "active") {
            respond(true, "Your account is not active.", null, 403);
        }

        $roleStmt = $conn->prepare("
            SELECT r.role_key, r.scope, r.is_active
            FROM roles r
            WHERE r.id = :role_id
            LIMIT 1
        ");
        $roleStmt->execute([
            ":role_id" => $my_details->system_role_id ?? null
        ]);
        $role = $roleStmt->fetch(PDO::FETCH_ASSOC);

        if (
            !$role ||
            $role["scope"] !== "system" ||
            $role["role_key"] !== "system_admin" ||
            !(bool)$role["is_active"]
        ) {
            respond(true, "You are not authorised to manage organisation configuration.", null, 403);
        }

        $method = strtoupper($_SERVER["REQUEST_METHOD"] ?? "GET");
        $input = [];

        if ($method === "POST") {
            $raw = file_get_contents("php://input");
            $decoded = json_decode($raw, true);

            $input = is_array($decoded) ? $decoded : $_POST;
        } elseif ($method !== "GET") {
            header("Allow: GET, POST, OPTIONS");
            respond(true, "Method not allowed.", null, 405);
        }

        $organisationId = trim(
            (string)($_GET["organisation_id"] ?? $input["organisation_id"] ?? "")
        );

        if ($organisationId === "" && !empty($my_details->organisation_id)) {
            $organisationId = $my_details->organisation_id;
        }

        if ($organisationId !== "") {
            $orgStmt = $conn->prepare("
                SELECT *
                FROM organisations
                WHERE id = :id
                LIMIT 1
            ");
            $orgStmt->execute([":id" => $organisationId]);
        } else {
            $orgStmt = $conn->prepare("
                SELECT *
                FROM organisations
                WHERE organisation_type = 'terminal'
                ORDER BY created_at ASC, id ASC
                LIMIT 1
            ");
            $orgStmt->execute();
        }

        $org = $orgStmt->fetch(PDO::FETCH_ASSOC);

        if (!$org) {
            respond(true, "Organisation not found.", null, 404);
        }

        $organisationId = $org["id"];

        if ($method === "POST") {
            $legalName = trim((string)($input["legal_name"] ?? ""));
            $tradingName = trim((string)($input["trading_name"] ?? ""));
            $orgType = trim((string)($input["org_type"] ?? ""));
            $status = trim((string)($input["status"] ?? ""));
            $rcNumber = trim((string)($input["rc_number"] ?? ""));
            $tin = trim((string)($input["tin"] ?? ""));
            $dateOfIncorporation = trim((string)($input["date_of_incorporation"] ?? ""));
            $sector = trim((string)($input["sector"] ?? ""));
            $registeredAddress = trim((string)($input["registered_address"] ?? ""));
            $operatingAddress = trim((string)($input["operating_address"] ?? ""));
            $website = trim((string)($input["website"] ?? ""));
            $contactEmail = trim((string)($input["contact_email"] ?? ""));
            $contactPhone = trim((string)($input["contact_phone"] ?? ""));
            $contactPerson = trim((string)($input["contact_person"] ?? ""));
            $contactPersonTitle = trim((string)($input["contact_person_title"] ?? ""));

            if ($legalName === "") {
                respond(true, "Legal name is required.", null, 422);
            }

            if (!in_array($orgType, ["terminal", "importer", "agent"], true)) {
                respond(true, "Invalid organisation type.", null, 422);
            }

            if (!in_array($status, ["pending", "under_review", "verified", "rejected", "suspended"], true)) {
                respond(true, "Invalid organisation status.", null, 422);
            }

            if ($contactEmail !== "" && !filter_var($contactEmail, FILTER_VALIDATE_EMAIL)) {
                respond(true, "Enter a valid contact email address.", null, 422);
            }

            if ($website !== "" && !filter_var($website, FILTER_VALIDATE_URL)) {
                respond(true, "Enter a valid website URL.", null, 422);
            }

            if (
                $dateOfIncorporation !== "" &&
                (
                    !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateOfIncorporation) ||
                    !checkdate(
                        (int)substr($dateOfIncorporation, 5, 2),
                        (int)substr($dateOfIncorporation, 8, 2),
                        (int)substr($dateOfIncorporation, 0, 4)
                    )
                )
            ) {
                respond(true, "Date of incorporation must be a valid YYYY-MM-DD date.", null, 422);
            }

            $conn->beginTransaction();

            $updateStmt = $conn->prepare("
                UPDATE organisations
                SET
                    organisation_name = :legal_name,
                    trading_name = :trading_name,
                    organisation_type = :org_type,
                    verification_status = :status,
                    rc_number = :rc_number,
                    tin = :tin,
                    date_of_incorporation = :date_of_incorporation,
                    sector = :sector,
                    registered_address = :registered_address,
                    operating_address = :operating_address,
                    website = :website,
                    contact_email = :contact_email,
                    contact_phone = :contact_phone,
                    contact_person = :contact_person,
                    contact_person_title = :contact_person_title,
                    verified_by = CASE
                        WHEN :verified_status = 'verified' THEN :verified_by
                        ELSE verified_by
                    END,
                    verified_at = CASE
                        WHEN :verified_status_2 = 'verified' THEN COALESCE(verified_at, NOW())
                        ELSE verified_at
                    END,
                    updated_at = NOW()
                WHERE id = :id
            ");

            $updateStmt->execute([
                ":legal_name" => $legalName,
                ":trading_name" => $tradingName !== "" ? $tradingName : null,
                ":org_type" => $orgType,
                ":status" => $status,
                ":rc_number" => $rcNumber !== "" ? $rcNumber : null,
                ":tin" => $tin !== "" ? $tin : null,
                ":date_of_incorporation" => $dateOfIncorporation !== "" ? $dateOfIncorporation : null,
                ":sector" => $sector !== "" ? $sector : null,
                ":registered_address" => $registeredAddress !== "" ? $registeredAddress : null,
                ":operating_address" => $operatingAddress !== "" ? $operatingAddress : null,
                ":website" => $website !== "" ? $website : null,
                ":contact_email" => $contactEmail !== "" ? $contactEmail : null,
                ":contact_phone" => $contactPhone !== "" ? $contactPhone : null,
                ":contact_person" => $contactPerson !== "" ? $contactPerson : null,
                ":contact_person_title" => $contactPersonTitle !== "" ? $contactPersonTitle : null,
                ":verified_status" => $status,
                ":verified_by" => $my_details->id,
                ":verified_status_2" => $status,
                ":id" => $organisationId
            ]);

            $conn->commit();

            $orgStmt = $conn->prepare("
                SELECT *
                FROM organisations
                WHERE id = :id
                LIMIT 1
            ");
            $orgStmt->execute([":id" => $organisationId]);
            $org = $orgStmt->fetch(PDO::FETCH_ASSOC);

            respond(false, "Organisation configuration saved.", [
                "organisation" => [
                    "id" => $org["id"],
                    "legal_name" => $org["organisation_name"],
                    "trading_name" => $org["trading_name"],
                    "org_type" => $org["organisation_type"],
                    "status" => $org["verification_status"],
                    "rc_number" => $org["rc_number"],
                    "tin" => $org["tin"],
                    "date_of_incorporation" => $org["date_of_incorporation"],
                    "sector" => $org["sector"],
                    "registered_address" => $org["registered_address"],
                    "operating_address" => $org["operating_address"],
                    "website" => $org["website"],
                    "contact_email" => $org["contact_email"],
                    "contact_phone" => $org["contact_phone"],
                    "contact_person" => $org["contact_person"],
                    "contact_person_title" => $org["contact_person_title"],
                    "rejection_reason" => $org["rejection_reason"],
                    "verified_by" => $org["verified_by"],
                    "verified_at" => $org["verified_at"],
                    "created_at" => $org["created_at"],
                    "updated_at" => $org["updated_at"]
                ]
            ]);
        }

        $documentsStmt = $conn->prepare("
            SELECT
                rd.id,
                rd.document_type AS kind,
                CASE rd.document_type
                    WHEN 'cac' THEN 'CAC Certificate'
                    WHEN 'tin' THEN 'Tax Identification'
                    WHEN 'signatory_id' THEN 'Authorised Signatory ID'
                    WHEN 'directors_list' THEN 'Directors and Shareholders List'
                    WHEN 'licence' THEN CONCAT(
                        'Licence',
                        CASE
                            WHEN rd.licence_type IS NOT NULL AND rd.licence_type <> ''
                            THEN CONCAT(' - ', rd.licence_type)
                            ELSE ''
                        END
                    )
                    ELSE rd.document_type
                END AS label,
                rd.original_name AS file_name,
                rd.file_path AS file_url,
                COALESCE(odr.status, 'pending') AS status,
                odr.rejection_reason,
                odr.reviewed_by,
                odr.reviewed_at,
                rd.created_at AS uploaded_at
            FROM registration_documents rd
            INNER JOIN registration_requests rr
                ON rr.id = rd.registration_request_id
            INNER JOIN users u
                ON u.id = rr.completed_user_id
            LEFT JOIN organisation_document_reviews odr
                ON odr.registration_document_id = rd.id
            WHERE u.organisation_id = :organisation_id
            ORDER BY rd.created_at DESC
        ");

        $documentsStmt->execute([
            ":organisation_id" => $organisationId
        ]);

        $documents = $documentsStmt->fetchAll(PDO::FETCH_ASSOC);

        $verifiedBy = null;

        if (!empty($org["verified_by"])) {
            $verifiedStmt = $conn->prepare("
                SELECT full_name
                FROM users
                WHERE id = :id
                LIMIT 1
            ");
            $verifiedStmt->execute([
                ":id" => $org["verified_by"]
            ]);
            $verifiedBy = $verifiedStmt->fetchColumn() ?: $org["verified_by"];
        }

        respond(false, "Organisation configuration loaded.", [
            "organisation" => [
                "id" => $org["id"],
                "legal_name" => $org["organisation_name"],
                "trading_name" => $org["trading_name"],
                "org_type" => $org["organisation_type"],
                "status" => $org["verification_status"],
                "rc_number" => $org["rc_number"],
                "tin" => $org["tin"],
                "date_of_incorporation" => $org["date_of_incorporation"],
                "sector" => $org["sector"],
                "registered_address" => $org["registered_address"],
                "operating_address" => $org["operating_address"],
                "website" => $org["website"],
                "contact_email" => $org["contact_email"],
                "contact_phone" => $org["contact_phone"],
                "contact_person" => $org["contact_person"],
                "contact_person_title" => $org["contact_person_title"],
                "rejection_reason" => $org["rejection_reason"],
                "verified_by" => $verifiedBy,
                "verified_at" => $org["verified_at"],
                "created_at" => $org["created_at"],
                "updated_at" => $org["updated_at"]
            ],
            "documents" => $documents
        ]);
    } catch (Throwable $e) {
        if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log("Admin organisation configuration error: " . $e->getMessage());

        respond(true, "Could not process organisation configuration.", null, 500);
    }