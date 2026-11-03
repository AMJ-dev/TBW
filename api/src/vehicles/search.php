
<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    header("Content-Type: application/json; charset=utf-8");

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed.",
            "code" => null
        ]);
        exit;
    }

    $q = trim((string)($_POST["q"] ?? ""));
    $include_assigned = filter_var(
        $_POST["include_assigned"] ?? false,
        FILTER_VALIDATE_BOOLEAN
    );

    if (mb_strlen($q) < 2) {
        echo json_encode([
            "error" => false,
            "data" => "Enter at least two characters to search.",
            "code" => []
        ]);
        exit;
    }

    try {
        $organisation_id = $my_details->organisation_id ?? null;
        $search = "%" . $q . "%";

        $assignment_filter = "";

        if (!$include_assigned) {
            $assignment_filter = "
                AND NOT EXISTS (
                    SELECT 1
                    FROM gate_driver_vehicle_assignments ax
                    WHERE ax.vehicle_id = v.id
                    AND ax.unassigned_at IS NULL
                )
            ";
        }

        $sql = "
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
                v.status,

                d.id AS driver_id,
                d.name AS driver_name,
                d.phone AS driver_phone,
                d.status AS driver_status,
                d.licence_number AS driver_licence_number,
                d.licence_class AS driver_licence_class,
                d.licence_expiry AS driver_licence_expiry

            FROM (
                SELECT v.*
                FROM gate_vehicles v
                WHERE LOWER(v.status) = 'approved'
                    AND v.insurance_expiry IS NOT NULL
                    AND v.insurance_expiry >= CURDATE()
                    AND v.roadworthiness_expiry IS NOT NULL
                    AND v.roadworthiness_expiry >= CURDATE()
                    AND (
                        LOWER(v.plate) LIKE :search1
                        OR LOWER(v.kind) LIKE :search2
                        OR LOWER(v.make) LIKE :search3
                        OR LOWER(v.model) LIKE :search4
                        OR LOWER(v.transporter) LIKE :search5
                    )
                    AND v.organisation_id = :organisation_id
                    $assignment_filter
                ORDER BY v.plate ASC
                LIMIT 50
            ) v

            LEFT JOIN gate_driver_vehicle_assignments a
                ON a.vehicle_id = v.id
                AND a.unassigned_at IS NULL

            LEFT JOIN gate_drivers d
                ON d.id = a.driver_id

            ORDER BY v.plate ASC, d.name ASC
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ":search1" => $search,
            ":search2" => $search,
            ":search3" => $search,
            ":search4" => $search,
            ":search5" => $search,
            ":organisation_id" => $organisation_id
        ]);

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $vehicles = [];

        foreach ($rows as $row) {
            $vehicle_id = $row["id"];

            if (!isset($vehicles[$vehicle_id])) {
                $vehicles[$vehicle_id] = [
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
                    "status" => $row["status"],
                    "drivers" => [],
                    "assigned_drivers" => []
                ];
            }

            if (!empty($row["driver_id"])) {
                $driver = [
                    "id" => $row["driver_id"],
                    "name" => $row["driver_name"],
                    "phone" => $row["driver_phone"],
                    "status" => $row["driver_status"],
                    "licence_number" => $row["driver_licence_number"],
                    "licence_class" => $row["driver_licence_class"],
                    "licence_expiry" => $row["driver_licence_expiry"]
                ];

                $vehicles[$vehicle_id]["drivers"][] = $driver;
                $vehicles[$vehicle_id]["assigned_drivers"][] = $driver;
            }
        }

        echo json_encode([
            "error" => false,
            "data" => "Vehicles loaded successfully.",
            "code" => array_values($vehicles)
        ]);
    } catch (Throwable $e) {
        echo json_encode([
            "error" => true,
            "data" => "Could not search vehicles.",
            "code" => $e->getMessage()
        ]);
    }
