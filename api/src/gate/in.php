
<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    header("Content-Type: application/json; charset=utf-8");

    if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    
        echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
        exit;
    }

    try {
        $sql = "
            SELECT
                p.id AS id,
                p.id AS gate_pass_id,
                p.pass_code,
                p.organisation_id,
                p.type AS pass_type,
                p.status AS pass_status,
                p.issued_at,
                a.id AS appointment_id,
                a.id AS appointment_reference,
                a.booking_ref,
                a.appointment_date,
                a.slot_time,
                a.status AS appointment_status,
                a.created_at,
                v.id AS vehicle_id,
                v.plate AS vehicle_plate,
                v.kind AS vehicle_kind,
                v.make AS vehicle_make,
                v.model AS vehicle_model,
                v.year AS vehicle_year,
                v.capacity AS vehicle_capacity,
                v.owner AS vehicle_owner,
                v.transporter,
                v.status AS vehicle_status,
                v.insurance_expiry,
                v.roadworthiness_expiry,
                d.id AS driver_id,
                d.name AS driver_name,
                d.phone AS driver_phone,
                d.licence_number AS driver_licence_number,
                d.licence_class AS driver_licence_class,
                d.status AS driver_status,
                d.transporter AS driver_transporter,
                d.notes AS driver_notes,
                d.licence_expiry,
                (
                    SELECT GROUP_CONCAT(
                        ac.container_no
                        ORDER BY ac.container_no
                        SEPARATOR ','
                    )
                    FROM gate_appointment_containers ac
                    WHERE ac.appointment_id = a.id
                ) AS container_nos,
                (
                    SELECT gm.decision
                    FROM gate_movement_records gm
                    WHERE gm.gate_pass_id = p.id
                    AND gm.direction = 'in'
                    ORDER BY gm.movement_at DESC, gm.created_at DESC
                    LIMIT 1
                ) AS latest_gate_in_decision,
                (
                    SELECT gm.reason
                    FROM gate_movement_records gm
                    WHERE gm.gate_pass_id = p.id
                    AND gm.direction = 'in'
                    ORDER BY gm.movement_at DESC, gm.created_at DESC
                    LIMIT 1
                ) AS latest_gate_in_reason,
                (
                    SELECT gm.movement_at
                    FROM gate_movement_records gm
                    WHERE gm.gate_pass_id = p.id
                    AND gm.direction = 'in'
                    ORDER BY gm.movement_at DESC, gm.created_at DESC
                    LIMIT 1
                ) AS latest_gate_in_at,
                EXISTS (
                    SELECT 1
                    FROM gate_movement_records gm
                    WHERE gm.gate_pass_id = p.id
                    AND gm.direction = 'in'
                    AND gm.decision = 'ADMIT'
                ) AS used,
                EXISTS (
                    SELECT 1
                    FROM gate_driver_vehicle_assignments dva
                    WHERE dva.driver_id = a.driver_id
                    AND dva.vehicle_id = a.vehicle_id
                    AND dva.unassigned_at IS NULL
                ) AS assignment_eligible
            FROM gate_passes p
            INNER JOIN gate_appointments a
                ON a.id = p.appointment_id
            LEFT JOIN gate_vehicles v
                ON v.id = p.vehicle_id
            LEFT JOIN gate_drivers d
                ON d.id = p.driver_id
            WHERE a.appointment_date = CURDATE()
            AND p.type IN ('Terminal Entry', 'Collection')
            ORDER BY a.slot_time ASC, p.issued_at DESC
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $today = date("Y-m-d");
        $result = [];

        $containerStmt = $conn->prepare("
            SELECT
                ac.id AS appointment_container_id,
                ac.appointment_id,
                ac.container_no,
                ac.container_no AS number,
                ac.created_at AS appointment_container_created_at,
                sc.id AS shipment_container_id,
                sc.shipment_id,
                sc.container_no AS shipment_container_no,
                sc.size,
                sc.seal_no,
                sc.hs_code,
                sc.package_count,
                sc.gross_weight,
                sc.status AS container_status,
                sc.gate_in_at,
                sc.received_at,
                sc.stored_at,
                sc.gate_out_at,
                sc.created_at AS container_created_at,
                sc.updated_at AS container_updated_at,
                s.shipment_reference,
                s.bill_of_lading,
                s.status AS shipment_status,
                s.organisation_id AS shipment_organisation_id
            FROM gate_appointment_containers ac
            LEFT JOIN portal_shipment_containers sc
                ON UPPER(TRIM(sc.container_no)) = UPPER(TRIM(ac.container_no))
                AND sc.id = (
                    SELECT sc2.id
                    FROM portal_shipment_containers sc2
                    WHERE UPPER(TRIM(sc2.container_no)) = UPPER(TRIM(ac.container_no))
                    ORDER BY sc2.updated_at DESC, sc2.created_at DESC, sc2.id DESC
                    LIMIT 1
                )
            LEFT JOIN portal_shipments s
                ON s.id = sc.shipment_id
            WHERE ac.appointment_id = :appointment_id
            ORDER BY ac.container_no ASC
        ");

        foreach ($rows as $row) {
            $containerStmt->bindValue(":appointment_id", $row["appointment_id"], PDO::PARAM_STR);
            $containerStmt->execute();
            $containerRows = $containerStmt->fetchAll(PDO::FETCH_ASSOC);

            $containers = [];
            foreach ($containerRows as $containerRow) {
                $container = [];

                foreach ([
                    "container_no",
                    "seal_no",
                    "seal_number",
                    "container_size",
                    "container_type",
                    "size",
                    "type",
                    "weight",
                    "gross_weight",
                    "tare_weight",
                    "appointment_container_id",
                    "appointment_id",
                    "number",
                    "appointment_container_created_at",
                    "shipment_container_id",
                    "shipment_id",
                    "shipment_container_no",
                    "hs_code",
                    "package_count",
                    "container_status",
                    "gate_in_at",
                    "received_at",
                    "stored_at",
                    "gate_out_at",
                    "container_created_at",
                    "container_updated_at",
                    "shipment_reference",
                    "bill_of_lading",
                    "shipment_status",
                    "shipment_organisation_id"
                ] as $field) {
                    if (array_key_exists($field, $containerRow)) {
                        $container[$field] = $containerRow[$field];
                    }
                }

                $containers[] = $container;
            }

            $organisationStmt = $conn->prepare("
                SELECT *
                FROM organisations
                WHERE id = ?
                LIMIT 1
            ");
            $organisationStmt->execute([$row["organisation_id"] ?? null]);
            $row["organisation"] = $organisationStmt->fetch(PDO::FETCH_ASSOC) ?: null;

            $row["vehicle"] = [
                "id" => $row["vehicle_id"] ?? null,
                "plate" => $row["vehicle_plate"] ?? null,
                "kind" => $row["vehicle_kind"] ?? null,
                "make" => $row["vehicle_make"] ?? null,
                "model" => $row["vehicle_model"] ?? null,
                "year" => $row["vehicle_year"] ?? null,
                "capacity" => $row["vehicle_capacity"] ?? null,
                "owner" => $row["vehicle_owner"] ?? null,
                "transporter" => $row["transporter"] ?? null,
                "status" => $row["vehicle_status"] ?? null,
                "insurance_expiry" => $row["insurance_expiry"] ?? null,
                "roadworthiness_expiry" => $row["roadworthiness_expiry"] ?? null
            ];

            $row["driver"] = [
                "id" => $row["driver_id"] ?? null,
                "name" => $row["driver_name"] ?? null,
                "phone" => $row["driver_phone"] ?? null,
                "licence_number" => $row["driver_licence_number"] ?? null,
                "licence_class" => $row["driver_licence_class"] ?? null,
                "licence_expiry" => $row["licence_expiry"] ?? null,
                "status" => $row["driver_status"] ?? null,
                "transporter" => $row["driver_transporter"] ?? null,
                "notes" => $row["driver_notes"] ?? null
            ];

            $row["appointment"] = [
                "id" => $row["appointment_id"],
                "booking_ref" => $row["booking_ref"] ?? null,
                "appointment_date" => $row["appointment_date"] ?? null,
                "slot_time" => $row["slot_time"] ?? null,
                "status" => $row["appointment_status"] ?? null
            ];

            $passStatus = strtolower(trim((string) $row["pass_status"]));
            $appointmentStatus = strtolower(trim((string) $row["appointment_status"]));
            $vehicleStatus = strtolower(trim((string) ($row["vehicle_status"] ?? "")));
            $driverStatus = strtolower(trim((string) ($row["driver_status"] ?? "")));

            $used = (bool) $row["used"];
            $appointmentDate = !empty($row["appointment_date"])
                ? date("Y-m-d", strtotime((string) $row["appointment_date"]))
                : "";

            $passExpired = $appointmentDate !== $today;

            $vehicleEligible =
                $vehicleStatus === "approved" &&
                !empty($row["insurance_expiry"]) &&
                $row["insurance_expiry"] >= $today &&
                !empty($row["roadworthiness_expiry"]) &&
                $row["roadworthiness_expiry"] >= $today;

            $driverEligible =
                $driverStatus === "approved" &&
                !empty($row["licence_expiry"]) &&
                $row["licence_expiry"] >= $today;

            $assignmentEligible = (bool) $row["assignment_eligible"];

            $appointmentEligible = in_array(
                $appointmentStatus,
                ["confirmed", "arrived"],
                true
            );

            $passEligible =
                $passStatus === "active" &&
                !$passExpired;

            $appointmentContainers = !empty($row["container_nos"])
                ? array_values(array_filter(array_map(
                    "trim",
                    explode(",", (string) $row["container_nos"])
                )))
                : [];


            $normalize = static function (array $values): array {
                $values = array_map(
                    static fn($value) => strtoupper(trim((string) $value)),
                    $values
                );
                $values = array_values(array_unique($values));
                sort($values);
                return $values;
            };

            $cargoEligible = count($appointmentContainers) > 0;

            $checks = [
                "vehicle" => $vehicleEligible,
                "driver" => $driverEligible,
                "assignment" => $assignmentEligible,
                "appointment" => $appointmentEligible,
                "cargo" => $cargoEligible,
                "pass" => $passEligible
            ];

            $holds = [];

            if (!$vehicleEligible) {
                if ($vehicleStatus !== "approved") {
                    $holds[] = "Vehicle is not approved";
                }
                if (empty($row["insurance_expiry"]) || $row["insurance_expiry"] < $today) {
                    $holds[] = "Vehicle insurance is missing or expired";
                }
                if (empty($row["roadworthiness_expiry"]) || $row["roadworthiness_expiry"] < $today) {
                    $holds[] = "Vehicle roadworthiness is missing or expired";
                }
            }

            if (!$driverEligible) {
                if ($driverStatus !== "approved") {
                    $holds[] = "Driver is not approved";
                }
                if (empty($row["licence_expiry"]) || $row["licence_expiry"] < $today) {
                    $holds[] = "Driver licence is missing or expired";
                }
            }

            if (!$assignmentEligible) {
                $holds[] = "Driver is not assigned to this vehicle";
            }

            if (!$appointmentEligible) {
                $holds[] = "Appointment status does not permit gate-in";
            }

            if (!$cargoEligible) {
                $holds[] = "Pass containers do not match appointment containers";
            }

            $latestDecision = strtoupper(trim((string) ($row["latest_gate_in_decision"] ?? "")));

            if ($passStatus === "redeemed") {
                $statusLabel = "Redeemed";
            } elseif ($passStatus === "revoked") {
                $statusLabel = "Revoked";
            } elseif ($passExpired) {
                $statusLabel = "Expired";
            } elseif ($used) {
                $statusLabel = "Used";
            } elseif ($latestDecision === "REJECT") {
                $statusLabel = "Rejected";
            } elseif ($latestDecision === "REFER") {
                $statusLabel = "Referred";
            } elseif ($passStatus !== "active") {
                $statusLabel = ucfirst($passStatus ?: "Unknown");
            } else {
                $statusLabel = "Active";
            }

            $readiness = "Ready";
            if (!$vehicleEligible || !$driverEligible || !$assignmentEligible || !$appointmentEligible || !$cargoEligible || !$passEligible) {
                $readiness = "Needs verification";
            }

            $row["container_nos"] = $appointmentContainers;
            $row["containers"] = $containers;
            $row["used"] = $used;
            $row["pass_expired"] = $passExpired;
            $row["assignment_eligible"] = $assignmentEligible;
            $row["checks"] = $checks;
            $row["holds"] = array_values(array_unique($holds));
            $row["readiness"] = $readiness;
            $row["status_label"] = $statusLabel;
            $row["latest_decision"] = $latestDecision;
            $row["can_admit"] =
                !$used &&
                $passEligible &&
                $vehicleEligible &&
                $driverEligible &&
                $assignmentEligible &&
                $appointmentEligible &&
                $cargoEligible;
            $row["purpose"] = $row["pass_type"];

            $result[] = $row;
        }

        echo json_encode([
            "error" => false,
            "data" => "Today's gate-in passes loaded successfully.",
            "code" => $result,
            "count" => count($result)
        ], JSON_UNESCAPED_SLASHES);
    } catch (Throwable $e) {
        error_log("Gate-in queue error: " . $e->getMessage());
        
        echo json_encode([
            "error" => true,
            "data" => "Could not load today's gate-in passes.",
            "code" => null
        ]);
    }

