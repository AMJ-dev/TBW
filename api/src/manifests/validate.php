<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $id = trim((string)($_GET['id'] ?? ''));

    try {
        $conn->beginTransaction();

        $get = $conn->prepare('SELECT * FROM operation_manifests WHERE id = ? FOR UPDATE');
        $get->execute([$id]);
        $m = $get->fetch(PDO::FETCH_ASSOC);

        if (!$m) {
            $conn->rollBack();
            echo json_encode(['error' => true, 'data' => 'Manifest not found.', 'code' => null]);
            exit;
        }

        if (!in_array($m['status'], ['Pre-advice', 'Discrepancy', 'Review required'], true)) {
            $conn->rollBack();
            echo json_encode([
                'error' => true,
                'data' => 'This manifest cannot be validated in its current status.',
                'code' => null
            ]);
            exit;
        }

        $dup = $conn->prepare('SELECT id FROM operation_manifests WHERE id <> :id AND (manifest_ref = :ref OR bill_of_lading = :bl) LIMIT 1');
        $dup->execute([
            ':id' => $id,
            ':ref' => $m['manifest_ref'],
            ':bl' => $m['bill_of_lading']
        ]);

        if ($dup->fetchColumn()) {
            $conn->rollBack();
            echo json_encode(['error' => true, 'data' => 'Duplicate manifest reference or bill of lading found.', 'code' => null]);
            exit;
        }

        if (
            trim((string)$m['vessel']) === '' ||
            trim((string)$m['shipping_line']) === '' ||
            trim((string)$m['origin_port']) === '' ||
            trim((string)$m['eta']) === ''
        ) {
            $conn->rollBack();
            echo json_encode([
                'error' => true,
                'data' => 'Vessel, shipping line, origin port and ETA are required for validation.',
                'code' => null
            ]);
            exit;
        }

        $candidate = $conn->prepare("
            SELECT s.id, s.shipment_reference, s.status
            FROM portal_shipments s
            WHERE UPPER(TRIM(s.bill_of_lading)) = UPPER(TRIM(:bl))
            ORDER BY s.created_at DESC
            LIMIT 3
        ");
        $candidate->execute([':bl' => $m['bill_of_lading']]);
        $candidates = $candidate->fetchAll(PDO::FETCH_ASSOC);

        $shipmentId = count($candidates) === 1 ? $candidates[0]['id'] : null;
        $shipmentReference = $shipmentId ? $candidates[0]['shipment_reference'] : null;

        if ($shipmentId) {
            $link = $conn->prepare("
                INSERT IGNORE INTO operation_manifest_shipment_matches
                (id, manifest_id, shipment_id, match_method, matched_by, confirmed_by)
                VALUES (:id, :manifest, :shipment, 'BILL_OF_LADING_AUTO', :matched_by, :confirmed_by)
            ");

            $link->execute([
                ':id' => generateId(),
                ':manifest' => $id,
                ':shipment' => $shipmentId,
                ':matched_by' => (string)$my_details->id,
                ':confirmed_by' => (string)$my_details->id
            ]);

            $updateShipment = $conn->prepare("
                UPDATE portal_shipments
                SET status = 'EXPECTED',
                    updated_at = NOW()
                WHERE id = :shipment_id
                AND status IN ('PENDING_REVIEW', 'CHANGES_REQUESTED')
            ");

            $updateShipment->execute([
                ':shipment_id' => $shipmentId
            ]);
        }

        $up = $conn->prepare("
            UPDATE operation_manifests
            SET status = 'Validated',
                validated_by = :actor,
                validated_at = NOW(),
                matched_shipment_id = :shipment
            WHERE id = :id
        ");

        $up->execute([
            ':actor' => (string)$my_details->id,
            ':shipment' => $shipmentId,
            ':id' => $id
        ]);

        if ($shipmentId) {
            $details = 'Manifest validated and linked to shipment ' . $shipmentReference . '. Shipment status updated to EXPECTED if eligible.';
        } elseif (count($candidates) > 1) {
            $details = 'Manifest validated; multiple shipment declarations share this bill of lading. Operator confirmation is required.';
        } else {
            $details = 'Manifest validated; no shipment declaration matched. Operator can link a shipment later.';
        }

        $event = $conn->prepare("
            INSERT INTO operation_manifest_events
            (id, manifest_id, actor_id, action, from_status, to_status, details)
            VALUES (:event_id, :id, :actor, 'VALIDATED', :from_status, 'Validated', :details)
        ");

        $event->execute([
            ':event_id' => generateId(),
            ':id' => $id,
            ':actor' => (string)$my_details->id,
            ':from_status' => $m['status'],
            ':details' => $details
        ]);

        $conn->commit();

        echo json_encode([
            'error' => false,
            'data' => 'Manifest validated.',
            'code' => [
                'id' => $id,
                'status' => 'Validated',
                'matched_shipment_id' => $shipmentId,
                'shipment_reference' => $shipmentReference,
                'shipment_status' => $shipmentId ? 'EXPECTED' : null,
                'match_required' => !$shipmentId,
                'candidate_count' => count($candidates)
            ]
        ]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        echo json_encode([
            'error' => true,
            'data' => 'Unable to validate manifest.',
            'code' => $e->getMessage()
        ]);
    }