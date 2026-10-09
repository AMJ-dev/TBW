<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    if ($_SERVER["REQUEST_METHOD"] !== "GET") {
        http_response_code(405);
        echo json_encode(["error" => true, "data" => "Method not allowed", "code" => null]);
        exit;
    }

    try {
        $q = $conn->prepare("SELECT role_key FROM roles WHERE id = :id AND scope = 'system' AND is_active = 1 LIMIT 1");
        $q->bindValue(":id", $my_details->system_role_id);
        $q->execute();
        $role = $q->fetch(PDO::FETCH_ASSOC);

        if (!$role || $role["role_key"] !== "system_admin") {
            http_response_code(403);
            echo json_encode(["error" => true, "data" => "Access denied", "code" => null]);
            exit;
        }

        $id = trim($_GET["id"] ?? "");

        if ($id !== "") {
            $q = $conn->prepare("SELECT id, organisation_name AS legal_name, trading_name, organisation_type AS org_type, verification_status AS status, rc_number, tin, date_of_incorporation, sector, registered_address, operating_address, website, contact_email, contact_phone, contact_person, contact_person_title, rejection_reason, verified_by, verified_at, created_at, updated_at FROM organisations WHERE id = :id LIMIT 1");
            $q->bindValue(":id", $id);
        } else {
            $q = $conn->prepare("SELECT id, organisation_name AS legal_name, trading_name, organisation_type AS org_type, verification_status AS status, rc_number, tin, date_of_incorporation, sector, registered_address, operating_address, website, contact_email, contact_phone, contact_person, contact_person_title, rejection_reason, verified_by, verified_at, created_at, updated_at FROM organisations WHERE organisation_type = 'terminal' ORDER BY created_at ASC LIMIT 1");
        }

        $q->execute();
        $org = $q->fetch(PDO::FETCH_ASSOC);

        if (!$org) {
            http_response_code(404);
            echo json_encode(["error" => true, "data" => "Organisation not found", "code" => null]);
            exit;
        }

        $q = $conn->prepare("
            SELECT
                rd.id,
                rd.document_type AS kind,
                rd.document_type AS label,
                rd.original_name AS file_name,
                CONCAT('/', rd.file_path) AS file_url,
                rd.created_at AS uploaded_at
            FROM registration_documents rd
            LEFT JOIN organisation_document_reviews odr ON odr.registration_document_id = rd.id
            LEFT JOIN registration_requests rr ON rr.id = rd.registration_request_id
            LEFT JOIN users owner ON owner.id = rr.completed_user_id
            WHERE rd.document_type <> 'licence'
            AND (odr.organisation_id = :review_org OR owner.organisation_id = :owner_org)
            ORDER BY rd.created_at DESC
        ");
        $q->bindValue(":review_org", $org["id"]);
        $q->bindValue(":owner_org", $org["id"]);
        $q->execute();
        $docs = $q->fetchAll(PDO::FETCH_ASSOC);

        $q = $conn->prepare("
            SELECT
                rd.id,
                rd.document_type AS kind,
                rd.licence_type,
                rd.licence_reference,
                rd.original_name AS file_name,
                CONCAT('/', rd.file_path) AS file_url,
                rd.created_at AS uploaded_at
            FROM registration_documents rd
            LEFT JOIN organisation_document_reviews odr ON odr.registration_document_id = rd.id
            LEFT JOIN registration_requests rr ON rr.id = rd.registration_request_id
            LEFT JOIN users owner ON owner.id = rr.completed_user_id
            WHERE rd.document_type = 'licence'
            AND (odr.organisation_id = :review_org OR owner.organisation_id = :owner_org)
            ORDER BY rd.created_at DESC
        ");
        $q->bindValue(":review_org", $org["id"]);
        $q->bindValue(":owner_org", $org["id"]);
        $q->execute();
        $licences = $q->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => "Organisation configuration loaded",
            "code" => [
                "organisation" => $org,
                "documents" => $docs,
                "licences" => $licences
            ]
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(["error" => true, "data" => $e->getMessage(), "code" => null]);
    }