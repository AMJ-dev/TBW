<?php

try {

    $stmt = $conn->prepare("
        SELECT
            o.id,
            o.organisation_name AS name,
            o.organisation_type AS type,
            o.rc_number,
            o.tin,
            o.date_of_incorporation,
            o.sector,
            o.registered_address,
            o.website,
            o.verification_status AS status,
            o.rejection_reason,
            o.verified_by,
            o.verified_at,
            o.created_at,
            o.updated_at,

            owner.id AS owner_id,
            owner.full_name AS owner_name,
            owner.email AS contact_email,
            owner.phone AS contact_phone,
            owner.pics AS owner_pics,
            owner.account_status AS owner_account_status,
            owner.email_verified_at AS owner_email_verified_at,
            owner.phone_verified_at AS owner_phone_verified_at,
            owner.last_login_at AS owner_last_login_at,

            om.job_title AS owner_job_title

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
            om.id AS membership_id,
            u.id,
            u.full_name,
            u.email,
            u.phone,
            u.pics,
            u.account_type,
            u.account_status,
            u.email_verified_at,
            u.phone_verified_at,
            u.mfa_enabled,
            u.last_login_at,
            u.password_changed_at,
            u.created_at AS user_created_at,
            u.updated_at AS user_updated_at,

            om.role_id,
            r.role_key,
            r.role_name,
            r.scope AS role_scope,
            r.description AS role_description,

            om.job_title,
            om.membership_status,
            om.invited_by,
            om.joined_at,
            om.created_at AS membership_created_at

        FROM organisation_members om

        INNER JOIN users u
            ON u.id = om.user_id

        LEFT JOIN roles r
            ON r.id = om.role_id

        WHERE om.organisation_id = :organisation_id
        AND om.membership_status != 'revoked'

        ORDER BY
            CASE
                WHEN r.role_key = 'organisation_owner' THEN 0
                ELSE 1
            END,
            om.created_at ASC
    ");

    $staffStmt->execute([
        ":organisation_id" => $id
    ]);

    $staff = $staffStmt->fetchAll(PDO::FETCH_ASSOC);

    $documentsStmt = $conn->prepare("
        SELECT
            rd.id,
            rd.registration_request_id,
            rd.document_type AS kind,

            CASE rd.document_type
                WHEN 'cac' THEN 'CAC Certificate'
                WHEN 'tin' THEN 'Tax Identification'
                WHEN 'signatory_id' THEN 'Authorised Signatory ID'
                WHEN 'directors_list' THEN 'Directors and Shareholders List'
                WHEN 'utility_bill' THEN 'Utility Bill / Proof of Address'
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

            rd.licence_type,
            rd.licence_reference,
            rd.file_path AS file_url,
            rd.original_name AS file_name,
            rd.mime_type,
            rd.file_size,

            CASE
                WHEN odr.id IS NULL THEN 'pending'
                ELSE odr.status
            END AS status,

            odr.id AS review_id,
            odr.rejection_reason,
            odr.reviewed_by,
            reviewer.full_name AS reviewed_by_name,
            reviewer.email AS reviewed_by_email,
            odr.reviewed_at,

            rd.created_at AS uploaded_at

        FROM registration_documents rd

        INNER JOIN registration_requests rr
            ON rr.id = rd.registration_request_id

        INNER JOIN users u
            ON u.id = rr.completed_user_id

        LEFT JOIN organisation_document_reviews odr
            ON odr.registration_document_id = rd.id

        LEFT JOIN users reviewer
            ON reviewer.id = odr.reviewed_by

        WHERE u.organisation_id = :organisation_id

        AND NOT EXISTS (
            SELECT 1
            FROM registration_documents newer

            INNER JOIN registration_requests newer_rr
                ON newer_rr.id = newer.registration_request_id

            INNER JOIN users newer_u
                ON newer_u.id = newer_rr.completed_user_id

            WHERE newer_u.organisation_id = :organisation_id_2
            AND newer.document_type = rd.document_type

            AND (
                rd.document_type <> 'licence'
                OR COALESCE(newer.licence_type, '') =
                   COALESCE(rd.licence_type, '')
            )

            AND (
                newer.created_at > rd.created_at
                OR (
                    newer.created_at = rd.created_at
                    AND newer.id > rd.id
                )
            )
        )

        ORDER BY
            CASE rd.document_type
                WHEN 'cac' THEN 1
                WHEN 'tin' THEN 2
                WHEN 'signatory_id' THEN 3
                WHEN 'directors_list' THEN 4
                WHEN 'utility_bill' THEN 5
                WHEN 'licence' THEN 6
                ELSE 7
            END,
            rd.created_at DESC
    ");

    $documentsStmt->execute([
        ":organisation_id" => $id,
        ":organisation_id_2" => $id
    ]);

    $documents = $documentsStmt->fetchAll(PDO::FETCH_ASSOC);

    $registrationStmt = $conn->prepare("
        SELECT
            rr.id,
            rr.registration_ref,
            rr.email,
            rr.phone,
            rr.status,
            rr.email_verified_at,
            rr.phone_verified_at,
            rr.expires_at,
            rr.completed_user_id,
            rr.created_at,
            rr.updated_at
        FROM registration_requests rr
        INNER JOIN users u
            ON u.id = rr.completed_user_id
        WHERE u.organisation_id = :organisation_id
        ORDER BY rr.created_at DESC
    ");

    $registrationStmt->execute([
        ":organisation_id" => $id
    ]);

    $registrations = $registrationStmt->fetchAll(PDO::FETCH_ASSOC);

    $documentSummaryStmt = $conn->prepare("
        SELECT
            COUNT(*) AS total,

            SUM(
                CASE
                    WHEN odr.id IS NULL
                    OR odr.status = 'pending'
                    THEN 1
                    ELSE 0
                END
            ) AS pending,

            SUM(
                CASE
                    WHEN odr.status = 'approved'
                    THEN 1
                    ELSE 0
                END
            ) AS approved,

            SUM(
                CASE
                    WHEN odr.status = 'rejected'
                    THEN 1
                    ELSE 0
                END
            ) AS rejected

        FROM registration_documents rd

        INNER JOIN registration_requests rr
            ON rr.id = rd.registration_request_id

        INNER JOIN users u
            ON u.id = rr.completed_user_id

        LEFT JOIN organisation_document_reviews odr
            ON odr.registration_document_id = rd.id

        WHERE u.organisation_id = :organisation_id

        AND NOT EXISTS (
            SELECT 1
            FROM registration_documents newer

            INNER JOIN registration_requests newer_rr
                ON newer_rr.id = newer.registration_request_id

            INNER JOIN users newer_u
                ON newer_u.id = newer_rr.completed_user_id

            WHERE newer_u.organisation_id = :organisation_id_2
            AND newer.document_type = rd.document_type

            AND (
                rd.document_type <> 'licence'
                OR COALESCE(newer.licence_type, '') =
                   COALESCE(rd.licence_type, '')
            )

            AND (
                newer.created_at > rd.created_at
                OR (
                    newer.created_at = rd.created_at
                    AND newer.id > rd.id
                )
            )
        )
    ");

    $documentSummaryStmt->execute([
        ":organisation_id" => $id,
        ":organisation_id_2" => $id
    ]);

    $documentSummary = $documentSummaryStmt->fetch(PDO::FETCH_ASSOC);

    $memberSummaryStmt = $conn->prepare("
        SELECT
            COUNT(*) AS total,

            SUM(
                CASE
                    WHEN om.membership_status = 'active'
                    THEN 1
                    ELSE 0
                END
            ) AS active,

            SUM(
                CASE
                    WHEN om.membership_status = 'pending'
                    THEN 1
                    ELSE 0
                END
            ) AS pending,

            SUM(
                CASE
                    WHEN u.account_status = 'active'
                    THEN 1
                    ELSE 0
                END
            ) AS active_accounts,

            SUM(
                CASE
                    WHEN u.account_status = 'pending_approval'
                    THEN 1
                    ELSE 0
                END
            ) AS pending_accounts,

            SUM(
                CASE
                    WHEN u.account_status = 'suspended'
                    THEN 1
                    ELSE 0
                END
            ) AS suspended_accounts,

            SUM(
                CASE
                    WHEN u.account_status = 'locked'
                    THEN 1
                    ELSE 0
                END
            ) AS locked_accounts

        FROM organisation_members om

        INNER JOIN users u
            ON u.id = om.user_id

        WHERE om.organisation_id = :organisation_id
        AND om.membership_status != 'revoked'
    ");

    $memberSummaryStmt->execute([
        ":organisation_id" => $id
    ]);

    $memberSummary = $memberSummaryStmt->fetch(PDO::FETCH_ASSOC);

    $rolesStmt = $conn->prepare("
        SELECT
            r.id,
            r.role_key,
            r.role_name,
            r.scope,
            r.description,
            r.is_active

        FROM roles r

        INNER JOIN organisation_members om
            ON om.role_id = r.id

        WHERE om.organisation_id = :organisation_id
        AND om.membership_status != 'revoked'

        GROUP BY
            r.id,
            r.role_key,
            r.role_name,
            r.scope,
            r.description,
            r.is_active

        ORDER BY r.role_name ASC
    ");

    $rolesStmt->execute([
        ":organisation_id" => $id
    ]);

    $roles = $rolesStmt->fetchAll(PDO::FETCH_ASSOC);

    $containers = [];

    echo json_encode([
        "error" => false,
        "data" => "Organisation retrieved successfully",
        "code" => [
            "organization" => $organization,
            "staff" => $staff,
            "documents" => $documents,
            "document_summary" => $documentSummary,
            "registrations" => $registrations,
            "member_summary" => $memberSummary,
            "roles" => $roles,
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