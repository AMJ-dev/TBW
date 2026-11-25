
<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $id = trim($_GET["id"] ?? "");

        $sql = "
            SELECT
                c.id,
                c.container_no,
                c.size,
                c.seal_no,
                c.status AS container_status,
                c.package_count,
                c.package_type AS container_package_type,
                c.gross_weight,
                s.cargo_description AS container_description,
                c.gate_in_at,
                c.received_at,
                c.stored_at,
                c.gate_out_at,
                c.created_at AS container_created_at,
                c.updated_at AS container_updated_at,

                s.id AS shipment_id,
                s.shipment_reference,
                s.shipment_type,
                s.bill_of_lading,
                s.consignee,
                s.cargo_description,
                s.package_type,
                s.package_count AS shipment_package_count,
                s.gross_weight AS shipment_gross_weight,
                s.volume,
                s.special_instructions,
                s.status AS shipment_status,
                s.organisation_id,
                o.organisation_name,

                l.id AS location_id,
                l.code AS location_code,
                l.name AS location_name,
                l.kind AS location_kind

            FROM portal_shipment_containers c

            INNER JOIN portal_shipments s
                ON s.id = c.shipment_id

            LEFT JOIN organisations o
                ON o.id = s.organisation_id

            LEFT JOIN terminal_locations l
                ON l.id = c.current_location_id

            WHERE c.id = :id
                AND c.received_at IS NOT NULL
                AND c.gate_out_at IS NULL
                AND c.status NOT IN (
                    'EXPECTED',
                    'SCHEDULED',
                    'ENTERED',
                    'GATE_OUT',
                    'TRANSFERRED_OUT',
                    'RETURNED_RE_EXPORTED',
                    'CANCELLED'
                )

            LIMIT 1
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute(["id" => $id]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            echo json_encode([
                "error" => true,
                "data" => "Container not found, not yet received, or no longer within the terminal.",
                "code" => 404
            ]);
            exit;
        }

        $movementSql = "
            SELECT *
            FROM (
                SELECT
                    ym.id,
                    ym.movement_reference,
                    'YARD' AS movement_type,
                    ym.from_location_id,
                    ym.to_location_id,
                    ym.remarks,
                    ym.completed_at,
                    ym.created_at,
                    fl.code AS from_location_code,
                    fl.name AS from_location_name,
                    fl.kind AS from_location_kind,
                    tl.code AS to_location_code,
                    tl.name AS to_location_name,
                    tl.kind AS to_location_kind,
                    e.id AS equipment_id,
                    e.equipment_name,
                    e.equipment_code,
                    e.equipment_type,
                    u.id AS moved_by_id,
                    u.full_name AS moved_by_name

                FROM terminal_yard_movements ym

                LEFT JOIN terminal_locations fl
                    ON fl.id = ym.from_location_id

                INNER JOIN terminal_locations tl
                    ON tl.id = ym.to_location_id

                LEFT JOIN terminal_equipment e
                    ON e.id = ym.equipment_id

                LEFT JOIN users u
                    ON u.id = ym.moved_by

                WHERE ym.container_id = ?

                UNION ALL

                SELECT
                    wm.id,
                    wm.movement_reference,
                    'WAREHOUSE' AS movement_type,
                    wm.from_location_id,
                    wm.to_location_id,
                    wm.remarks,
                    wm.completed_at,
                    wm.created_at,
                    fl.code AS from_location_code,
                    fl.name AS from_location_name,
                    fl.kind AS from_location_kind,
                    tl.code AS to_location_code,
                    tl.name AS to_location_name,
                    tl.kind AS to_location_kind,
                    NULL AS equipment_id,
                    NULL AS equipment_name,
                    NULL AS equipment_code,
                    NULL AS equipment_type,
                    u.id AS moved_by_id,
                    u.full_name AS moved_by_name

                FROM terminal_warehouse_movements wm

                LEFT JOIN terminal_locations fl
                    ON fl.id = wm.from_location_id

                INNER JOIN terminal_locations tl
                    ON tl.id = wm.to_location_id

                LEFT JOIN users u
                    ON u.id = wm.moved_by

                WHERE wm.container_id = ?
            ) movements

            ORDER BY movements.completed_at DESC
        ";

        $movementStmt = $conn->prepare($movementSql);
        $movementStmt->execute([$id, $id]);

        $movementRows = $movementStmt->fetchAll(PDO::FETCH_ASSOC);

        $movementHistory = array_map(function ($movement) {
            $fromLocation = $movement["from_location_name"]
                ? trim(
                    ($movement["from_location_code"]
                        ? $movement["from_location_code"] . " · "
                        : "") .
                    $movement["from_location_name"]
                )
                : "Not recorded";

            $toLocation = trim(
                ($movement["to_location_code"]
                    ? $movement["to_location_code"] . " · "
                    : "") .
                ($movement["to_location_name"] ?? "")
            );

            return [
                "id" => $movement["id"],
                "reference" => $movement["movement_reference"],
                "type" => $movement["movement_type"],
                "fromLocationId" => $movement["from_location_id"],
                "fromLocation" => $fromLocation,
                "fromLocationKind" => $movement["from_location_kind"],
                "toLocationId" => $movement["to_location_id"],
                "toLocation" => $toLocation,
                "toLocationKind" => $movement["to_location_kind"],
                "equipment" => [
                    "id" => $movement["equipment_id"],
                    "name" => $movement["equipment_name"],
                    "code" => $movement["equipment_code"],
                    "type" => $movement["equipment_type"]
                ],
                "remarks" => $movement["remarks"] ?: "",
                "movedBy" => [
                    "id" => $movement["moved_by_id"],
                    "name" => $movement["moved_by_name"] ?: "Unknown user"
                ],
                "completedAt" => $movement["completed_at"],
                "createdAt" => $movement["created_at"]
            ];
        }, $movementRows);

        $notesSql = "
            SELECT
                n.id,
                n.note,
                n.recorded_by,
                u.full_name AS recorded_by_name,
                n.created_at,
                n.updated_at

            FROM terminal_inventory_notes n

            LEFT JOIN users u
                ON u.id = n.recorded_by

            WHERE n.container_id = ?

            ORDER BY n.created_at DESC
        ";

        $notesStmt = $conn->prepare($notesSql);
        $notesStmt->execute([$id]);

        $noteRows = $notesStmt->fetchAll(PDO::FETCH_ASSOC);

        $notes = array_map(function ($note) {
            return [
                "id" => $note["id"],
                "note" => $note["note"],
                "recordedBy" => [
                    "id" => $note["recorded_by"],
                    "name" => $note["recorded_by_name"] ?: "Unknown user"
                ],
                "createdAt" => $note["created_at"],
                "updatedAt" => $note["updated_at"]
            ];
        }, $noteRows);

        $quantity = $row["package_count"]
            ?? $row["shipment_package_count"]
            ?? 0;

        $unit = $row["container_package_type"]
            ?: $row["package_type"]
            ?: "packages";

        $weight = $row["gross_weight"]
            ?? $row["shipment_gross_weight"]
            ?? 0;

        $location = $row["location_name"]
            ? trim(
                ($row["location_code"]
                    ? $row["location_code"] . " · "
                    : "") .
                $row["location_name"]
            )
            : "Not assigned";

        $data = [
            "id" => $row["id"],

            "sku" => $row["container_no"],
            "container" => $row["container_no"],
            "containerSize" => $row["size"],
            "sealNumber" => $row["seal_no"],

            "status" => $row["container_status"],

            "description" => $row["container_description"]
                ?: $row["cargo_description"],

            "kind" => $row["container_package_type"]
                ?: $row["package_type"]
                ?: "Package",

            "quantity" => (float) $quantity,
            "unit" => $unit,
            "weight" => (string) $weight,
            "volume" => (string) ($row["volume"] ?? 0),

            "cargo" => [
                "description" => $row["container_description"]
                    ?: $row["cargo_description"],
                "packageType" => $row["container_package_type"]
                    ?: $row["package_type"],
                "packageCount" => (float) $quantity,
                "grossWeight" => (float) $weight,
                "volume" => (float) ($row["volume"] ?? 0),
                "specialInstructions" => $row["special_instructions"] ?: ""
            ],

            "shipment" => [
                "id" => $row["shipment_id"],
                "reference" => $row["shipment_reference"],
                "type" => $row["shipment_type"],
                "billOfLading" => $row["bill_of_lading"],
                "status" => $row["shipment_status"],
                "organisationId" => $row["organisation_id"],
                "organisationName" => $row["organisation_name"],
                "consignee" => $row["consignee"]
            ],

            "consignee" => $row["consignee"] ?: "Not provided",
            "consignment" => $row["shipment_reference"],
            "billOfLading" => $row["bill_of_lading"],

            "location" => $location,

            "currentLocation" => [
                "id" => $row["location_id"],
                "code" => $row["location_code"],
                "name" => $row["location_name"],
                "kind" => $row["location_kind"],
                "label" => $location
            ],

            "gateInAt" => $row["gate_in_at"],
            "receivedAt" => $row["received_at"],
            "storedAt" => $row["stored_at"],
            "gateOutAt" => $row["gate_out_at"],
            "createdAt" => $row["container_created_at"],
            "updatedAt" => $row["container_updated_at"],

            "movementHistory" => $movementHistory,
            "movementCount" => count($movementHistory),

            "notes" => $notes,
            "notesCount" => count($notes)
        ];

        echo json_encode([
            "error" => false,
            "data" => $data,
            "code" => 200
        ]);

    } catch (Throwable $e) {

        echo json_encode([
            "error" => true,
            "data" => "Could not load inventory record.",
            "code" => $e->getMessage()
        ]);
    }
