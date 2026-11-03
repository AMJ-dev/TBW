<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=UTF-8");

try {
    $shipment_id = trim($_POST["shipment_id"] ?? "");
    $container_id = trim($_POST["container_id"] ?? "");
    $to_location_id = trim($_POST["to_location_id"] ?? "");
    $equipment_id = trim($_POST["equipment_id"] ?? "");
    $remarks = trim($_POST["remarks"] ?? "");

    if (
        $shipment_id === "" ||
        $container_id === "" ||
        $to_location_id === ""
    ) {
        echo json_encode([
            "error" => true,
            "data" => "Shipment, container and destination location are required.",
            "code" => 422
        ]);
        exit;
    }

    $conn->beginTransaction();

    $container_sql = "
        SELECT
            psc.id,
            psc.shipment_id,
            psc.container_no,
            psc.status,
            psc.stored_at,
            ps.shipment_reference,
            ps.bill_of_lading,
            ps.status AS shipment_status
        FROM portal_shipment_containers psc
        INNER JOIN portal_shipments ps
            ON ps.id = psc.shipment_id
        WHERE psc.id = :container_id
        AND psc.shipment_id = :shipment_id
        LIMIT 1
        FOR UPDATE
    ";

    $container_stmt = $conn->prepare($container_sql);
    $container_stmt->bindValue(":container_id", $container_id);
    $container_stmt->bindValue(":shipment_id", $shipment_id);
    $container_stmt->execute();

    $container = $container_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$container) {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "Shipment container could not be found.",
            "code" => 404
        ]);
        exit;
    }

    if ($container["status"] !== "RECEIVED") {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "Only received containers can be placed in the yard.",
            "code" => 422
        ]);
        exit;
    }

    $receiving_sql = "
        SELECT
            rc.id,
            rc.receiving_id,
            rc.receiving_location_id,
            rc.receiving_location,
            rc.receiving_status,
            rc.actual_seal_no,
            rc.actual_weight,
            rc.condition_status,
            rc.received_at,
            rc.created_at,
            pr.receiving_reference,
            pr.status AS receiving_record_status
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
        FOR UPDATE
    ";

    $receiving_stmt = $conn->prepare($receiving_sql);
    $receiving_stmt->bindValue(":container_id", $container_id);
    $receiving_stmt->bindValue(":shipment_id", $shipment_id);
    $receiving_stmt->execute();

    $receiving = $receiving_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$receiving) {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "This container has no receiving record and cannot be moved to the yard.",
            "code" => 422
        ]);
        exit;
    }

    if ($receiving["receiving_status"] !== "RECEIVED") {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "This container has not been received. Complete receiving before moving it to the yard.",
            "code" => 422
        ]);
        exit;
    }

    $latest_movement_sql = "
        SELECT
            id,
            to_location_id,
            movement_reference,
            completed_at
        FROM terminal_yard_movements
        WHERE container_id = :container_id
        ORDER BY completed_at DESC, created_at DESC
        LIMIT 1
        FOR UPDATE
    ";

    $latest_movement_stmt = $conn->prepare($latest_movement_sql);
    $latest_movement_stmt->bindValue(":container_id", $container_id);
    $latest_movement_stmt->execute();

    $latest_movement = $latest_movement_stmt->fetch(PDO::FETCH_ASSOC);

    if ($latest_movement) {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "This container already has a yard placement record. It cannot be placed again through initial yard placement.",
            "code" => 409
        ]);
        exit;
    }

    $from_location_id = $receiving["receiving_location_id"];

    $destination_sql = "
        SELECT id, code, name, kind, status
        FROM terminal_locations
        WHERE id = :location_id
        LIMIT 1
        FOR UPDATE
    ";

    $destination_stmt = $conn->prepare($destination_sql);
    $destination_stmt->bindValue(":location_id", $to_location_id);
    $destination_stmt->execute();

    $destination = $destination_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$destination) {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "Destination location could not be found.",
            "code" => 404
        ]);
        exit;
    }

    if ($destination["kind"] !== "YARD") {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "The destination must be a yard location.",
            "code" => 422
        ]);
        exit;
    }

    if ($destination["status"] !== "active") {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "The selected yard location is not active.",
            "code" => 422
        ]);
        exit;
    }

    if ($from_location_id && $from_location_id === $to_location_id) {
        $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "The container is already at the selected destination.",
            "code" => 422
        ]);
        exit;
    }

    $from_location = null;

    if ($from_location_id) {
        $from_sql = "
            SELECT id, code, name, kind
            FROM terminal_locations
            WHERE id = :location_id
            LIMIT 1
        ";

        $from_stmt = $conn->prepare($from_sql);
        $from_stmt->bindValue(":location_id", $from_location_id);
        $from_stmt->execute();

        $from_location = $from_stmt->fetch(PDO::FETCH_ASSOC);
    }

    $equipment = null;

    if ($equipment_id !== "") {
        $equipment_sql = "
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
        ";

        $equipment_stmt = $conn->prepare($equipment_sql);
        $equipment_stmt->bindValue(":equipment_id", $equipment_id);
        $equipment_stmt->execute();

        $equipment = $equipment_stmt->fetch(PDO::FETCH_ASSOC);

        if (!$equipment) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Selected equipment could not be found.",
                "code" => 404
            ]);
            exit;
        }

        if (
            (int)$equipment["is_active"] !== 1 ||
            $equipment["operational_status"] !== "AVAILABLE"
        ) {
            $conn->rollBack();

            echo json_encode([
                "error" => true,
                "data" => "Selected equipment is not available for use.",
                "code" => 422
            ]);
            exit;
        }
    } else {
        $equipment_id = null;
    }

    $movement_id = generateId();
    $movement_reference = "YRD-" . date("Ymd") . "-" . strtoupper(bin2hex(random_bytes(4)));
    $performed_by = $user_id ?? null;

    $movement_sql = "
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
    ";

    $movement_stmt = $conn->prepare($movement_sql);

    $movement_stmt->bindValue(":id", $movement_id);
    $movement_stmt->bindValue(":movement_reference", $movement_reference);
    $movement_stmt->bindValue(":shipment_id", $shipment_id);
    $movement_stmt->bindValue(":container_id", $container_id);

    $movement_stmt->bindValue(
        ":from_location_id",
        $from_location_id ?: null,
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
        "receiving_reference" => $receiving["receiving_reference"],
        "receiving_status" => $receiving["receiving_status"],
        "from_location" => $from_location,
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

    $log_sql = "
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
    ";

    $log_stmt = $conn->prepare($log_sql);

    $log_stmt->bindValue(":id", generateId());
    $log_stmt->bindValue(":movement_id", $movement_id);
    $log_stmt->bindValue(":shipment_id", $shipment_id);
    $log_stmt->bindValue(":container_id", $container_id);
    $log_stmt->bindValue(":action", "MOVEMENT_COMPLETED");

    $log_stmt->bindValue(
        ":previous_location_id",
        $from_location_id ?: null,
        $from_location_id ? PDO::PARAM_STR : PDO::PARAM_NULL
    );

    $log_stmt->bindValue(":new_location_id", $to_location_id);

    $description = "Container {$container["container_no"]} moved from "
        . ($from_location["name"] ?? $receiving["receiving_location"] ?? "an unrecorded location")
        . " to {$destination["name"]}.";

    $log_stmt->bindValue(":description", $description);
    $log_stmt->bindValue(":metadata", json_encode($metadata));

    $log_stmt->bindValue(
        ":performed_by",
        $performed_by,
        $performed_by ? PDO::PARAM_STR : PDO::PARAM_NULL
    );

    $log_stmt->execute();

    $update_container_sql = "
        UPDATE portal_shipment_containers
        SET
            status = 'IN_YARD',
            stored_at = COALESCE(stored_at, NOW())
        WHERE id = :container_id
        AND shipment_id = :shipment_id
        AND status = 'RECEIVED'
    ";

    $update_container_stmt = $conn->prepare($update_container_sql);
    $update_container_stmt->bindValue(":container_id", $container_id);
    $update_container_stmt->bindValue(":shipment_id", $shipment_id);
    $update_container_stmt->execute();

    if ($update_container_stmt->rowCount() !== 1) {
        throw new RuntimeException("Container status could not be updated.");
    }

    $shipment_summary_sql = "
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
    ";

    $shipment_summary_stmt = $conn->prepare($shipment_summary_sql);
    $shipment_summary_stmt->bindValue(":shipment_id", $shipment_id);
    $shipment_summary_stmt->execute();

    $shipment_summary = $shipment_summary_stmt->fetch(PDO::FETCH_ASSOC);

    $total_containers = (int)($shipment_summary["total_containers"] ?? 0);
    $stored_containers = (int)($shipment_summary["stored_containers"] ?? 0);
    $progressed_containers = (int)($shipment_summary["progressed_containers"] ?? 0);

    $shipment_status = $container["shipment_status"];
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

        $update_shipment_sql = "
            UPDATE portal_shipments
            SET status = :status
            WHERE id = :shipment_id
            AND status = :previous_status
        ";

        $update_shipment_stmt = $conn->prepare($update_shipment_sql);
        $update_shipment_stmt->bindValue(":status", $new_shipment_status);
        $update_shipment_stmt->bindValue(":shipment_id", $shipment_id);
        $update_shipment_stmt->bindValue(":previous_status", $shipment_status);
        $update_shipment_stmt->execute();
    }

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => [
            "id" => $movement_id,
            "movement_reference" => $movement_reference,
            "shipment_id" => $shipment_id,
            "shipment_reference" => $container["shipment_reference"],
            "shipment_status" => $new_shipment_status,
            "container_id" => $container_id,
            "container_no" => $container["container_no"],
            "container_status" => "IN_YARD",
            "total_containers" => $total_containers,
            "stored_containers" => $stored_containers,
            "receiving_reference" => $receiving["receiving_reference"],
            "receiving_status" => $receiving["receiving_status"],
            "from_location" => $from_location,
            "to_location" => $destination,
            "equipment" => $equipment,
            "completed_at" => date("Y-m-d H:i:s"),
            "message" => "Yard movement recorded successfully."
        ],
        "code" => 201
    ]);

} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode([
        "error" => true,
        "data" => "Could not save yard movement.",
        "code" => 500
    ]);
}