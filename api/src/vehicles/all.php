
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json");

try {
    $stmt = $conn->prepare("
        SELECT
            v.id,
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
            NULL AS last_visit,
            v.created_at,
            v.updated_at,
            d.id AS driver_id,
            d.name AS driver_name,
            d.phone AS driver_phone,
            d.licence_number AS driver_licence_number,
            d.licence_class AS driver_licence_class,
            d.licence_expiry AS driver_licence_expiry,
            d.transporter AS driver_transporter,
            d.status AS driver_status
        FROM gate_vehicles v
        LEFT JOIN gate_driver_vehicle_assignments dva
            ON dva.vehicle_id = v.id
            AND dva.unassigned_at IS NULL
        LEFT JOIN gate_drivers d
            ON d.id = dva.driver_id
        ORDER BY v.created_at DESC
    ");

    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $vehicles = [];

    foreach ($rows as $row) {
        $vehicleId = $row["id"];

        if (!isset($vehicles[$vehicleId])) {
            $status = $row["status"];

            if (
                $status === "Approved" &&
                (
                    (!empty($row["insurance_expiry"]) &&
                        $row["insurance_expiry"] < date("Y-m-d")) ||
                    (!empty($row["roadworthiness_expiry"]) &&
                        $row["roadworthiness_expiry"] < date("Y-m-d"))
                )
            ) {
                $status = "Expired documents";
            }

            $vehicles[$vehicleId] = [
                "id" => $row["id"],
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
                "last_visit" => null,
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
                $row["driver_licence_expiry"] < date("Y-m-d")
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
                "status" => $driverStatus
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
