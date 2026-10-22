<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    header("Content-Type: application/json");

    $id = trim($_GET["id"] ?? "");

    if ($id === "") {
        echo json_encode(["error" => true, "data" => "Driver ID is required.", "code" => null]);
        exit;
    }

    try {
        $organisation_id = $my_details->organisation_id ?? null;

        $stmt = $conn->prepare("
            SELECT
                d.*,
                NULL AS last_visit,
                CASE
                    WHEN d.licence_expiry IS NOT NULL
                        AND d.licence_expiry < CURDATE()
                        AND d.status = 'Approved'
                    THEN 'Expired documents'
                    ELSE d.status
                END AS display_status
            FROM gate_drivers d
            WHERE d.id = :id AND d.organisation_id=:organisation_id
            LIMIT 1
        ");

        $stmt->execute([":id" => $id, ":organisation_id" => $organisation_id]);
        $driver = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$driver) {
            echo json_encode(["error" => true, "data" => "Driver not found.", "code" => null]);
            exit;
        }

        $driver["status"] = $driver["display_status"];
        unset($driver["display_status"]);

        echo json_encode([
            "error" => false,
            "data" => "Driver loaded successfully.",
            "code" => ["driver" => $driver]
        ]);
    } catch (Throwable $e) {
        echo json_encode(["error" => true, "data" => "Could not load driver.", "code" => null]);
    }