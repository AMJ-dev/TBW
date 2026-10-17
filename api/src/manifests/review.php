<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed.",
        "code" => 405
    ]);
    exit;
}

if (
    empty($my_details->id) ||
    ($my_details->account_type ?? "") !== "system"
) {
    http_response_code(403);
    echo json_encode([
        "error" => true,
        "data" => "You are not authorised to access Operations manifest reviews.",
        "code" => 403
    ]);
    exit;
}

try {
    $sql = "
        SELECT
            om.id,
            om.manifest_ref,
            om.bill_of_lading,

            COALESCE(NULLIF(ps.vessel_name, ''), om.vessel) AS vessel,
            COALESCE(NULLIF(ps.shipping_line, ''), om.shipping_line) AS shipping_line,
            COALESCE(NULLIF(ps.origin_port, ''), om.origin_port) AS origin_port,
            COALESCE(NULLIF(ps.expected_arrival, '0000-00-00 00:00:00'), NULLIF(om.eta, '')) AS eta,

            om.containers,

            COALESCE(
                NULLIF(ps.package_count, 0),
                NULLIF(om.packages, 0),
                0
            ) AS packages,

            COALESCE(
                NULLIF(ps.gross_weight, 0),
                NULLIF(om.gross_weight, ''),
                ''
            ) AS gross_weight,

            COALESCE(NULLIF(ps.consignee, ''), om.consignee) AS consignee,
            om.consignee_type,
            om.consignee_organisation_id,

            om.agent,
            om.agent_organisation_id,

            COALESCE(NULLIF(ps.consignee_email, ''), om.consignee_email) AS consignee_email,
            COALESCE(NULLIF(ps.consignee_phone, ''), om.consignee_phone) AS consignee_phone,
            om.consignee_address,

            om.source,
            om.status,
            om.notes,
            om.review_reason,
            om.review_responsible_party,
            om.flagged_by,
            om.flagged_at,
            om.duplicate_of,
            om.matched_shipment_id,
            om.created_by,
            om.validated_by,
            om.validated_at,
            om.received_at,
            om.updated_at,
            om.consignee_status,

            om.review_status,
            om.correction_reason,
            om.reviewed_by,
            om.reviewed_at,

            ps.id AS shipment_id,
            ps.shipment_reference,
            ps.user_id AS shipment_user_id,
            ps.organisation_id AS shipment_organisation_id,
            ps.shipment_type,
            ps.booking_number,
            ps.voyage_number,
            ps.origin_country,
            ps.destination_port,
            ps.cargo_description,
            ps.cargo_category,
            ps.package_type,
            ps.package_count AS shipment_package_count,
            ps.gross_weight AS shipment_gross_weight,
            ps.volume,
            ps.hs_code,
            ps.dangerous_goods,
            ps.temperature_controlled,
            ps.temperature,
            ps.special_instructions,
            ps.customs_reference,
            ps.status AS shipment_status,
            ps.created_at AS shipment_created_at,
            ps.updated_at AS shipment_updated_at

        FROM operation_manifests om

        LEFT JOIN portal_shipments ps
            ON ps.id = om.matched_shipment_id

        WHERE om.review_responsible_party = :responsible_party
            AND om.flagged_at IS NOT NULL

        ORDER BY om.flagged_at DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ":responsible_party" => "Operations"
    ]);

    $manifests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "error" => false,
        "data" => $manifests,
        "code" => null
    ]);

} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Could not load Operations manifest reviews.",
        "code" => 500
    ]);
}