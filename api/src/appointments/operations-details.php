<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $id = trim($_GET["id"] ?? "");

        if ($id === "") {
            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "Appointment ID is required.",
                "code" => null
            ]);
            exit;
        }

        $tableExists = function ($table) use ($conn) {
            $stmt = $conn->prepare("
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
                AND table_name = :table
            ");

            $stmt->execute(["table" => $table]);

            return (int) $stmt->fetchColumn() > 0;
        };

        $columnExists = function ($table, $column) use ($conn) {
            $stmt = $conn->prepare("
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                AND table_name = :table
                AND column_name = :column
            ");

            $stmt->execute([
                "table" => $table,
                "column" => $column
            ]);

            return (int) $stmt->fetchColumn() > 0;
        };

        $getOrderColumn = function ($table) use ($columnExists) {
            foreach (["created_at", "id"] as $candidate) {
                if ($columnExists($table, $candidate)) {
                    return $candidate;
                }
            }

            return null;
        };

        $userNameColumn = null;

        if ($tableExists("users")) {
            foreach (["name", "full_name", "username"] as $candidate) {
                if ($columnExists("users", $candidate)) {
                    $userNameColumn = $candidate;
                    break;
                }
            }
        }

        $getUserName = function ($userId) use ($conn, $userNameColumn) {
            if (!$userId || !$userNameColumn) {
                return null;
            }

            $stmt = $conn->prepare("
                SELECT `$userNameColumn`
                FROM users
                WHERE id = :id
                LIMIT 1
            ");

            $stmt->execute(["id" => $userId]);

            return $stmt->fetchColumn() ?: null;
        };

        $stmt = $conn->prepare("
            SELECT
                a.*,

                o.organisation_name,
                o.contact_person AS organisation_contact_person,
                o.contact_email AS organisation_contact_email,
                o.contact_phone AS organisation_contact_phone,

                v.plate AS vehicle_number,
                v.kind AS vehicle_kind,
                v.make AS vehicle_make,
                v.model AS vehicle_model,
                v.year AS vehicle_year,
                v.capacity AS vehicle_capacity,
                v.owner AS vehicle_owner,
                v.transporter AS vehicle_transporter,
                v.insurance_expiry,
                v.roadworthiness_expiry,
                v.status AS vehicle_status,

                d.name AS driver_name,
                d.phone AS driver_phone,
                d.licence_number AS driver_licence_number,
                d.licence_class AS driver_licence_class,
                d.licence_expiry AS driver_licence_expiry,
                d.assigned_vehicle AS driver_assigned_vehicle,
                d.transporter AS driver_transporter,
                d.status AS driver_status

            FROM gate_appointments a

            LEFT JOIN organisations o
                ON o.id = a.organisation_id

            LEFT JOIN gate_vehicles v
                ON v.id = a.vehicle_id

            LEFT JOIN gate_drivers d
                ON d.id = a.driver_id

            WHERE a.id = :id
            LIMIT 1
        ");

        $stmt->execute(["id" => $id]);
        $appointment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$appointment) {
            http_response_code(404);

            echo json_encode([
                "error" => true,
                "data" => "Appointment not found.",
                "code" => null
            ]);
            exit;
        }

        $appointmentId = $appointment["id"];

        $organisation = [
            "organisation_name" => $appointment["organisation_name"] ?? null,
            "contact_person" => $appointment["organisation_contact_person"] ?? null,
            "contact_email" => $appointment["organisation_contact_email"] ?? null,
            "contact_phone" => $appointment["organisation_contact_phone"] ?? null
        ];

        $vehicle = [
            "plate" => $appointment["vehicle_number"] ?? null,
            "kind" => $appointment["vehicle_kind"] ?? null,
            "make" => $appointment["vehicle_make"] ?? null,
            "model" => $appointment["vehicle_model"] ?? null,
            "year" => $appointment["vehicle_year"] ?? null,
            "capacity" => $appointment["vehicle_capacity"] ?? null,
            "owner" => $appointment["vehicle_owner"] ?? null,
            "transporter" => $appointment["vehicle_transporter"] ?? null,
            "insurance_expiry" => $appointment["insurance_expiry"] ?? null,
            "roadworthiness_expiry" => $appointment["roadworthiness_expiry"] ?? null,
            "status" => $appointment["vehicle_status"] ?? null
        ];

        $driver = [
            "name" => $appointment["driver_name"] ?? null,
            "phone" => $appointment["driver_phone"] ?? null,
            "licence_number" => $appointment["driver_licence_number"] ?? null,
            "licence_class" => $appointment["driver_licence_class"] ?? null,
            "licence_expiry" => $appointment["driver_licence_expiry"] ?? null,
            "assigned_vehicle" => $appointment["driver_assigned_vehicle"] ?? null,
            "transporter" => $appointment["driver_transporter"] ?? null,
            "status" => $appointment["driver_status"] ?? null
        ];

        $movementRecords = [];

        if (
            $tableExists("gate_movement_records") &&
            $tableExists("gate_lanes")
        ) {
            $stmt = $conn->prepare("
                SELECT
                    gm.id,
                    gm.direction,
                    gm.decision,
                    gm.reason,
                    gm.override_reason,
                    gm.gate_in_evidence,
                    gm.supervisor_approval_ref,
                    gm.movement_at,
                    gm.created_at,

                    gl.id AS lane_id,
                    gl.code AS lane_code,
                    gl.name AS lane_name,
                    gl.gate_name,

                    gm.operator_id

                FROM gate_movement_records gm

                LEFT JOIN gate_lanes gl
                    ON gl.id = gm.gate_lane_id

                WHERE gm.appointment_id = :appointment_id

                ORDER BY gm.movement_at ASC, gm.created_at ASC
            ");

            $stmt->execute([
                "appointment_id" => $appointmentId
            ]);

            $movementRecords = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($movementRecords as &$movement) {
                $movement["operator_name"] = $getUserName(
                    $movement["operator_id"] ?? null
                );
            }

            unset($movement);
        }

        $checkIn = null;
        $checkOut = null;

        foreach ($movementRecords as $movement) {
            $movementDetails = [
                "direction" => $movement["direction"] ?? null,
                "decision" => $movement["decision"] ?? null,
                "movement_at" => $movement["movement_at"] ?? null,
                "operator_name" => $movement["operator_name"] ?? null,
                "gate_name" => $movement["gate_name"] ?? null,
                "lane_id" => $movement["lane_id"] ?? null,
                "lane_name" => $movement["lane_name"] ?? null,
                "lane_code" => $movement["lane_code"] ?? null,
                "remarks" => $movement["reason"] ?? null,
                "override_reason" => $movement["override_reason"] ?? null,
                "gate_in_evidence" => $movement["gate_in_evidence"] ?? null,
                "supervisor_approval_ref" => $movement["supervisor_approval_ref"] ?? null,
                "created_at" => $movement["created_at"] ?? null
            ];

            if (($movement["direction"] ?? "") === "in") {
                $checkIn = $movementDetails;
            }

            if (($movement["direction"] ?? "") === "out") {
                $checkOut = $movementDetails;
            }
        }

        $lane = null;

        if (!empty($movementRecords)) {
            $latestMovement = end($movementRecords);

            $lane = [
                "id" => $latestMovement["lane_id"] ?? null,
                "name" => $latestMovement["lane_name"] ?? null,
                "code" => $latestMovement["lane_code"] ?? null,
                "gate_name" => $latestMovement["gate_name"] ?? null
            ];
        }

        $gatePass = null;

        if (
            $tableExists("gate_passes") &&
            $columnExists("gate_passes", "appointment_id")
        ) {
            $orderColumn = $getOrderColumn("gate_passes");

            $sql = "
                SELECT *
                FROM gate_passes
                WHERE appointment_id = :appointment_id
            ";

            if ($orderColumn) {
                $sql .= " ORDER BY `$orderColumn` DESC";
            }

            $sql .= " LIMIT 1";

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                "appointment_id" => $appointmentId
            ]);

            $gatePass = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

            if ($gatePass) {
                $gatePass["issued_by_name"] = $getUserName(
                    $gatePass["issued_by"] ?? null
                );
            }
        }

        $containers = [];

        if ($tableExists("gate_appointment_containers")) {
            $orderColumn = $getOrderColumn("gate_appointment_containers");

            $sql = "
                SELECT
                    ac.id,
                    ac.appointment_id,
                    ac.container_no,
                    ac.created_at
                FROM gate_appointment_containers ac
                WHERE ac.appointment_id = :appointment_id
            ";

            if ($orderColumn) {
                $sql .= " ORDER BY ac.`$orderColumn` ASC";
            }

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                "appointment_id" => $appointmentId
            ]);

            $appointmentContainers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($appointmentContainers as $container) {
                $containerDetails = $container;
                $containerDetails["shipment_container"] = null;

                if (
                    !empty($container["container_no"]) &&
                    $tableExists("portal_shipment_containers")
                ) {
                    $stmt = $conn->prepare("
                        SELECT
                            psc.id,
                            psc.container_no,
                            psc.size,
                            psc.seal_no,
                            psc.package_count,
                            psc.gross_weight,
                            psc.package_type,
                            psc.status AS container_status,

                            ps.id AS shipment_id,
                            ps.shipment_reference,
                            ps.bill_of_lading,
                            ps.booking_number,
                            ps.vessel_name,
                            ps.voyage_number,
                            ps.cargo_description,
                            ps.status AS shipment_status

                        FROM portal_shipment_containers psc

                        LEFT JOIN portal_shipments ps
                            ON ps.id = psc.shipment_id

                        WHERE psc.container_no = :container_no
                        LIMIT 1
                    ");

                    $stmt->execute([
                        "container_no" => $container["container_no"]
                    ]);

                    $shipmentContainer = $stmt->fetch(PDO::FETCH_ASSOC);

                    if ($shipmentContainer) {
                        $containerDetails["shipment_container"] = $shipmentContainer;
                    }
                }

                $containers[] = $containerDetails;
            }
        }

        $shipment = null;

        foreach ($containers as $container) {
            $shipmentContainer = $container["shipment_container"] ?? null;

            if (!empty($shipmentContainer["shipment_id"])) {
                $shipment = [
                    "id" => $shipmentContainer["shipment_id"],
                    "shipment_reference" => $shipmentContainer["shipment_reference"] ?? null,
                    "bill_of_lading" => $shipmentContainer["bill_of_lading"] ?? null,
                    "booking_number" => $shipmentContainer["booking_number"] ?? null,
                    "vessel_name" => $shipmentContainer["vessel_name"] ?? null,
                    "voyage_number" => $shipmentContainer["voyage_number"] ?? null,
                    "cargo_description" => $shipmentContainer["cargo_description"] ?? null,
                    "status" => $shipmentContainer["shipment_status"] ?? null
                ];

                break;
            }
        }

        $activityLogs = [];

        if (
            $tableExists("activity_logs") &&
            $columnExists("activity_logs", "entity_id")
        ) {
            $entityColumn = null;

            foreach (["entity_type", "module", "table_name"] as $candidate) {
                if ($columnExists("activity_logs", $candidate)) {
                    $entityColumn = $candidate;
                    break;
                }
            }

            $sql = "
                SELECT *
                FROM activity_logs
                WHERE entity_id = :entity_id
            ";

            if ($entityColumn === "entity_type") {
                $sql .= "
                    AND entity_type IN (
                        'gate_appointments',
                        'gate_appointment',
                        'appointment'
                    )
                ";
            } elseif ($entityColumn === "module") {
                $sql .= "
                    AND module IN (
                        'gate_appointments',
                        'gate_appointment',
                        'appointment'
                    )
                ";
            } elseif ($entityColumn === "table_name") {
                $sql .= "
                    AND table_name IN (
                        'gate_appointments',
                        'gate_appointment',
                        'appointment'
                    )
                ";
            }

            $orderColumn = $getOrderColumn("activity_logs");

            if ($orderColumn) {
                $sql .= " ORDER BY `$orderColumn` DESC";
            }

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                "entity_id" => $appointmentId
            ]);

            $activityLogs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($activityLogs as &$log) {
                $actorId = $log["user_id"]
                    ?? $log["created_by"]
                    ?? $log["performed_by"]
                    ?? null;

                $log["performed_by_name"] = $getUserName($actorId);
            }

            unset($log);
        }

        $appointment["organisation"] = $organisation;
        $appointment["vehicle"] = $vehicle;
        $appointment["driver"] = $driver;
        $appointment["lane"] = $lane;
        $appointment["check_in"] = $checkIn;
        $appointment["check_out"] = $checkOut;
        $appointment["movement_records"] = $movementRecords;
        $appointment["gate_pass"] = $gatePass;
        $appointment["shipment"] = $shipment;
        $appointment["containers"] = $containers;
        $appointment["activity_logs"] = $activityLogs;

        echo json_encode([
            "error" => false,
            "data" => $appointment,
            "code" => null
        ]);

    } catch (Throwable $e) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not load appointment details.",
            "code" => $e->getMessage()
        ]);
    }
