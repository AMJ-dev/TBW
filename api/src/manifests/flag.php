<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $id = trim((string)($_GET['id'] ?? ''));

    $reason = trim((string)($_POST['reason'] ?? ''));
    $responsibleParty = trim((string)($_POST['responsible_party'] ?? ''));
    $allowedParties = ['', 'Organisation', 'Carrier', 'Operations'];

    if (mb_strlen($reason) < 5 || mb_strlen($reason) > 2000) {
        http_response_code(422);
        echo json_encode(['error' => true, 'data' => 'Enter a reason between 5 and 2000 characters.', 'code' => null]);
        exit;
    }

    if (!in_array($responsibleParty, $allowedParties, true)) {
        http_response_code(422);
        echo json_encode(['error' => true, 'data' => 'Invalid responsible party.', 'code' => null]);
        exit;
    }

    try {
        $conn->beginTransaction();

        $get = $conn->prepare('SELECT status FROM operation_manifests WHERE id = ? FOR UPDATE');
        $get->execute([$id]);
        $manifest = $get->fetch(PDO::FETCH_ASSOC);

        if (!$manifest) {
            $conn->rollBack();
            http_response_code(404);
            echo json_encode(['error' => true, 'data' => 'Manifest not found.', 'code' => null]);
            exit;
        }

        $status = (string)$manifest['status'];
        if (in_array($status, ['Duplicate', 'Discrepancy'], true)) {
            $conn->rollBack();
            http_response_code(409);
            echo json_encode(['error' => true, 'data' => 'This manifest is already flagged for review or marked as a duplicate.', 'code' => null]);
            exit;
        }

        $up = $conn->prepare("UPDATE operation_manifests SET status = 'Discrepancy', review_reason = :reason, review_responsible_party = :responsible_party, flagged_by = :actor_id, flagged_at = CURRENT_TIMESTAMP, notes = CASE WHEN COALESCE(notes, '') = '' THEN :note_empty ELSE CONCAT(notes, '\\n', :note_append) END WHERE id = :id");
        $note = 'Flagged for review: ' . $reason . ($responsibleParty !== '' ? ' | Responsible: ' . $responsibleParty : '');
        $up->execute([
            ':reason' => $reason,
            ':responsible_party' => $responsibleParty !== '' ? $responsibleParty : null,
            ':actor_id' => (string)$my_details->id,
            ':note_empty' => $note,
            ':note_append' => $note,
            ':id' => $id
        ]);

        $details = json_encode([
            'reason' => $reason,
            'responsible_party' => $responsibleParty !== '' ? $responsibleParty : null
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $event = $conn->prepare("INSERT INTO operation_manifest_events (id, manifest_id, actor_id, action, from_status, to_status, details) VALUES (:event_id, :manifest_id, :actor_id, 'FLAGGED_FOR_REVIEW', :from_status, 'Discrepancy', :details)");
        $event->execute([
            ':event_id' => generateId(),
            ':manifest_id' => $id,
            ':actor_id' => (string)$my_details->id,
            ':from_status' => $status,
            ':details' => $details
        ]);

        $conn->commit();

        echo json_encode([
            'error' => false,
            'data' => 'Manifest flagged for review.',
            'code' => [
                'id' => $id,
                'status' => 'Discrepancy',
                'reason' => $reason,
                'responsible_party' => $responsibleParty !== '' ? $responsibleParty : null,
                'flagged_at' => date('Y-m-d H:i:s')
            ]
        ]);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        http_response_code(500);
        echo json_encode(['error' => true, 'data' => 'Unable to flag manifest. Please try again.', 'code' => $e->getMessage()]);
    }
