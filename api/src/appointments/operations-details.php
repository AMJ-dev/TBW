
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

        $stmt = $conn->prepare("
            SELECT
                a.*,
                o.organisation_name,
                o.organisation_type,
                o.verification_status,
                o.verified_at,
                o.contact_person AS organisation_contact_person,
                o.contact_email AS organisation_contact_email,
                o.contact_phone AS organisation_contact_phone,
                v.plate AS vehicle_number,
                v.kind AS vehicle_type,
                d.name AS driver_name,
                d.phone AS driver_phone
            FROM gate_appointments a
            LEFT JOIN organisations o
                ON o.id COLLATE utf8mb4_unicode_ci =
                   a.organisation_id COLLATE utf8mb4_unicode_ci
            LEFT JOIN gate_vehicles v
                ON v.id COLLATE utf8mb4_unicode_ci =
                   a.vehicle_id COLLATE utf8mb4_unicode_ci
            LEFT JOIN gate_drivers d
                ON d.id COLLATE utf8mb4_unicode_ci =
                   a.driver_id COLLATE utf8mb4_unicode_ci
            WHERE a.id COLLATE utf8mb4_unicode_ci =
                  CONVERT(:id USING utf8mb4) COLLATE utf8mb4_unicode_ci
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

        $isCompleted = strtolower($appointment["status"] ?? "") === "completed";

        $appointment["appointment_completed_at"] = $isCompleted
            ? ($appointment["updated_at"] ?? null)
            : null;

        $organisation = [
            "organisation_name" => $appointment["organisation_name"],
            "organisation_type" => $appointment["organisation_type"],
            "verification_status" => $appointment["verification_status"],
            "verified_at" => $appointment["verified_at"],
            "contact_person" => $appointment["organisation_contact_person"],
            "contact_email" => $appointment["organisation_contact_email"],
            "contact_phone" => $appointment["organisation_contact_phone"]
        ];

        $vehicle = [
            "plate" => $appointment["vehicle_number"],
            "kind" => $appointment["vehicle_type"],
            "vehicle_id" => $appointment["vehicle_id"]
        ];

        $driver = [
            "name" => $appointment["driver_name"],
            "phone" => $appointment["driver_phone"],
            "driver_id" => $appointment["driver_id"]
        ];

        $containerStmt = $conn->prepare("
            SELECT
                ac.id,
                ac.appointment_id,
                ac.container_no,
                ac.created_at,
                psc.id AS shipment_container_id,
                psc.container_no AS shipment_container_no,
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
            FROM gate_appointment_containers ac
            LEFT JOIN portal_shipment_containers psc
                ON CONVERT(psc.container_no USING utf8mb4) COLLATE utf8mb4_unicode_ci =
                   CONVERT(ac.container_no USING utf8mb4) COLLATE utf8mb4_unicode_ci
            LEFT JOIN portal_shipments ps
                ON ps.id COLLATE utf8mb4_unicode_ci =
                   psc.shipment_id COLLATE utf8mb4_unicode_ci
            WHERE ac.appointment_id COLLATE utf8mb4_unicode_ci =
                  CONVERT(:appointment_id USING utf8mb4) COLLATE utf8mb4_unicode_ci
            ORDER BY ac.created_at ASC
        ");

        $containerStmt->execute([
            "appointment_id" => $appointmentId
        ]);

        $appointmentContainers = $containerStmt->fetchAll(PDO::FETCH_ASSOC);

        $containers = [];
        $shipment = null;

        foreach ($appointmentContainers as $container) {
            $shipmentContainer = null;

            if (!empty($container["shipment_container_id"])) {
                $shipmentContainer = [
                    "id" => $container["shipment_container_id"],
                    "container_no" => $container["shipment_container_no"],
                    "size" => $container["size"],
                    "seal_no" => $container["seal_no"],
                    "package_count" => $container["package_count"],
                    "gross_weight" => $container["gross_weight"],
                    "package_type" => $container["package_type"],
                    "container_status" => $container["container_status"],
                    "shipment_id" => $container["shipment_id"],
                    "shipment_reference" => $container["shipment_reference"],
                    "bill_of_lading" => $container["bill_of_lading"],
                    "booking_number" => $container["booking_number"],
                    "vessel_name" => $container["vessel_name"],
                    "voyage_number" => $container["voyage_number"],
                    "cargo_description" => $container["cargo_description"],
                    "shipment_status" => $container["shipment_status"]
                ];

                if ($shipment === null && !empty($container["shipment_id"])) {
                    $shipment = [
                        "id" => $container["shipment_id"],
                        "shipment_reference" => $container["shipment_reference"],
                        "bill_of_lading" => $container["bill_of_lading"],
                        "booking_number" => $container["booking_number"],
                        "vessel_name" => $container["vessel_name"],
                        "voyage_number" => $container["voyage_number"],
                        "cargo_description" => $container["cargo_description"],
                        "status" => $container["shipment_status"]
                    ];
                }
            }

            $containers[] = [
                "id" => $container["id"],
                "appointment_id" => $container["appointment_id"],
                "container_no" => $container["container_no"],
                "created_at" => $container["created_at"],
                "shipment_container" => $shipmentContainer
            ];
        }

        $movementStmt = $conn->prepare("
            SELECT
                gm.*,
                gl.code AS lane_code,
                gl.name AS lane_name,
                gl.gate_name,
                u.full_name AS operator_name
            FROM gate_movement_records gm
            LEFT JOIN gate_lanes gl
                ON gl.id COLLATE utf8mb4_unicode_ci =
                   gm.gate_lane_id COLLATE utf8mb4_unicode_ci
            LEFT JOIN users u
                ON u.id COLLATE utf8mb4_unicode_ci =
                   gm.operator_id COLLATE utf8mb4_unicode_ci
            WHERE gm.appointment_id COLLATE utf8mb4_unicode_ci =
                  CONVERT(:appointment_id USING utf8mb4) COLLATE utf8mb4_unicode_ci
            ORDER BY gm.movement_at DESC, gm.created_at DESC
        ");

        $movementStmt->execute([
            "appointment_id" => $appointmentId
        ]);

        $movementRecords = $movementStmt->fetchAll(PDO::FETCH_ASSOC);

        $checkIn = [
            "checked_in_at" => null,
            "checked_in_by" => null,
            "checked_in_by_name" => null,
            "gate_name" => null,
            "lane_name" => null,
            "remarks" => null,
            "decision" => null,
            "override_reason" => null,
            "gate_in_evidence" => null,
            "supervisor_approval_ref" => null
        ];

        $checkOut = [
            "checked_out_at" => null,
            "checked_out_by" => null,
            "checked_out_by_name" => null,
            "gate_name" => null,
            "lane_name" => null,
            "remarks" => null,
            "decision" => null,
            "override_reason" => null,
            "gate_in_evidence" => null,
            "supervisor_approval_ref" => null
        ];

        $lane = [
            "id" => null,
            "name" => null,
            "code" => null
        ];

        foreach ($movementRecords as $movement) {
            $movementData = [
                "movement_at" => $movement["movement_at"],
                "operator_id" => $movement["operator_id"],
                "operator_name" => $movement["operator_name"],
                "gate_name" => $movement["gate_name"],
                "lane_id" => $movement["gate_lane_id"],
                "lane_name" => $movement["lane_name"],
                "lane_code" => $movement["lane_code"],
                "direction" => $movement["direction"],
                "decision" => $movement["decision"],
                "reason" => $movement["reason"],
                "override_reason" => $movement["override_reason"],
                "gate_in_evidence" => $movement["gate_in_evidence"],
                "supervisor_approval_ref" => $movement["supervisor_approval_ref"]
            ];

            if (
                strtolower($movement["direction"]) === "in" &&
                $checkIn["checked_in_at"] === null
            ) {
                $checkIn = [
                    "checked_in_at" => $movement["movement_at"],
                    "checked_in_by" => $movement["operator_id"],
                    "checked_in_by_name" => $movement["operator_name"],
                    "gate_name" => $movement["gate_name"],
                    "lane_name" => $movement["lane_name"],
                    "remarks" => $movement["reason"],
                    "decision" => $movement["decision"],
                    "override_reason" => $movement["override_reason"],
                    "gate_in_evidence" => $movement["gate_in_evidence"],
                    "supervisor_approval_ref" => $movement["supervisor_approval_ref"]
                ];
            }

            if (
                strtolower($movement["direction"]) === "out" &&
                $checkOut["checked_out_at"] === null
            ) {
                $checkOut = [
                    "checked_out_at" => $movement["movement_at"],
                    "checked_out_by" => $movement["operator_id"],
                    "checked_out_by_name" => $movement["operator_name"],
                    "gate_name" => $movement["gate_name"],
                    "lane_name" => $movement["lane_name"],
                    "remarks" => $movement["reason"],
                    "decision" => $movement["decision"],
                    "override_reason" => $movement["override_reason"],
                    "gate_in_evidence" => $movement["gate_in_evidence"],
                    "supervisor_approval_ref" => $movement["supervisor_approval_ref"]
                ];
            }

            if ($lane["id"] === null && !empty($movement["gate_lane_id"])) {
                $lane = [
                    "id" => $movement["gate_lane_id"],
                    "name" => $movement["lane_name"],
                    "code" => $movement["lane_code"]
                ];
            }

            $movement["movement_details"] = $movementData;
        }

        $gatePassStmt = $conn->prepare("
            SELECT
                gp.*,
                u.full_name AS issued_by_name
            FROM gate_passes gp
            LEFT JOIN users u
                ON u.id COLLATE utf8mb4_unicode_ci =
                   gp.issued_by COLLATE utf8mb4_unicode_ci
            WHERE gp.appointment_id COLLATE utf8mb4_unicode_ci =
                  CONVERT(:appointment_id USING utf8mb4) COLLATE utf8mb4_unicode_ci
            ORDER BY gp.issued_at DESC
            LIMIT 1
        ");

        $gatePassStmt->execute([
            "appointment_id" => $appointmentId
        ]);

        $gatePass = $gatePassStmt->fetch(PDO::FETCH_ASSOC) ?: null;

        $activityStmt = $conn->prepare("
            SELECT
                al.*,
                u.full_name AS performed_by_name
            FROM activity_logs al
            LEFT JOIN users u
                ON u.id COLLATE utf8mb4_unicode_ci =
                   al.actor_id COLLATE utf8mb4_unicode_ci
            WHERE al.entity_id COLLATE utf8mb4_unicode_ci =
                  CONVERT(:entity_id USING utf8mb4) COLLATE utf8mb4_unicode_ci
            AND al.entity_type IN (
                'gate_appointments',
                'gate_appointment',
                'appointment'
            )
            ORDER BY al.created_at DESC
        ");

        $activityStmt->execute([
            "entity_id" => $appointmentId
        ]);

        $activityLogs = $activityStmt->fetchAll(PDO::FETCH_ASSOC);

        $appointment["organisation"] = $organisation;
        $appointment["vehicle"] = $vehicle;
        $appointment["driver"] = $driver;
        $appointment["lane"] = $lane;
        $appointment["check_in"] = $checkIn;
        $appointment["check_out"] = $checkOut;
        $appointment["gate_pass"] = $gatePass;
        $appointment["shipment"] = $shipment;
        $appointment["containers"] = $containers;
        $appointment["movement_records"] = $movementRecords;
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
