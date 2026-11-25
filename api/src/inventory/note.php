
<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    header("Content-Type: application/json");

    try {
        $id = trim($_POST["id"] ?? "");
        $note = trim($_POST["note"] ?? "");

        if ($note === "") {
            echo json_encode([
                "error" => true,
                "data" => "Note is required.",
                "code" => 400
            ]);
            exit;
        }

        if (mb_strlen($note) > 5000) {
            echo json_encode([
                "error" => true,
                "data" => "Note cannot exceed 5000 characters.",
                "code" => 400
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT id
            FROM portal_shipment_containers
            WHERE id = :id
                AND received_at IS NOT NULL
                AND gate_out_at IS NULL
                AND status NOT IN (
                    'EXPECTED',
                    'SCHEDULED',
                    'ENTERED',
                    'GATE_OUT',
                    'TRANSFERRED_OUT',
                    'RETURNED_RE_EXPORTED',
                    'CANCELLED'
                )
            LIMIT 1
        ");

        $stmt->execute(["id" => $id]);
        $container = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$container) {
            echo json_encode([
                "error" => true,
                "data" => "Container not found or no longer within the terminal.",
                "code" => 404
            ]);
            exit;
        }

        $noteId = generateId();

        $insert = $conn->prepare("
            INSERT INTO terminal_inventory_notes (
                id,
                container_id,
                note,
                recorded_by
            ) VALUES (
                :id,
                :container_id,
                :note,
                :recorded_by
            )
        ");

        $insert->execute([
            "id" => $noteId,
            "container_id" => $container["id"],
            "note" => $note,
            "recorded_by" => $my_details->id
        ]);

        $getNote = $conn->prepare("
            SELECT
                n.id,
                n.container_id,
                n.note,
                n.recorded_by,
                u.full_name AS recorded_by_name,
                n.created_at,
                n.updated_at
            FROM terminal_inventory_notes n
            LEFT JOIN users u ON u.id = n.recorded_by
            WHERE n.id = ?
            LIMIT 1
        ");

        $getNote->execute([$noteId]);
        $savedNote = $getNote->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => [
                "id" => $savedNote["id"],
                "container_id" => $savedNote["container_id"],
                "note" => $savedNote["note"],
                "recorded_by" => $savedNote["recorded_by"],
                "recorded_by_name" => $savedNote["recorded_by_name"] ?: "Unknown user",
                "created_at" => $savedNote["created_at"],
                "updated_at" => $savedNote["updated_at"]
            ],
            "code" => 200
        ]);

    } catch (Throwable $e) {
        echo json_encode([
            "error" => true,
            "data" => "Could not save inventory note.",
            "code" => 500
        ]);
    }
