<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json");

$id = trim($_GET["id"] ?? "");

if ($id === "") {
    http_response_code(400);

    echo json_encode([
        "error" => true,
        "data" => "Invalid organisation ID",
        "code" => $id
    ]);

    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "error" => true,
        "data" => "Method not allowed",
        "code" => null
    ]);

    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT
            o.id,
            o.organisation_name AS name,
            o.organisation_type AS type,
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
        WHERE o.id = :id
        LIMIT 1
    ");

    $stmt->execute([
        ":id" => $id
    ]);

    $organization = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$organization) {
        http_response_code(404);

        echo json_encode([
            "error" => true,
            "data" => "Organisation not found",
            "code" => null
        ]);

        exit;
    }

    $staffStmt = $conn->prepare("
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.phone,
            u.pics,
            u.account_status,
            u.email_verified_at,
            u.last_login_at,
            u.created_at,
            r.role_name AS role_in_org
        FROM organisation_members om
        INNER JOIN users u
            ON u.id = om.user_id
        LEFT JOIN roles r
            ON r.id = om.role_id
        WHERE om.organisation_id = :organisation_id
        AND om.membership_status != 'revoked'
        ORDER BY om.created_at ASC
    ");

    $staffStmt->execute([
        ":organisation_id" => $id
    ]);

    $staff = $staffStmt->fetchAll(PDO::FETCH_ASSOC);

    $documentsStmt = $conn->prepare("
        SELECT
            rd.id,
            rd.document_type AS kind,
            CASE rd.document_type
                WHEN 'cac' THEN 'CAC Certificate'
                WHEN 'tin' THEN 'Tax Identification'
                WHEN 'signatory_id' THEN 'Signatory ID'
                WHEN 'licence' THEN CONCAT(
                    'Licence',
                    CASE
                        WHEN rd.licence_type IS NOT NULL
                        AND rd.licence_type <> ''
                        THEN CONCAT(' - ', rd.licence_type)
                        ELSE ''
                    END
                )
                ELSE rd.document_type
            END AS label,
            rd.original_name AS file_name,
            rd.file_path AS file_url,
            CASE
                WHEN odr.id IS NULL THEN 'pending'
                ELSE odr.status
            END AS status,
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
        ":organisation_id" => $id
    ]);

    $documents = $documentsStmt->fetchAll(PDO::FETCH_ASSOC);

    $containers = [];

    echo json_encode([
        "error" => false,
        "data" => "Organisation retrieved successfully",
        "code" => [
            "organization" => $organization,
            "staff" => $staff,
            "documents" => $documents,
            "containers" => $containers
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