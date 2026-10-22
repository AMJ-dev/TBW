
<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    header("Content-Type: application/json; charset=utf-8");

    try {
        $organisation_id = $my_details->organisation_id ?? null;

        if (!$organisation_id) {
            http_response_code(403);
            echo json_encode([
                "error" => true,
                "data" => "Organisation not found.",
                "code" => null
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT
                v.id,
                v.organisation_id,
                v.plate,
                v.kind,
                v.make,
                v.model,
                v.year,
                v.capacity,
                v.owner,
                v.transporter,
                v.insurance_expiry,
                v.roadworthiness_expiry,
                v.notes,
                v.status,
                v.submitted_at,
                v.reviewed_by,
                v.reviewed_at,
                v.review_reason,
                v.approved_by,
                v.approved_at,
                v.rejected_by,
                v.rejected_at,
                v.created_at,
                v.updated_at,
                d.id AS driver_id,
                d.name AS driver_name,
                d.phone AS driver_phone,
                d.licence_number AS driver_licence_number,
                d.licence_class AS driver_licence_class,
                d.licence_expiry AS driver_licence_expiry,
                d.transporter AS driver_transporter,
                d.status AS driver_status,
                d.submitted_at AS driver_submitted_at,
                d.reviewed_by AS driver_reviewed_by,
                d.reviewed_at AS driver_reviewed_at,
                d.review_reason AS driver_review_reason,
                d.approved_by AS driver_approved_by,
                d.approved_at AS driver_approved_at,
                d.rejected_by AS driver_rejected_by,
                d.rejected_at AS driver_rejected_at
            FROM gate_vehicles v
            LEFT JOIN gate_driver_vehicle_assignments dva
                ON dva.vehicle_id = v.id
                AND dva.unassigned_at IS NULL
            LEFT JOIN gate_drivers d
                ON d.id = dva.driver_id
            WHERE v.organisation_id = :organisation_id
            ORDER BY v.created_at DESC
        ");

        $stmt->execute([":organisation_id" => $organisation_id]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $vehicles = [];
        $today = date("Y-m-d");

        foreach ($rows as $row) {
            $vehicleId = $row["id"];

            if (!isset($vehicles[$vehicleId])) {
                $status = $row["status"];

                if (
                    $status === "Approved" &&
                    (
                        (!empty($row["insurance_expiry"]) &&
                            $row["insurance_expiry"] < $today) ||
                        (!empty($row["roadworthiness_expiry"]) &&
                            $row["roadworthiness_expiry"] < $today)
                    )
                ) {
                    $status = "Expired documents";
                }

                $vehicles[$vehicleId] = [
                    "id" => $row["id"],
                    "organisation_id" => $row["organisation_id"],
                    "plate" => $row["plate"],
                    "kind" => $row["kind"],
                    "make" => $row["make"],
                    "model" => $row["model"],
                    "year" => $row["year"],
                    "capacity" => $row["capacity"],
                    "owner" => $row["owner"],
                    "transporter" => $row["transporter"],
                    "insurance_expiry" => $row["insurance_expiry"],
                    "roadworthiness_expiry" => $row["roadworthiness_expiry"],
                    "notes" => $row["notes"],
                    "status" => $status,
                    "submitted_at" => $row["submitted_at"],
                    "reviewed_by" => $row["reviewed_by"],
                    "reviewed_at" => $row["reviewed_at"],
                    "review_reason" => $row["review_reason"],
                    "approved_by" => $row["approved_by"],
                    "approved_at" => $row["approved_at"],
                    "rejected_by" => $row["rejected_by"],
                    "rejected_at" => $row["rejected_at"],
                    "created_at" => $row["created_at"],
                    "updated_at" => $row["updated_at"],
                    "drivers" => []
                ];
            }

            if ($row["driver_id"] !== null) {
                $driverStatus = $row["driver_status"];

                if (
                    $driverStatus === "Approved" &&
                    !empty($row["driver_licence_expiry"]) &&
                    $row["driver_licence_expiry"] < $today
                ) {
                    $driverStatus = "Expired documents";
                }

                $vehicles[$vehicleId]["drivers"][] = [
                    "id" => $row["driver_id"],
                    "name" => $row["driver_name"],
                    "phone" => $row["driver_phone"],
                    "licence_number" => $row["driver_licence_number"],
                    "licence_class" => $row["driver_licence_class"],
                    "licence_expiry" => $row["driver_licence_expiry"],
                    "transporter" => $row["driver_transporter"],
                    "status" => $driverStatus,
                    "submitted_at" => $row["driver_submitted_at"],
                    "reviewed_by" => $row["driver_reviewed_by"],
                    "reviewed_at" => $row["driver_reviewed_at"],
                    "review_reason" => $row["driver_review_reason"],
                    "approved_by" => $row["driver_approved_by"],
                    "approved_at" => $row["driver_approved_at"],
                    "rejected_by" => $row["driver_rejected_by"],
                    "rejected_at" => $row["driver_rejected_at"]
                ];
            }
        }

        echo json_encode([
            "error" => false,
            "data" => "Vehicles loaded successfully.",
            "code" => array_values($vehicles)
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            "error" => true,
            "data" => "Could not load vehicles.",
            "code" => null
        ]);
    }