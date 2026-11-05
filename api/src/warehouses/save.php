<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $shipment_id = trim($_POST["shipment_id"] ?? "");
        $containers = $_POST["containers"] ?? null;

        if ($shipment_id === "" || !is_string($containers)) {
            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "Shipment and container details are required.",
                "code" => null
            ]);
            exit;
        }

        $containers = json_decode($containers, true);

        if (!is_array($containers) || count($containers) === 0) {
            http_response_code(400);

            echo json_encode([
                "error" => true,
                "data" => "Select at least one container.",
                "code" => null
            ]);
            exit;
        }

        $operator_id = $my_details->id ?? null;

        $conn->beginTransaction();

        $shipmentStmt = $conn->prepare("
            SELECT id, status
            FROM portal_shipments
            WHERE id = :id
            LIMIT 1
            FOR UPDATE
        ");

        $shipmentStmt->bindValue(":id", $shipment_id, PDO::PARAM_STR);
        $shipmentStmt->execute();

        $shipment = $shipmentStmt->fetch(PDO::FETCH_ASSOC);

        if (!$shipment) {
            throw new RuntimeException("Shipment was not found.");
        }

        $containerStmt = $conn->prepare("
            SELECT
                pc.id,
                pc.shipment_id,
                pc.container_no,
                pc.status,
                pc.current_location_id,
                tl.kind AS current_location_kind,
                tl.status AS current_location_status
            FROM portal_shipment_containers pc
            LEFT JOIN terminal_locations tl
                ON tl.id = pc.current_location_id
            WHERE pc.id = :container_id
            AND pc.shipment_id = :shipment_id
            LIMIT 1
            FOR UPDATE
        ");

        $destinationStmt = $conn->prepare("
            SELECT id, code, name, kind, status
            FROM terminal_locations
            WHERE id = :id
            LIMIT 1
        ");

        $insertMovement = $conn->prepare("
            INSERT INTO terminal_warehouse_movements (
                id,
                movement_reference,
                shipment_id,
                container_id,
                from_location_id,
                to_location_id,
                remarks,
                moved_by,
                completed_at,
                created_at
            ) VALUES (
                :id,
                :movement_reference,
                :shipment_id,
                :container_id,
                :from_location_id,
                :to_location_id,
                :remarks,
                :moved_by,
                NOW(),
                NOW()
            )
        ");

        $insertLog = $conn->prepare("
            INSERT INTO terminal_warehouse_movement_logs (
                id,
                movement_id,
                shipment_id,
                container_id,
                action,
                previous_location_id,
                new_location_id,
                description,
                metadata,
                performed_by,
                performed_at
            ) VALUES (
                :id,
                :movement_id,
                :shipment_id,
                :container_id,
                'WAREHOUSE_PLACEMENT',
                :previous_location_id,
                :new_location_id,
                :description,
                :metadata,
                :performed_by,
                NOW()
            )
        ");

        $updateContainer = $conn->prepare("
            UPDATE portal_shipment_containers
            SET
                current_location_id = :location_id,
                status = 'IN_WAREHOUSE',
                stored_at = COALESCE(stored_at, NOW()),
                updated_at = NOW()
            WHERE id = :container_id
            AND shipment_id = :shipment_id
        ");

        $saved = [];

        foreach ($containers as $item) {
            $container_id = trim($item["container_id"] ?? "");
            $destination_id = trim($item["to_location_id"] ?? "");
            $remarks = trim($item["remarks"] ?? "");

            if ($container_id === "" || $destination_id === "") {
                throw new RuntimeException("Every selected container needs a warehouse destination.");
            }

            $containerStmt->bindValue(":container_id", $container_id, PDO::PARAM_STR);
            $containerStmt->bindValue(":shipment_id", $shipment_id, PDO::PARAM_STR);
            $containerStmt->execute();

            $container = $containerStmt->fetch(PDO::FETCH_ASSOC);

            if (!$container) {
                throw new RuntimeException("One of the selected containers does not belong to this shipment.");
            }

            if (
                $container["status"] === "GATE_OUT" ||
                $container["status"] === "TRANSFERRED_OUT" ||
                $container["status"] === "RETURNED_RE_EXPORTED" ||
                $container["status"] === "CANCELLED" ||
                $container["status"] === "IN_WAREHOUSE"
            ) {
                throw new RuntimeException(
                    "Container " . $container["container_no"] . " is not eligible for warehouse placement."
                );
            }

            if (
                !$container["current_location_id"] ||
                $container["current_location_kind"] !== "YARD" ||
                $container["current_location_status"] !== "active"
            ) {
                throw new RuntimeException(
                    "Container " . $container["container_no"] . " must be in an active yard location before warehouse placement."
                );
            }

            $destinationStmt->bindValue(":id", $destination_id, PDO::PARAM_STR);
            $destinationStmt->execute();

            $destination = $destinationStmt->fetch(PDO::FETCH_ASSOC);

            if (
                !$destination ||
                $destination["kind"] !== "WAREHOUSE" ||
                $destination["status"] !== "active"
            ) {
                throw new RuntimeException(
                    "The selected warehouse destination is not active or is not a warehouse."
                );
            }

            if ($destination_id === $container["current_location_id"]) {
                throw new RuntimeException(
                    "Container " . $container["container_no"] . " is already at the selected location."
                );
            }

            $movement_id = generateId();
            $movement_reference = "TRN-WHM-" . date("Y") . "-" . strtoupper(bin2hex(random_bytes(5)));

            $insertMovement->execute([
                ":id" => $movement_id,
                ":movement_reference" => $movement_reference,
                ":shipment_id" => $shipment_id,
                ":container_id" => $container_id,
                ":from_location_id" => $container["current_location_id"],
                ":to_location_id" => $destination_id,
                ":remarks" => $remarks !== "" ? $remarks : null,
                ":moved_by" => $operator_id
            ]);

            $updateContainer->execute([
                ":location_id" => $destination_id,
                ":container_id" => $container_id,
                ":shipment_id" => $shipment_id
            ]);

            $insertLog->execute([
                ":id" => generateId(),
                ":movement_id" => $movement_id,
                ":shipment_id" => $shipment_id,
                ":container_id" => $container_id,
                ":previous_location_id" => $container["current_location_id"],
                ":new_location_id" => $destination_id,
                ":description" => "Container placed in " . $destination["name"],
                ":metadata" => json_encode([
                    "movement_reference" => $movement_reference,
                    "container_no" => $container["container_no"],
                    "destination_code" => $destination["code"],
                    "remarks" => $remarks
                ]),
                ":performed_by" => $operator_id
            ]);

            $saved[] = [
                "movement_id" => $movement_id,
                "movement_reference" => $movement_reference,
                "container_id" => $container_id,
                "container_no" => $container["container_no"],
                "destination" => $destination["name"]
            ];
        }

        $countStmt = $conn->prepare("
            SELECT
                COUNT(*) AS total_containers,
                SUM(
                    CASE
                        WHEN status = 'IN_WAREHOUSE' THEN 1
                        ELSE 0
                    END
                ) AS stored_containers
            FROM portal_shipment_containers
            WHERE shipment_id = :shipment_id
        ");

        $countStmt->bindValue(":shipment_id", $shipment_id, PDO::PARAM_STR);
        $countStmt->execute();

        $counts = $countStmt->fetch(PDO::FETCH_ASSOC);

        $total = (int) ($counts["total_containers"] ?? 0);
        $stored = (int) ($counts["stored_containers"] ?? 0);

        if ($total > 0 && $stored === $total) {
            $shipmentStatus = "STORED";
        } elseif ($stored > 0) {
            $shipmentStatus = "PARTIALLY_STORED";
        } else {
            $shipmentStatus = null;
        }

        if ($shipmentStatus !== null) {
           $updateShipment = $conn->prepare("
                UPDATE portal_shipments
                SET status = :status, updated_at = NOW()
                WHERE id = :shipment_id
                AND status IN (
                    'EXPECTED',
                    'PARTIALLY_GATED_IN',
                    'GATED_IN',
                    'PARTIALLY_RECEIVED',
                    'RECEIVED',
                    'PARTIALLY_STORED',
                    'STORED'
                )
            ");

            $updateShipment->execute([
                ":status" => $shipmentStatus,
                ":shipment_id" => $shipment_id
            ]);
        }

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => [
                "message" => "Warehouse placement completed.",
                "saved" => $saved,
                "total_saved" => count($saved),
                "shipment_status" => $shipmentStatus
            ],
            "code" => null
        ]);

    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(400);

        echo json_encode([
            "error" => true,
            "data" => $e instanceof RuntimeException
                ? $e->getMessage()
                : "Could not save warehouse placement.",
            "code" => null
        ]);
    }