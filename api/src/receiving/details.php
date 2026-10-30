<?php

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=UTF-8");

try {
    if (!isset($conn) || !($conn instanceof PDO)) {
        echo json_encode([
            "error" => true,
            "data" => "Database connection is unavailable.",
            "code" => 500
        ]);
        exit;
    }

    $id = trim($_GET["id"] ?? "");

    $receivingQuery = $conn->prepare("
        SELECT
            r.id,
            r.receiving_reference,
            r.shipment_id,
            r.gate_pass_number,
            r.status,
            r.total_containers,
            r.received_containers,
            r.discrepancy_containers,
            r.started_by,
            r.completed_by,
            r.started_at,
            r.completed_at,
            r.remarks,
            r.created_at,
            r.updated_at,

            starter.full_name AS started_by_name,
            starter.email AS started_by_email,
            completer.full_name AS completed_by_name,
            completer.email AS completed_by_email,

            s.shipment_reference,
            s.user_id AS shipment_user_id,
            s.organisation_id,
            s.shipment_type,
            s.bill_of_lading,
            s.booking_number,
            s.vessel_name,
            s.voyage_number,
            s.shipping_line,
            s.origin_country,
            s.origin_port,
            s.destination_port,
            s.expected_arrival,
            s.consignee,
            s.consignee_email,
            s.consignee_phone,
            s.consignee_type,
            s.consignee_organisation_id,
            s.consignee_status,
            s.consignee_contact_person,
            s.consignee_address,
            s.consignee_country,
            s.licensed_agent_id,
            s.licensed_agent_name,
            s.cargo_description,
            s.cargo_category,
            s.package_type,
            s.package_count,
            s.gross_weight,
            s.volume,
            s.dangerous_goods,
            s.temperature_controlled,
            s.temperature,
            s.special_instructions,
            s.customs_reference,
            s.customs_tariff_id,
            s.status AS shipment_status,
            s.created_at AS shipment_created_at,
            s.updated_at AS shipment_updated_at,

            o.organisation_name,
            o.trading_name,
            o.rc_number,
            o.tin,
            o.organisation_type,
            o.verification_status AS organisation_verification_status,
            o.registered_address AS organisation_address,
            o.contact_email AS organisation_email,
            o.contact_phone AS organisation_phone,
            o.contact_person AS organisation_contact_person

        FROM portal_receiving r

        INNER JOIN portal_shipments s
            ON s.id = r.shipment_id

        LEFT JOIN organisations o
            ON o.id = s.organisation_id

        LEFT JOIN users starter
            ON starter.id = r.started_by

        LEFT JOIN users completer
            ON completer.id = r.completed_by

        WHERE r.id = :id

        LIMIT 1
    ");

    $receivingQuery->execute([
        ":id" => $id
    ]);

    $row = $receivingQuery->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode([
            "error" => true,
            "data" => "Receiving record not found.",
            "code" => 404
        ]);
        exit;
    }

    $shipment = [
        "id" => $row["shipment_id"],
        "shipment_id" => $row["shipment_id"],
        "shipment_reference" => $row["shipment_reference"],
        "user_id" => $row["shipment_user_id"],
        "organisation_id" => $row["organisation_id"],
        "shipment_type" => $row["shipment_type"],
        "bill_of_lading" => $row["bill_of_lading"],
        "booking_number" => $row["booking_number"],
        "vessel_name" => $row["vessel_name"],
        "voyage_number" => $row["voyage_number"],
        "shipping_line" => $row["shipping_line"],
        "origin_country" => $row["origin_country"],
        "origin_port" => $row["origin_port"],
        "destination_port" => $row["destination_port"],
        "expected_arrival" => $row["expected_arrival"],
        "consignee" => $row["consignee"],
        "consignee_email" => $row["consignee_email"],
        "consignee_phone" => $row["consignee_phone"],
        "consignee_type" => $row["consignee_type"],
        "consignee_organisation_id" => $row["consignee_organisation_id"],
        "consignee_status" => $row["consignee_status"],
        "consignee_contact_person" => $row["consignee_contact_person"],
        "consignee_address" => $row["consignee_address"],
        "consignee_country" => $row["consignee_country"],
        "licensed_agent_id" => $row["licensed_agent_id"],
        "licensed_agent_name" => $row["licensed_agent_name"],
        "cargo_description" => $row["cargo_description"],
        "cargo_category" => $row["cargo_category"],
        "package_type" => $row["package_type"],
        "package_count" => $row["package_count"] !== null
            ? (float) $row["package_count"]
            : null,
        "gross_weight" => $row["gross_weight"] !== null
            ? (float) $row["gross_weight"]
            : null,
        "volume" => $row["volume"] !== null
            ? (float) $row["volume"]
            : null,
        "dangerous_goods" => $row["dangerous_goods"],
        "temperature_controlled" => $row["temperature_controlled"],
        "temperature" => $row["temperature"],
        "special_instructions" => $row["special_instructions"],
        "customs_reference" => $row["customs_reference"],
        "customs_tariff_id" => $row["customs_tariff_id"],
        "status" => $row["shipment_status"],
        "created_at" => $row["shipment_created_at"],
        "updated_at" => $row["shipment_updated_at"]
    ];

    $organisation = [
        "id" => $row["organisation_id"],
        "organisation_id" => $row["organisation_id"],
        "organisation_name" => $row["organisation_name"],
        "name" => $row["organisation_name"],
        "trading_name" => $row["trading_name"],
        "rc_number" => $row["rc_number"],
        "tin" => $row["tin"],
        "type" => $row["organisation_type"],
        "organisation_type" => $row["organisation_type"],
        "verification_status" => $row["organisation_verification_status"],
        "registered_address" => $row["organisation_address"],
        "contact_email" => $row["organisation_email"],
        "contact_phone" => $row["organisation_phone"],
        "contact_person" => $row["organisation_contact_person"]
    ];

    $receiving = [
        "id" => $row["id"],
        "receiving_id" => $row["id"],
        "receiving_reference" => $row["receiving_reference"],
        "shipment_id" => $row["shipment_id"],
        "gate_pass_number" => $row["gate_pass_number"],
        "gate_in_time" => null,
        "gate_out_time" => null,
        "gate_officer_name" => null,
        "status" => $row["status"],
        "total_containers" => (int) $row["total_containers"],
        "received_containers" => (int) $row["received_containers"],
        "discrepancy_containers" => (int) $row["discrepancy_containers"],
        "started_by" => $row["started_by"],
        "started_by_name" => $row["started_by_name"],
        "started_by_email" => $row["started_by_email"],
        "completed_by" => $row["completed_by"],
        "completed_by_name" => $row["completed_by_name"],
        "completed_by_email" => $row["completed_by_email"],
        "received_by" => $row["completed_by"] ?: $row["started_by"],
        "received_by_name" => $row["completed_by_name"] ?: $row["started_by_name"],
        "started_at" => $row["started_at"],
        "completed_at" => $row["completed_at"],
        "received_at" => $row["completed_at"],
        "remarks" => $row["remarks"],
        "created_at" => $row["created_at"],
        "updated_at" => $row["updated_at"],
        "shipment" => $shipment,
        "organisation" => $organisation,
        "organization" => $organisation
    ];

    $gatePass = null;
    $appointment = null;
    $vehicle = null;
    $driver = null;
    $movement = null;

    $passNumber = trim((string) ($row["gate_pass_number"] ?? ""));

    if ($passNumber !== "") {
        $gatePassQuery = $conn->prepare("
            SELECT
                gp.id,
                gp.organisation_id,
                gp.pass_code,
                gp.appointment_id,
                gp.vehicle_id,
                gp.driver_id,
                gp.type,
                gp.status,
                gp.issued_by,
                gp.issued_at,
                gp.updated_at,
                issuer.full_name AS issued_by_name,
                issuer.email AS issued_by_email
            FROM gate_passes gp
            LEFT JOIN users issuer
                ON issuer.id = gp.issued_by
            WHERE gp.pass_code = :pass_code
            LIMIT 1
        ");

        $gatePassQuery->execute([
            ":pass_code" => $passNumber
        ]);

        $gatePassRow = $gatePassQuery->fetch(PDO::FETCH_ASSOC);

        if ($gatePassRow) {
            $gatePass = [
                "id" => $gatePassRow["id"],
                "gate_pass_id" => $gatePassRow["id"],
                "organisation_id" => $gatePassRow["organisation_id"],
                "pass_code" => $gatePassRow["pass_code"],
                "gate_pass_number" => $gatePassRow["pass_code"],
                "appointment_id" => $gatePassRow["appointment_id"],
                "vehicle_id" => $gatePassRow["vehicle_id"],
                "driver_id" => $gatePassRow["driver_id"],
                "type" => $gatePassRow["type"],
                "status" => $gatePassRow["status"],
                "issued_by" => $gatePassRow["issued_by"],
                "issued_by_name" => $gatePassRow["issued_by_name"],
                "issued_by_email" => $gatePassRow["issued_by_email"],
                "issued_at" => $gatePassRow["issued_at"],
                "updated_at" => $gatePassRow["updated_at"]
            ];

            $appointmentQuery = $conn->prepare("
                SELECT
                    ga.id,
                    ga.organisation_id,
                    ga.vehicle_id,
                    ga.driver_id,
                    ga.booking_ref,
                    ga.appointment_date,
                    ga.slot_time,
                    ga.status,
                    ga.created_by,
                    ga.created_at,
                    ga.updated_at,
                    creator.full_name AS created_by_name
                FROM gate_appointments ga
                LEFT JOIN users creator
                    ON creator.id = ga.created_by
                WHERE ga.id = :appointment_id
                LIMIT 1
            ");

            $appointmentQuery->execute([
                ":appointment_id" => $gatePassRow["appointment_id"]
            ]);

            $appointmentRow = $appointmentQuery->fetch(PDO::FETCH_ASSOC);

            if ($appointmentRow) {
                $appointment = [
                    "id" => $appointmentRow["id"],
                    "appointment_id" => $appointmentRow["id"],
                    "organisation_id" => $appointmentRow["organisation_id"],
                    "vehicle_id" => $appointmentRow["vehicle_id"],
                    "driver_id" => $appointmentRow["driver_id"],
                    "booking_ref" => $appointmentRow["booking_ref"],
                    "appointment_reference" => $appointmentRow["booking_ref"],
                    "appointment_date" => $appointmentRow["appointment_date"],
                    "slot_time" => $appointmentRow["slot_time"],
                    "status" => $appointmentRow["status"],
                    "created_by" => $appointmentRow["created_by"],
                    "created_by_name" => $appointmentRow["created_by_name"],
                    "created_at" => $appointmentRow["created_at"],
                    "updated_at" => $appointmentRow["updated_at"]
                ];
            }

            $vehicleQuery = $conn->prepare("
                SELECT
                    id,
                    plate,
                    kind,
                    make,
                    model,
                    year,
                    capacity,
                    owner,
                    transporter,
                    insurance_expiry,
                    roadworthiness_expiry,
                    notes,
                    status,
                    organisation_id
                FROM gate_vehicles
                WHERE id = :vehicle_id
                LIMIT 1
            ");

            $vehicleQuery->execute([
                ":vehicle_id" => $gatePassRow["vehicle_id"]
            ]);

            $vehicleRow = $vehicleQuery->fetch(PDO::FETCH_ASSOC);

            if ($vehicleRow) {
                $vehicle = [
                    "id" => $vehicleRow["id"],
                    "vehicle_id" => $vehicleRow["id"],
                    "plate" => $vehicleRow["plate"],
                    "registration" => $vehicleRow["plate"],
                    "registration_number" => $vehicleRow["plate"],
                    "vehicle_registration" => $vehicleRow["plate"],
                    "kind" => $vehicleRow["kind"],
                    "type" => $vehicleRow["kind"],
                    "make" => $vehicleRow["make"],
                    "model" => $vehicleRow["model"],
                    "year" => $vehicleRow["year"],
                    "capacity" => $vehicleRow["capacity"],
                    "owner" => $vehicleRow["owner"],
                    "transporter" => $vehicleRow["transporter"],
                    "insurance_expiry" => $vehicleRow["insurance_expiry"],
                    "roadworthiness_expiry" => $vehicleRow["roadworthiness_expiry"],
                    "notes" => $vehicleRow["notes"],
                    "status" => $vehicleRow["status"],
                    "organisation_id" => $vehicleRow["organisation_id"]
                ];
            }

            $driverQuery = $conn->prepare("
                SELECT
                    id,
                    organisation_id,
                    name,
                    phone,
                    licence_number,
                    licence_class,
                    licence_expiry,
                    assigned_vehicle,
                    transporter,
                    notes,
                    status
                FROM gate_drivers
                WHERE id = :driver_id
                LIMIT 1
            ");

            $driverQuery->execute([
                ":driver_id" => $gatePassRow["driver_id"]
            ]);

            $driverRow = $driverQuery->fetch(PDO::FETCH_ASSOC);

            if ($driverRow) {
                $driver = [
                    "id" => $driverRow["id"],
                    "driver_id" => $driverRow["id"],
                    "name" => $driverRow["name"],
                    "full_name" => $driverRow["name"],
                    "phone" => $driverRow["phone"],
                    "phone_number" => $driverRow["phone"],
                    "licence_number" => $driverRow["licence_number"],
                    "licence_class" => $driverRow["licence_class"],
                    "licence_expiry" => $driverRow["licence_expiry"],
                    "assigned_vehicle" => $driverRow["assigned_vehicle"],
                    "transporter" => $driverRow["transporter"],
                    "notes" => $driverRow["notes"],
                    "status" => $driverRow["status"],
                    "organisation_id" => $driverRow["organisation_id"]
                ];
            }

            $movementQuery = $conn->prepare("
                SELECT
                    gm.id,
                    gm.appointment_id,
                    gm.operator_id,
                    gm.gate_pass_id,
                    gm.vehicle_id,
                    gm.driver_id,
                    gm.direction,
                    gm.decision,
                    gm.reason,
                    gm.override_reason,
                    gm.supervisor_approval_ref,
                    gm.movement_at,
                    gm.created_at,
                    operator.full_name AS operator_name,
                    operator.email AS operator_email
                FROM gate_movement_records gm
                LEFT JOIN users operator
                    ON operator.id = gm.operator_id
                WHERE gm.gate_pass_id = :gate_pass_id
                ORDER BY gm.movement_at DESC, gm.created_at DESC
            ");

            $movementQuery->execute([
                ":gate_pass_id" => $gatePassRow["id"]
            ]);

            $movementRows = $movementQuery->fetchAll(PDO::FETCH_ASSOC);
            $movement = [];

            foreach ($movementRows as $movementRow) {
                $movement[] = [
                    "id" => $movementRow["id"],
                    "appointment_id" => $movementRow["appointment_id"],
                    "operator_id" => $movementRow["operator_id"],
                    "operator_name" => $movementRow["operator_name"],
                    "operator_email" => $movementRow["operator_email"],
                    "gate_officer_id" => $movementRow["operator_id"],
                    "gate_officer_name" => $movementRow["operator_name"],
                    "gate_pass_id" => $movementRow["gate_pass_id"],
                    "vehicle_id" => $movementRow["vehicle_id"],
                    "driver_id" => $movementRow["driver_id"],
                    "direction" => $movementRow["direction"],
                    "decision" => $movementRow["decision"],
                    "reason" => $movementRow["reason"],
                    "override_reason" => $movementRow["override_reason"],
                    "supervisor_approval_ref" => $movementRow["supervisor_approval_ref"],
                    "movement_at" => $movementRow["movement_at"],
                    "created_at" => $movementRow["created_at"]
                ];
            }

            $gatePass["appointment"] = $appointment;
            $gatePass["vehicle"] = $vehicle;
            $gatePass["driver"] = $driver;
            $gatePass["movements"] = $movement;

            $gatePass["appointment_reference"] =
                $appointment["booking_ref"] ?? null;

            $gatePass["vehicle_registration"] =
                $vehicle["plate"] ?? null;

            $gatePass["driver_name"] =
                $driver["name"] ?? null;

            $gatePass["driver_phone"] =
                $driver["phone"] ?? null;

            $gatePass["gate_in_time"] = null;
            $gatePass["gate_out_time"] = null;
            $gatePass["gate_officer_name"] = null;

            foreach ($movement as $movementItem) {
                if (
                    strtolower(trim((string) ($movementItem["direction"] ?? ""))) === "in" &&
                    $receiving["gate_in_time"] === null
                ) {
                    $receiving["gate_in_time"] = $movementItem["movement_at"];
                    $gatePass["gate_in_time"] = $movementItem["movement_at"];
                    $gatePass["gate_officer_name"] = $movementItem["gate_officer_name"];
                }

                if (
                    strtolower(trim((string) ($movementItem["direction"] ?? ""))) === "out" &&
                    $gatePass["gate_out_time"] === null
                ) {
                    $gatePass["gate_out_time"] = $movementItem["movement_at"];
                }
            }
        }
    }

    $receiving["gate_pass"] = $gatePass;
    $receiving["gatePass"] = $gatePass;
    $receiving["appointment"] = $appointment;
    $receiving["vehicle"] = $vehicle;
    $receiving["driver"] = $driver;
    $receiving["movements"] = $movement ?? [];

    $receiving["gate_pass_id"] = $gatePass["id"] ?? null;
    $receiving["appointment_id"] = $appointment["id"] ?? null;
    $receiving["appointment_reference"] = $appointment["booking_ref"] ?? null;
    $receiving["vehicle_id"] = $vehicle["id"] ?? null;
    $receiving["vehicle_registration"] = $vehicle["plate"] ?? null;
    $receiving["driver_id"] = $driver["id"] ?? null;
    $receiving["driver_name"] = $driver["name"] ?? null;
    $receiving["driver_phone"] = $driver["phone"] ?? null;

    $receiving["gate_officer_name"] = $gatePass["gate_officer_name"] ?? null;

    $containersQuery = $conn->prepare("
        SELECT
            rc.id,
            rc.receiving_id,
            rc.shipment_id,
            rc.container_id,
            rc.container_no,
            rc.gate_pass_number,
            rc.expected_seal_no,
            rc.actual_seal_no,
            rc.condition_status,
            rc.actual_weight,
            rc.receiving_location,
            rc.receiving_location_id,
            rc.damage_proof_path,
            rc.receiving_status,
            rc.remarks,
            rc.received_by,
            rc.received_at,
            rc.created_at,
            rc.updated_at,

            receiver.full_name AS received_by_name,
            receiver.email AS received_by_email,

            sc.container_no AS declared_container_no,
            sc.size AS container_size,
            sc.seal_no AS declared_seal_no,
            sc.package_count AS expected_package_count,
            sc.gross_weight AS expected_weight,
            sc.cargo_description AS container_cargo_description,
            sc.package_type AS container_package_type,
            sc.hs_code AS container_hs_code,
            sc.item_quantity,
            sc.unit_of_measure,
            sc.unit_value,
            sc.currency,
            sc.total_value AS container_total_value,
            sc.status AS container_lifecycle_status,
            sc.gate_in_at,
            sc.received_at AS container_received_at,
            sc.stored_at,
            sc.gate_out_at

        FROM portal_receiving_containers rc

        LEFT JOIN portal_shipment_containers sc
            ON sc.id = rc.container_id
            AND sc.shipment_id = rc.shipment_id

        LEFT JOIN users receiver
            ON receiver.id = rc.received_by

        WHERE rc.receiving_id = :receiving_id

        ORDER BY rc.created_at ASC
    ");

    $containersQuery->execute([
        ":receiving_id" => $receiving["id"]
    ]);

    $containers = $containersQuery->fetchAll(PDO::FETCH_ASSOC);

    $locationIds = [];

    foreach ($containers as $container) {
        if (!empty($container["receiving_location_id"])) {
            $locationIds[] = $container["receiving_location_id"];
        }
    }

    $locations = [];

    if (!empty($locationIds)) {
        $locationIds = array_values(array_unique($locationIds));
        $placeholders = implode(",", array_fill(0, count($locationIds), "?"));

        $locationQuery = $conn->prepare("
            SELECT
                id,
                code,
                name,
                description,
                kind,
                status
            FROM terminal_locations
            WHERE id IN ($placeholders)
        ");

        $locationQuery->execute($locationIds);

        foreach ($locationQuery->fetchAll(PDO::FETCH_ASSOC) as $locationRow) {
            $locations[(string) $locationRow["id"]] = $locationRow;
        }
    }

    $damagePhotos = [];
    $receivedCount = 0;
    $discrepancyCount = 0;
    $totalActualWeight = 0;
    $containersWithWeight = 0;
    $containersWithSealMismatch = 0;

    foreach ($containers as &$container) {
        $container["container_number"] =
            $container["container_no"]
            ?: $container["declared_container_no"]
            ?: null;

        $container["seal_no"] = $container["declared_seal_no"] ?? null;

        $container["expected_seal"] =
            $container["expected_seal_no"]
            ?: $container["declared_seal_no"]
            ?: null;

        $container["observed_seal"] = $container["actual_seal_no"];

        $container["expected_weight"] =
            $container["expected_weight"] !== null
                ? (float) $container["expected_weight"]
                : null;

        $container["actual_weight"] =
            $container["actual_weight"] !== null
                ? (float) $container["actual_weight"]
                : null;

        $container["weight_difference"] =
            $container["expected_weight"] !== null &&
            $container["actual_weight"] !== null
                ? round(
                    $container["actual_weight"] - $container["expected_weight"],
                    3
                )
                : null;

        $container["package_count"] =
            $container["expected_package_count"] !== null
                ? (float) $container["expected_package_count"]
                : null;

        $container["cargo_type"] =
            $container["container_package_type"]
            ?: $container["container_cargo_description"]
            ?: $shipment["cargo_category"]
            ?: null;

        $container["cargo_condition"] = $container["condition_status"];

        $container["discrepancy_status"] =
            $container["receiving_status"] === "DISCREPANCY"
                ? $container["condition_status"]
                : (
                    $container["condition_status"] === "GOOD"
                        ? "NONE"
                        : $container["condition_status"]
                );

        $locationId = $container["receiving_location_id"] ?? null;

        $container["location"] = $locationId !== null
            ? ($locations[(string) $locationId] ?? null)
            : null;

        $container["receiving_location_name"] =
            $container["location"]["name"]
            ?? $container["receiving_location"]
            ?? null;

        $container["received_by_details"] = [
            "id" => $container["received_by"],
            "name" => $container["received_by_name"],
            "email" => $container["received_by_email"]
        ];

        $container["inspection_status"] = null;
        $container["inspector_name"] = $container["received_by_name"];
        $container["inspection_date"] = $container["received_at"];
        $container["damage_reported"] =
            !empty($container["damage_proof_path"]) ||
            in_array(
                strtoupper((string) $container["condition_status"]),
                ["DAMAGED", "SEAL_MISMATCH", "OTHER_DISCREPANCY"],
                true
            );

        $container["damage_type"] =
            strtoupper((string) $container["condition_status"]) === "DAMAGED"
                ? "DAMAGED"
                : null;

        $container["damage_description"] = $container["remarks"];
        $container["seal_condition"] = null;
        $container["packaging_condition"] = null;
        $container["inspection_remarks"] = $container["remarks"];
        $container["damaged_quantity"] = null;
        $container["damage_location"] = null;
        $container["reported_by"] = $container["received_by_name"];

        $container["damage_photos"] = [];

        if (!empty($container["damage_proof_path"])) {
            $decodedPaths = json_decode($container["damage_proof_path"], true);

            if (json_last_error() === JSON_ERROR_NONE && is_array($decodedPaths)) {
                $paths = $decodedPaths;
            } else {
                $paths = [$container["damage_proof_path"]];
            }

            foreach ($paths as $path) {
                if (!is_string($path) || trim($path) === "") {
                    continue;
                }

                $photo = [
                    "url" => $path,
                    "name" => basename(parse_url($path, PHP_URL_PATH) ?: $path),
                    "description" => $container["remarks"],
                    "container_id" => $container["container_id"],
                    "container_no" => $container["container_number"]
                ];

                $container["damage_photos"][] = $photo;
                $damagePhotos[] = $photo;
            }
        }

        if (strtoupper((string) $container["receiving_status"]) === "RECEIVED") {
            $receivedCount++;
        }

        $condition = strtoupper(trim((string) ($container["condition_status"] ?? "")));

        if (
            $condition !== "" &&
            !in_array($condition, ["GOOD"], true)
        ) {
            $discrepancyCount++;
        }

        if ($container["actual_weight"] !== null) {
            $totalActualWeight += $container["actual_weight"];
            $containersWithWeight++;
        }

        if (
            !empty($container["expected_seal"]) &&
            !empty($container["observed_seal"]) &&
            $container["expected_seal"] !== $container["observed_seal"]
        ) {
            $containersWithSealMismatch++;
        }
    }

    unset($container);

    $receiving["containers"] = $containers;
    $receiving["container_details"] = $containers;
    $receiving["damage_photos"] = $damagePhotos;

    $receiving["receiving_location"] = null;

    foreach ($containers as $container) {
        if (!empty($container["receiving_location_name"])) {
            $receiving["receiving_location"] = $container["receiving_location_name"];
            break;
        }
    }

    if (empty($receiving["received_at"])) {
        foreach ($containers as $container) {
            if (!empty($container["received_at"])) {
                if (
                    empty($receiving["received_at"]) ||
                    $container["received_at"] > $receiving["received_at"]
                ) {
                    $receiving["received_at"] = $container["received_at"];
                }
            }
        }
    }

    $receiving["cargo_verification"] = [
        "container_count" => count($containers),
        "expected_package_count" => $shipment["package_count"],
        "declared_gross_weight" => $shipment["gross_weight"],
        "actual_weight_total" => round($totalActualWeight, 3),
        "container_count_with_weight" => $containersWithWeight,
        "container_count_with_seal_mismatch" => $containersWithSealMismatch
    ];

    $logsQuery = $conn->prepare("
        SELECT
            l.id,
            l.receiving_id,
            l.receiving_container_id,
            l.shipment_id,
            l.container_id,
            l.action,
            l.previous_status,
            l.new_status,
            l.description,
            l.metadata,
            l.performed_by,
            u.full_name AS performed_by_name,
            u.email AS performed_by_email,
            l.performed_at
        FROM portal_receiving_logs l
        LEFT JOIN users u
            ON u.id = l.performed_by
        WHERE l.receiving_id = :receiving_id
        ORDER BY l.performed_at DESC
    ");

    $logsQuery->execute([
        ":receiving_id" => $receiving["id"]
    ]);

    $logs = $logsQuery->fetchAll(PDO::FETCH_ASSOC);

    foreach ($logs as &$log) {
        if (!empty($log["metadata"])) {
            $metadata = json_decode($log["metadata"], true);

            if (json_last_error() === JSON_ERROR_NONE) {
                $log["metadata"] = $metadata;
            }
        }

        $log["performed_by_details"] = [
            "id" => $log["performed_by"],
            "name" => $log["performed_by_name"],
            "email" => $log["performed_by_email"]
        ];
    }

    unset($log);

    $receiving["logs"] = $logs;
    $receiving["history"] = $logs;

    $receiving["summary"] = [
        "total_containers" => (int) $receiving["total_containers"],
        "received_containers" => (int) $receiving["received_containers"],
        "discrepancy_containers" => (int) $receiving["discrepancy_containers"],
        "containers_returned" => count($containers),
        "received_count_from_details" => $receivedCount,
        "discrepancy_count_from_details" => $discrepancyCount,
        "damage_photos_count" => count($damagePhotos),
        "actual_weight_total" => round($totalActualWeight, 3),
        "containers_with_weight" => $containersWithWeight,
        "containers_with_seal_mismatch" => $containersWithSealMismatch
    ];

    $receiving["shipment_reference"] = $shipment["shipment_reference"];
    $receiving["bill_of_lading"] = $shipment["bill_of_lading"];
    $receiving["shipping_line"] = $shipment["shipping_line"];
    $receiving["vessel_name"] = $shipment["vessel_name"];
    $receiving["voyage_number"] = $shipment["voyage_number"];
    $receiving["origin_port"] = $shipment["origin_port"];
    $receiving["destination_port"] = $shipment["destination_port"];
    $receiving["consignee"] = $shipment["consignee"];
    $receiving["organisation_name"] = $organisation["organisation_name"];
    $receiving["organization_name"] = $organisation["organisation_name"];
    $receiving["licensed_agent"] = $shipment["licensed_agent_name"];
    $receiving["licensed_agent_name"] = $shipment["licensed_agent_name"];

    echo json_encode([
        "error" => false,
        "data" => $receiving,
        "code" => 200
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log("Receiving details error: " . $e->getMessage());

    echo json_encode([
        "error" => true,
        "data" => "Could not load receiving details.",
        "code" => 500
    ]);
}