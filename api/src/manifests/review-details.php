<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $permission = $conn->prepare("
            SELECT 1
            FROM role_permissions rp
            INNER JOIN permissions p ON p.id = rp.permission_id
            WHERE rp.role_id = :role_id
            AND p.permission_key = 'operations.manage'
            LIMIT 1
        ");
        $permission->execute([":role_id" => $roleId]);

        if (!$permission->fetchColumn()) {
            http_response_code(403);
            echo json_encode(["error" => true, "data" => "You do not have permission to review manifests.", "code" => null]);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT
                id,
                manifest_ref,
                bill_of_lading,
                vessel,
                shipping_line,
                origin_port,
                eta,
                containers,
                packages,
                gross_weight,
                consignee,
                consignee_type,
                consignee_organisation_id,
                agent,
                agent_organisation_id,
                source,
                status,
                notes,
                review_reason,
                review_responsible_party,
                flagged_by,
                flagged_at,
                matched_shipment_id,
                consignee_email,
                consignee_phone,
                consignee_address,
                consignee_status,
                review_status,
                correction_reason,
                reviewed_by,
                reviewed_at,
                received_at,
                updated_at
            FROM operation_manifests
            WHERE review_responsible_party = 'Operations'
            AND flagged_at IS NOT NULL
            AND review_status IN ('Pending', 'In Review')
            ORDER BY flagged_at ASC
        ");

        $stmt->execute();

        echo json_encode([
            "error" => false,
            "data" => $stmt->fetchAll(PDO::FETCH_ASSOC),
            "code" => null
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => true, "data" => "Could not load manifest reviews.", "code" => null]);
    }