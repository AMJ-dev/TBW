<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    header("Content-Type: application/json; charset=utf-8");

    if ($_SERVER["REQUEST_METHOD"] !== "GET") {
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed.",
            "code" => null
        ]);
        exit;
    }

    $id = trim((string)($_GET["id"] ?? ""));
    $organisation_id = $my_details->organisation_id ?? null;

    if ($id === "") {
        echo json_encode([
            "error" => true,
            "data" => "Gate pass ID is required.",
            "code" => null
        ]);
        exit;
    }

    if (!$organisation_id) {
        echo json_encode([
            "error" => true,
            "data" => "Organisation could not be identified.",
            "code" => null
        ]);
        exit;
    }

    try {
        $stmt = $conn->prepare("
            SELECT
                gp.id,
                gp.pass_code,
                gp.organisation_id,
                gp.appointment_id,
                gp.vehicle_id,
                gp.driver_id,
                gp.type,
                gp.status,
                gp.issued_by,
                gp.issued_at,
                gp.updated_at,

                a.booking_ref,
                a.appointment_date,
                a.slot_time,
                a.status AS appointment_status,
                a.created_by AS appointment_created_by,
                a.created_at AS appointment_created_at,
                a.updated_at AS appointment_updated_at,

                v.id AS vehicle_detail_id,
                v.plate AS vehicle_plate,
                v.kind AS vehicle_kind,
                v.make AS vehicle_make,
                v.model AS vehicle_model,
                v.year AS vehicle_year,
                v.capacity AS vehicle_capacity,
                v.owner AS vehicle_owner,
                v.transporter AS vehicle_transporter,
                v.insurance_expiry AS vehicle_insurance_expiry,
                v.roadworthiness_expiry AS vehicle_roadworthiness_expiry,
                v.notes AS vehicle_notes,
                v.status AS vehicle_status,
                v.organisation_id AS vehicle_organisation_id,
                v.created_by AS vehicle_created_by,
                v.updated_by AS vehicle_updated_by,
                v.created_at AS vehicle_created_at,
                v.updated_at AS vehicle_updated_at,
                v.submitted_at AS vehicle_submitted_at,
                v.reviewed_by AS vehicle_reviewed_by,
                v.reviewed_at AS vehicle_reviewed_at,
                v.review_reason AS vehicle_review_reason,
                v.approved_by AS vehicle_approved_by,
                v.approved_at AS vehicle_approved_at,
                v.rejected_by AS vehicle_rejected_by,
                v.rejected_at AS vehicle_rejected_at,

                d.id AS driver_detail_id,
                d.name AS driver_name,
                d.phone AS driver_phone,
                d.licence_number AS driver_licence_number,
                d.licence_class AS driver_licence_class,
                d.licence_expiry AS driver_licence_expiry,
                d.assigned_vehicle AS driver_assigned_vehicle,
                d.transporter AS driver_transporter,
                d.notes AS driver_notes,
                d.status AS driver_status,
                d.organisation_id AS driver_organisation_id,
                d.created_by AS driver_created_by,
                d.updated_by AS driver_updated_by,
                d.created_at AS driver_created_at,
                d.updated_at AS driver_updated_at,
                d.submitted_at AS driver_submitted_at,
                d.reviewed_by AS driver_reviewed_by,
                d.reviewed_at AS driver_reviewed_at,
                d.review_reason AS driver_review_reason,
                d.approved_by AS driver_approved_by,
                d.approved_at AS driver_approved_at,
                d.rejected_by AS driver_rejected_by,
                d.rejected_at AS driver_rejected_at

            FROM gate_passes gp

            INNER JOIN gate_vehicles v
                ON v.id = gp.vehicle_id

            INNER JOIN gate_drivers d
                ON d.id = gp.driver_id

            LEFT JOIN gate_appointments a
                ON a.id = gp.appointment_id

            WHERE gp.id = :id
            AND gp.organisation_id = :organisation_id

            LIMIT 1
        ");

        $stmt->bindValue(":id", $id, PDO::PARAM_STR);
        $stmt->bindValue(":organisation_id", $organisation_id, PDO::PARAM_STR);
        $stmt->execute();

        $pass = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$pass) {
            echo json_encode([
                "error" => true,
                "data" => "Gate pass not found.",
                "code" => null
            ]);
            exit;
        }

        $appointment_id = $pass["appointment_id"];

        $containerStmt = $conn->prepare("
            SELECT
                c.id,
                c.appointment_id,
                c.container_no,
                c.container_no AS number,
                c.created_at AS appointment_container_created_at,

                (
                    SELECT sc.id
                    FROM portal_shipment_containers sc
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS shipment_container_id,

                (
                    SELECT sc.shipment_id
                    FROM portal_shipment_containers sc
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS shipment_id,

                (
                    SELECT s.shipment_reference
                    FROM portal_shipment_containers sc
                    INNER JOIN portal_shipments s
                        ON s.id = sc.shipment_id
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS shipment_reference,

                (
                    SELECT s.bill_of_lading
                    FROM portal_shipment_containers sc
                    INNER JOIN portal_shipments s
                        ON s.id = sc.shipment_id
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS bill_of_lading,

                (
                    SELECT s.status
                    FROM portal_shipment_containers sc
                    INNER JOIN portal_shipments s
                        ON s.id = sc.shipment_id
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS shipment_status,

                (
                    SELECT sc.size
                    FROM portal_shipment_containers sc
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS size,

                (
                    SELECT sc.seal_no
                    FROM portal_shipment_containers sc
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS seal_no,

                (
                    SELECT sc.hs_code
                    FROM portal_shipment_containers sc
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS hs_code,

                (
                    SELECT sc.package_count
                    FROM portal_shipment_containers sc
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS package_count,

                (
                    SELECT sc.gross_weight
                    FROM portal_shipment_containers sc
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS gross_weight,

                (
                    SELECT sc.status
                    FROM portal_shipment_containers sc
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS status,

                (
                    SELECT sc.gate_in_at
                    FROM portal_shipment_containers sc
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS gate_in_at,

                (
                    SELECT sc.received_at
                    FROM portal_shipment_containers sc
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS received_at,

                (
                    SELECT sc.stored_at
                    FROM portal_shipment_containers sc
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS stored_at,

                (
                    SELECT sc.gate_out_at
                    FROM portal_shipment_containers sc
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS gate_out_at,

                (
                    SELECT sc.created_at
                    FROM portal_shipment_containers sc
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS container_created_at,

                (
                    SELECT sc.updated_at
                    FROM portal_shipment_containers sc
                    WHERE UPPER(TRIM(sc.container_no)) = UPPER(TRIM(c.container_no))
                    ORDER BY sc.updated_at DESC, sc.created_at DESC, sc.id DESC
                    LIMIT 1
                ) AS container_updated_at

            FROM gate_appointment_containers c

            WHERE c.appointment_id = :appointment_id

            ORDER BY c.container_no ASC
        ");

        $containerStmt->bindValue(":appointment_id", $appointment_id, PDO::PARAM_STR);
        $containerStmt->execute();

        $containers = $containerStmt->fetchAll(PDO::FETCH_ASSOC);
 
        $pass["vehicle"] = [
            "id" => $pass["vehicle_detail_id"],
            "plate" => $pass["vehicle_plate"],
            "kind" => $pass["vehicle_kind"],
            "make" => $pass["vehicle_make"],
            "model" => $pass["vehicle_model"],
            "year" => $pass["vehicle_year"],
            "capacity" => $pass["vehicle_capacity"],
            "owner" => $pass["vehicle_owner"],
            "transporter" => $pass["vehicle_transporter"],
            "insurance_expiry" => $pass["vehicle_insurance_expiry"],
            "roadworthiness_expiry" => $pass["vehicle_roadworthiness_expiry"],
            "notes" => $pass["vehicle_notes"],
            "status" => $pass["vehicle_status"],
            "organisation_id" => $pass["vehicle_organisation_id"],
            "created_by" => $pass["vehicle_created_by"],
            "updated_by" => $pass["vehicle_updated_by"],
            "created_at" => $pass["vehicle_created_at"],
            "updated_at" => $pass["vehicle_updated_at"],
            "submitted_at" => $pass["vehicle_submitted_at"],
            "reviewed_by" => $pass["vehicle_reviewed_by"],
            "reviewed_at" => $pass["vehicle_reviewed_at"],
            "review_reason" => $pass["vehicle_review_reason"],
            "approved_by" => $pass["vehicle_approved_by"],
            "approved_at" => $pass["vehicle_approved_at"],
            "rejected_by" => $pass["vehicle_rejected_by"],
            "rejected_at" => $pass["vehicle_rejected_at"]
        ];

        $pass["driver"] = [
            "id" => $pass["driver_detail_id"],
            "name" => $pass["driver_name"],
            "phone" => $pass["driver_phone"],
            "licence_number" => $pass["driver_licence_number"],
            "licence_class" => $pass["driver_licence_class"],
            "licence_expiry" => $pass["driver_licence_expiry"],
            "assigned_vehicle" => $pass["driver_assigned_vehicle"],
            "transporter" => $pass["driver_transporter"],
            "notes" => $pass["driver_notes"],
            "status" => $pass["driver_status"],
            "organisation_id" => $pass["driver_organisation_id"],
            "created_by" => $pass["driver_created_by"],
            "updated_by" => $pass["driver_updated_by"],
            "created_at" => $pass["driver_created_at"],
            "updated_at" => $pass["driver_updated_at"],
            "submitted_at" => $pass["driver_submitted_at"],
            "reviewed_by" => $pass["driver_reviewed_by"],
            "reviewed_at" => $pass["driver_reviewed_at"],
            "review_reason" => $pass["driver_review_reason"],
            "approved_by" => $pass["driver_approved_by"],
            "approved_at" => $pass["driver_approved_at"],
            "rejected_by" => $pass["driver_rejected_by"],
            "rejected_at" => $pass["driver_rejected_at"]
        ];

        $pass["appointment"] = [
            "id" => $pass["appointment_id"],
            "booking_ref" => $pass["booking_ref"],
            "appointment_date" => $pass["appointment_date"],
            "slot_time" => $pass["slot_time"],
            "status" => $pass["appointment_status"],
            "created_by" => $pass["appointment_created_by"],
            "created_at" => $pass["appointment_created_at"],
            "updated_at" => $pass["appointment_updated_at"]
        ];

        $pass["containers"] = $containers;
        $pass["container_nos"] = array_column($containers, "container_no");

        unset(
            $pass["vehicle_detail_id"],
            $pass["vehicle_plate"],
            $pass["vehicle_kind"],
            $pass["vehicle_make"],
            $pass["vehicle_model"],
            $pass["vehicle_year"],
            $pass["vehicle_capacity"],
            $pass["vehicle_owner"],
            $pass["vehicle_transporter"],
            $pass["vehicle_insurance_expiry"],
            $pass["vehicle_roadworthiness_expiry"],
            $pass["vehicle_notes"],
            $pass["vehicle_status"],
            $pass["vehicle_organisation_id"],
            $pass["vehicle_created_by"],
            $pass["vehicle_updated_by"],
            $pass["vehicle_created_at"],
            $pass["vehicle_updated_at"],
            $pass["vehicle_submitted_at"],
            $pass["vehicle_reviewed_by"],
            $pass["vehicle_reviewed_at"],
            $pass["vehicle_review_reason"],
            $pass["vehicle_approved_by"],
            $pass["vehicle_approved_at"],
            $pass["vehicle_rejected_by"],
            $pass["vehicle_rejected_at"],
            $pass["driver_detail_id"],
            $pass["driver_name"],
            $pass["driver_phone"],
            $pass["driver_licence_number"],
            $pass["driver_licence_class"],
            $pass["driver_licence_expiry"],
            $pass["driver_assigned_vehicle"],
            $pass["driver_transporter"],
            $pass["driver_notes"],
            $pass["driver_status"],
            $pass["driver_organisation_id"],
            $pass["driver_created_by"],
            $pass["driver_updated_by"],
            $pass["driver_created_at"],
            $pass["driver_updated_at"],
            $pass["driver_submitted_at"],
            $pass["driver_reviewed_by"],
            $pass["driver_reviewed_at"],
            $pass["driver_review_reason"],
            $pass["driver_approved_by"],
            $pass["driver_approved_at"],
            $pass["driver_rejected_by"],
            $pass["driver_rejected_at"],
            $pass["booking_ref"],
            $pass["appointment_date"],
            $pass["slot_time"],
            $pass["appointment_status"],
            $pass["appointment_created_by"],
            $pass["appointment_created_at"],
            $pass["appointment_updated_at"]
        );

        echo json_encode([
            "error" => false,
            "data" => "Gate pass loaded successfully.",
            "code" => $pass
        ]);
    } catch (Throwable $e) {
        error_log("Gate pass loading error: " . $e->getMessage());

        echo json_encode([
            "error" => true,
            "data" => "Could not load gate pass.",
            "code" => null
        ]);
    }