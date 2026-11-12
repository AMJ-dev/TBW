
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=UTF-8");

$responseCode = 500;

try {
    $shipment_id = trim($_POST["shipment_id"] ?? "");
    $containers_input = $_POST["containers"] ?? [];

    if (is_string($containers_input)) {
        $containers_input = json_decode($containers_input, true);
    }

    if (
        $shipment_id === "" ||
        !is_array($containers_input) ||
        count($containers_input) === 0
    ) {
        echo json_encode([
            "error" => true,
            "data" => "Shipment and at least one container are required.",
            "code" => 422
        ]);
        exit;
    }

    $containers = [];
    $seenContainers = [];

    foreach ($containers_input as $item) {
        if (!is_array($item)) {
            throw new InvalidArgumentException("Invalid container submission.");
        }

        $container_id = trim($item["container_id"] ?? "");
        $to_location_id = trim($item["to_location_id"] ?? "");
        $equipment_id = trim($item["equipment_id"] ?? "");
        $remarks = trim($item["remarks"] ?? "");

        if ($container_id === "" || $to_location_id === "") {
            throw new InvalidArgumentException(
                "Every container must have a destination location."
            );
        }

        if (isset($seenContainers[$container_id])) {
            throw new InvalidArgumentException(
                "A container was submitted more than once."
            );
        }

        $seenContainers[$container_id] = true;

        $containers[] = [
            "container_id" => $container_id,
            "to_location_id" => $to_location_id,
            "equipment_id" => $equipment_id !== "" ? $equipment_id : null,
            "remarks" => $remarks
        ];
    }

    $allowedStatuses = [
        "RECEIVED",
        "IN_YARD",
        "IN_WAREHOUSE",
        "UNDER_EXAMINATION",
        "EXAMINATION_COMPLETE",
        "CHARGES_PENDING",
        "CHARGES_SETTLED",
        "RELEASE_AUTHORISED"
    ];

    $conn->beginTransaction();

    $shipment_stmt = $conn->prepare("
        SELECT id, shipment_reference, status
        FROM portal_shipments
        WHERE id = :shipment_id
        LIMIT 1
        FOR UPDATE
    ");

    $shipment_stmt->bindValue(":shipment_id", $shipment_id);
    $shipment_stmt->execute();

    $shipment = $shipment_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$shipment) {
        $responseCode = 404;
        throw new RuntimeException("Shipment could not be found.");
    }

    $container_stmt = $conn->prepare("
        SELECT
            psc.id,
            psc.shipment_id,
            psc.container_no,
            psc.status,
            psc.stored_at,
            psc.current_location_id,
            ps.shipment_reference,
            ps.bill_of_lading
        FROM portal_shipment_containers psc
        INNER JOIN portal_shipments ps
            ON ps.id = psc.shipment_id
        WHERE psc.id = :container_id
        AND psc.shipment_id = :shipment_id
        LIMIT 1
        FOR UPDATE
    ");

    $received_history_stmt = $conn->prepare("
        SELECT rc.id
        FROM portal_receiving_containers rc
        WHERE rc.container_id = :container_id
        AND rc.shipment_id = :shipment_id
        AND rc.receiving_status = 'RECEIVED'
        LIMIT 1
    ");

    $latest_receiving_stmt = $conn->prepare("
        SELECT
            rc.receiving_location_id,
            rc.receiving_location,
            rc.received_at,
            rc.created_at,
            pr.receiving_reference
        FROM portal_receiving_containers rc
        INNER JOIN portal_receiving pr
            ON pr.id = rc.receiving_id
        WHERE rc.container_id = :container_id
        AND rc.shipment_id = :shipment_id
        ORDER BY
            COALESCE(
                rc.received_at,
                rc.updated_at,
                rc.created_at
            ) DESC,
            rc.created_at DESC
        LIMIT 1
    ");

    $latest_movement_stmt = $conn->prepare("
        SELECT
            id,
            to_location_id,
            movement_reference,
            completed_at
        FROM terminal_yard_movements
        WHERE container_id = :container_id
        ORDER BY completed_at DESC, created_at DESC
        LIMIT 1
    ");

    $location_stmt = $conn->prepare("
        SELECT id, code, name, kind, status
        FROM terminal_locations
        WHERE id = :location_id
        LIMIT 1
        FOR UPDATE
    ");

    $equipment_stmt = $conn->prepare("
        SELECT
            id,
            equipment_code,
            equipment_name,
            equipment_type,
            operational_status,
            is_active
        FROM terminal_equipment
        WHERE id = :equipment_id
        LIMIT 1
        FOR UPDATE
    ");

    $movement_stmt = $conn->prepare("
        INSERT INTO terminal_yard_movements (
            id,
            movement_reference,
            shipment_id,
            container_id,
            from_location_id,
            to_location_id,
            equipment_id,
            remarks,
            moved_by,
            completed_at
        ) VALUES (
            :id,
            :movement_reference,
            :shipment_id,
            :container_id,
            :from_location_id,
            :to_location_id,
            :equipment_id,
            :remarks,
            :moved_by,
            NOW()
        )
    ");

    $log_stmt = $conn->prepare("
        INSERT INTO terminal_yard_movement_logs (
            id,
            movement_id,
            shipment_id,
            container_id,
            action,
            previous_location_id,
            new_location_id,
            description,
            metadata,
            performed_by
        ) VALUES (
            :id,
            :movement_id,
            :shipment_id,
            :container_id,
            :action,
            :previous_location_id,
            :new_location_id,
            :description,
            :metadata,
            :performed_by
        )
    ");

    $update_container_stmt = $conn->prepare("
        UPDATE portal_shipment_containers
        SET
            current_location_id = :location_id,
            status = CASE
                WHEN status IN ('RECEIVED', 'IN_WAREHOUSE')
                    THEN 'IN_YARD'
                ELSE status
            END,
            stored_at = COALESCE(stored_at, NOW()),
            updated_at = NOW()
        WHERE id = :container_id
        AND shipment_id = :shipment_id
    ");

    $performed_by = $my_details->id ?? null;
    $saved_movements = [];

    foreach ($containers as $item) {
        $container_id = $item["container_id"];
        $to_location_id = $item["to_location_id"];
        $equipment_id = $item["equipment_id"];
        $remarks = $item["remarks"];

        $container_stmt->bindValue(":container_id", $container_id);
        $container_stmt->bindValue(":shipment_id", $shipment_id);
        $container_stmt->execute();

        $container = $container_stmt->fetch(PDO::FETCH_ASSOC);

        if (!$container) {
            $responseCode = 404;
            throw new RuntimeException(
                "Container {$container_id} could not be found under this shipment."
            );
        }

        $container_status = $container["status"];

        if (!in_array($container_status, $allowedStatuses, true)) {
            $responseCode = 422;
            throw new RuntimeException(
                "Container {$container["container_no"]} cannot be moved from its current status: {$container_status}."
            );
        }

        $received_history_stmt->bindValue(":container_id", $container_id);
        $received_history_stmt->bindValue(":shipment_id", $shipment_id);
        $received_history_stmt->execute();

        if (!$received_history_stmt->fetch(PDO::FETCH_ASSOC)) {
            $responseCode = 422;
            throw new RuntimeException(
                "Container {$container["container_no"]} has not completed receiving."
            );
        }

        $latest_receiving_stmt->bindValue(":container_id", $container_id);
        $latest_receiving_stmt->bindValue(":shipment_id", $shipment_id);
        $latest_receiving_stmt->execute();

        $receiving = $latest_receiving_stmt->fetch(PDO::FETCH_ASSOC);

        $latest_movement_stmt->bindValue(":container_id", $container_id);
        $latest_movement_stmt->execute();

        $latest_movement = $latest_movement_stmt->fetch(PDO::FETCH_ASSOC);

        $from_location_id = $container["current_location_id"]
            ?: ($latest_movement["to_location_id"] ?? null)
            ?: ($receiving["receiving_location_id"] ?? null);

        if ($from_location_id === $to_location_id) {
            $responseCode = 422;
            throw new RuntimeException(
                "Container {$container["container_no"]} is already at the selected destination."
            );
        }

        $from_location = null;

        if ($from_location_id) {
            $location_stmt->bindValue(":location_id", $from_location_id);
            $location_stmt->execute();

            $from_location = $location_stmt->fetch(PDO::FETCH_ASSOC);
        }

        $location_stmt->bindValue(":location_id", $to_location_id);
        $location_stmt->execute();

        $destination = $location_stmt->fetch(PDO::FETCH_ASSOC);

        if (!$destination) {
            $responseCode = 404;
            throw new RuntimeException(
                "The selected yard destination could not be found."
            );
        }

        if ($destination["kind"] !== "YARD") {
            $responseCode = 422;
            throw new RuntimeException(
                "Destination {$destination["name"]} is not a yard location."
            );
        }

        if ($destination["status"] !== "active") {
            $responseCode = 422;
            throw new RuntimeException(
                "Destination {$destination["name"]} is not active."
            );
        }

        $equipment = null;

        if ($equipment_id !== null) {
            $equipment_stmt->bindValue(":equipment_id", $equipment_id);
            $equipment_stmt->execute();

            $equipment = $equipment_stmt->fetch(PDO::FETCH_ASSOC);

            if (!$equipment) {
                $responseCode = 404;
                throw new RuntimeException(
                    "Selected equipment could not be found."
                );
            }

            if (
                (int)$equipment["is_active"] !== 1 ||
                $equipment["operational_status"] !== "AVAILABLE"
            ) {
                $responseCode = 422;
                throw new RuntimeException(
                    "Equipment {$equipment["equipment_name"]} is not available."
                );
            }
        }

        $movement_id = generateId();

        $movement_reference = "YRD-"
            . date("Ymd")
            . "-"
            . strtoupper(bin2hex(random_bytes(4)));

        $movement_stmt->bindValue(":id", $movement_id);
        $movement_stmt->bindValue(":movement_reference", $movement_reference);
        $movement_stmt->bindValue(":shipment_id", $shipment_id);
        $movement_stmt->bindValue(":container_id", $container_id);

        $movement_stmt->bindValue(
            ":from_location_id",
            $from_location_id,
            $from_location_id ? PDO::PARAM_STR : PDO::PARAM_NULL
        );

        $movement_stmt->bindValue(":to_location_id", $to_location_id);

        $movement_stmt->bindValue(
            ":equipment_id",
            $equipment_id,
            $equipment_id ? PDO::PARAM_STR : PDO::PARAM_NULL
        );

        $movement_stmt->bindValue(
            ":remarks",
            $remarks !== "" ? $remarks : null,
            $remarks !== "" ? PDO::PARAM_STR : PDO::PARAM_NULL
        );

        $movement_stmt->bindValue(
            ":moved_by",
            $performed_by,
            $performed_by ? PDO::PARAM_STR : PDO::PARAM_NULL
        );

        $movement_stmt->execute();

        $metadata = [
            "movement_reference" => $movement_reference,
            "container_no" => $container["container_no"],
            "shipment_reference" => $container["shipment_reference"],
            "previous_status" => $container_status,
            "receiving_reference" => $receiving["receiving_reference"] ?? null,
            "from_location" => $from_location ? [
                "id" => $from_location["id"],
                "code" => $from_location["code"],
                "name" => $from_location["name"]
            ] : [
                "id" => null,
                "name" => $receiving["receiving_location"] ?? "Unknown location"
            ],
            "to_location" => [
                "id" => $destination["id"],
                "code" => $destination["code"],
                "name" => $destination["name"]
            ],
            "equipment" => $equipment ? [
                "id" => $equipment["id"],
                "code" => $equipment["equipment_code"],
                "name" => $equipment["equipment_name"],
                "type" => $equipment["equipment_type"]
            ] : null
        ];

        $from_name = $from_location["name"]
            ?? $receiving["receiving_location"]
            ?? "Unknown location";

        $description = "Container {$container["container_no"]} moved from "
            . $from_name
            . " to {$destination["name"]}.";

        $log_stmt->bindValue(":id", generateId());
        $log_stmt->bindValue(":movement_id", $movement_id);
        $log_stmt->bindValue(":shipment_id", $shipment_id);
        $log_stmt->bindValue(":container_id", $container_id);
        $log_stmt->bindValue(":action", "MOVEMENT_COMPLETED");

        $log_stmt->bindValue(
            ":previous_location_id",
            $from_location_id,
            $from_location_id ? PDO::PARAM_STR : PDO::PARAM_NULL
        );

        $log_stmt->bindValue(":new_location_id", $to_location_id);
        $log_stmt->bindValue(":description", $description);
        $log_stmt->bindValue(":metadata", json_encode($metadata));

        $log_stmt->bindValue(
            ":performed_by",
            $performed_by,
            $performed_by ? PDO::PARAM_STR : PDO::PARAM_NULL
        );

        $log_stmt->execute();

        $update_container_stmt->bindValue(":location_id", $to_location_id);
        $update_container_stmt->bindValue(":container_id", $container_id);
        $update_container_stmt->bindValue(":shipment_id", $shipment_id);
        $update_container_stmt->execute();

        if ($update_container_stmt->rowCount() !== 1) {
            throw new RuntimeException(
                "Could not update the current location for container {$container["container_no"]}."
            );
        }

        $new_container_status = in_array(
            $container_status,
            ["RECEIVED", "IN_WAREHOUSE"],
            true
        ) ? "IN_YARD" : $container_status;

        $saved_movements[] = [
            "id" => $movement_id,
            "movement_reference" => $movement_reference,
            "container_id" => $container_id,
            "container_no" => $container["container_no"],
            "previous_status" => $container_status,
            "container_status" => $new_container_status,
            "from_location" => $from_location,
            "to_location" => $destination,
            "equipment" => $equipment,
            "completed_at" => date("Y-m-d H:i:s")
        ];
    }

    $shipment_summary_stmt = $conn->prepare("
        SELECT
            COUNT(*) AS total_containers,
            SUM(
                CASE
                    WHEN status IN ('IN_YARD', 'IN_WAREHOUSE') THEN 1
                    ELSE 0
                END
            ) AS stored_containers,
            SUM(
                CASE
                    WHEN status NOT IN (
                        'EXPECTED',
                        'SCHEDULED',
                        'ENTERED',
                        'RECEIVED',
                        'IN_YARD',
                        'IN_WAREHOUSE'
                    ) THEN 1
                    ELSE 0
                END
            ) AS progressed_containers
        FROM portal_shipment_containers
        WHERE shipment_id = :shipment_id
    ");

    $shipment_summary_stmt->bindValue(":shipment_id", $shipment_id);
    $shipment_summary_stmt->execute();

    $shipment_summary = $shipment_summary_stmt->fetch(PDO::FETCH_ASSOC);

    $total_containers = (int)($shipment_summary["total_containers"] ?? 0);
    $stored_containers = (int)($shipment_summary["stored_containers"] ?? 0);
    $progressed_containers = (int)($shipment_summary["progressed_containers"] ?? 0);

    $shipment_status = $shipment["status"];
    $new_shipment_status = $shipment_status;

    $eligible_shipment_statuses = [
        "EXPECTED",
        "PARTIALLY_SCHEDULED",
        "SCHEDULED",
        "PARTIALLY_GATED_IN",
        "GATED_IN",
        "PARTIALLY_RECEIVED",
        "RECEIVED",
        "PARTIALLY_STORED"
    ];

    if (
        $total_containers > 0 &&
        $stored_containers > 0 &&
        $progressed_containers === 0 &&
        in_array($shipment_status, $eligible_shipment_statuses, true)
    ) {
        $new_shipment_status = $stored_containers >= $total_containers
            ? "STORED"
            : "PARTIALLY_STORED";

        $update_shipment_stmt = $conn->prepare("
            UPDATE portal_shipments
            SET status = :status
            WHERE id = :shipment_id
            AND status = :previous_status
        ");

        $update_shipment_stmt->bindValue(":status", $new_shipment_status);
        $update_shipment_stmt->bindValue(":shipment_id", $shipment_id);
        $update_shipment_stmt->bindValue(":previous_status", $shipment_status);
        $update_shipment_stmt->execute();
    }

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => [
            "shipment_id" => $shipment_id,
            "shipment_reference" => $shipment["shipment_reference"],
            "shipment_status" => $new_shipment_status,
            "total_containers" => $total_containers,
            "stored_containers" => $stored_containers,
            "submitted_containers" => count($containers),
            "successful_containers" => count($saved_movements),
            "movements" => $saved_movements,
            "message" => "All selected containers were moved successfully."
        ],
        "code" => 201
    ]);

} catch (InvalidArgumentException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode([
        "error" => true,
        "data" => $e->getMessage(),
        "code" => 422
    ]);

} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode([
        "error" => true,
        "data" => $e->getMessage(),
        "code" => $responseCode
    ]);
}
