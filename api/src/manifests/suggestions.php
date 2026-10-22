<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if (($my_details->account_type ?? '') !== 'system' || empty($my_details->id)) {
   
    echo json_encode(['error' => true, 'data' => 'Access denied.', 'code' => null]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
   
    echo json_encode(['error' => true, 'data' => 'Method not allowed.', 'code' => null]);
    exit;
}

$manifestId = trim((string)($_POST['manifest_id'] ?? ''));
if ($manifestId === '') {
    
    echo json_encode(['error' => true, 'data' => 'Manifest ID is required.', 'code' => null]);
    exit;
}

try {
    $manifestQuery = $conn->prepare('SELECT id, bill_of_lading, consignee, vessel FROM operation_manifests WHERE id = ? LIMIT 1');
    $manifestQuery->execute([$manifestId]);
    $manifest = $manifestQuery->fetch(PDO::FETCH_ASSOC);

    if (!$manifest) {
        
        echo json_encode(['error' => true, 'data' => 'Manifest not found.', 'code' => null]);
        exit;
    }

    $query = $conn->prepare("
        SELECT
            s.id,
            s.shipment_reference,
            s.bill_of_lading,
            s.consignee,
            s.vessel_name,
            s.status,
            o.organisation_name,
            (CASE WHEN TRIM(COALESCE(s.bill_of_lading, '')) <> '' AND UPPER(TRIM(s.bill_of_lading)) = UPPER(TRIM(:manifest_bl_score)) THEN 100 ELSE 0 END
             + CASE WHEN EXISTS (
                SELECT 1
                FROM operation_manifest_containers mc
                INNER JOIN portal_shipment_containers sc
                    ON UPPER(REPLACE(TRIM(sc.container_no), ' ', '')) = UPPER(REPLACE(TRIM(mc.container_no), ' ', ''))
                WHERE mc.manifest_id = :manifest_id_score
                  AND sc.shipment_id = s.id
             ) THEN 80 ELSE 0 END
             + CASE WHEN TRIM(COALESCE(:manifest_consignee_score, '')) <> '' AND UPPER(TRIM(COALESCE(s.consignee, ''))) = UPPER(TRIM(:manifest_consignee_compare)) THEN 10 ELSE 0 END
            ) AS match_score,
            (SELECT COUNT(*) FROM operation_manifest_containers mc
                INNER JOIN portal_shipment_containers sc
                    ON UPPER(REPLACE(TRIM(sc.container_no), ' ', '')) = UPPER(REPLACE(TRIM(mc.container_no), ' ', ''))
                WHERE mc.manifest_id = :manifest_id_count AND sc.shipment_id = s.id
            ) AS matching_container_count
        FROM portal_shipments s
        LEFT JOIN organisations o ON o.id = s.organisation_id
        WHERE
            (TRIM(COALESCE(:manifest_bl_filter, '')) <> '' AND UPPER(TRIM(COALESCE(s.bill_of_lading, ''))) = UPPER(TRIM(:manifest_bl_compare)) AND s.bill_of_lading IS NOT NULL)
            OR EXISTS (
                SELECT 1
                FROM operation_manifest_containers mc
                INNER JOIN portal_shipment_containers sc
                    ON UPPER(REPLACE(TRIM(sc.container_no), ' ', '')) = UPPER(REPLACE(TRIM(mc.container_no), ' ', ''))
                WHERE mc.manifest_id = :manifest_id_filter
                  AND sc.shipment_id = s.id
            )
        ORDER BY match_score DESC, matching_container_count DESC, s.created_at DESC
        LIMIT 20
    ");
    $query->execute([
        ':manifest_bl_score' => $manifest['bill_of_lading'],
        ':manifest_id_score' => $manifestId,
        ':manifest_consignee_score' => $manifest['consignee'],
        ':manifest_consignee_compare' => $manifest['consignee'],
        ':manifest_id_count' => $manifestId,
        ':manifest_bl_filter' => $manifest['bill_of_lading'],
        ':manifest_bl_compare' => $manifest['bill_of_lading'],
        ':manifest_id_filter' => $manifestId
    ]);
    $suggestions = $query->fetchAll(PDO::FETCH_ASSOC);

    foreach ($suggestions as &$suggestion) {
        $score = (int)$suggestion['match_score'];
        $reasons = [];
        if (strcasecmp(trim((string)$suggestion['bill_of_lading']), trim((string)$manifest['bill_of_lading'])) === 0 && trim((string)$manifest['bill_of_lading']) !== '') {
            $reasons[] = 'Bill of lading matches';
        }
        if ((int)$suggestion['matching_container_count'] > 0) {
            $reasons[] = (int)$suggestion['matching_container_count'] . ' container number(s) match';
        }
        if (!$reasons) $reasons[] = 'Possible match; verify details manually';
        $suggestion['match_score'] = $score;
        $suggestion['matching_container_count'] = (int)$suggestion['matching_container_count'];
        $suggestion['match_reasons'] = $reasons;
        $suggestion['recommended'] = $score >= 80;
    }
    unset($suggestion);

    echo json_encode(['error' => false, 'data' => true, 'code' => ['suggestions' => $suggestions]], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    
    echo json_encode(['error' => true, 'data' => 'Unable to generate shipment matching suggestions.', 'code' => null]);
}
