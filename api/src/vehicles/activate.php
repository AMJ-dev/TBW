<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $id = trim($_POST["id"] ?? "");

    if ($id === "") {
        
        echo json_encode([
            "error" => true,
            "data" => "Vehicle ID is required.",
            "code" => null
        ]);
        exit;
    }

    try {
        $conn->beginTransaction();
        $organisation_id = $my_details->organisation_id ?? null;

        $stmt = $conn->prepare("
            UPDATE gate_vehicles
            SET status = 'Approved'
            WHERE id = :id AND organisation_id = :organisation_id
            AND status IN ('Suspended', 'Inactive', 'Pending review')
            AND (insurance_expiry IS NULL OR insurance_expiry >= CURDATE())
            AND (roadworthiness_expiry IS NULL OR roadworthiness_expiry >= CURDATE())
        ");
        $stmt->execute([":id" => $id, ":organisation_id" => $organisation_id]);

        if ($stmt->rowCount() === 0) {
            $check = $conn->prepare("
                SELECT
                    status,
                    insurance_expiry,
                    roadworthiness_expiry
                FROM gate_vehicles
                WHERE id = :id AND organisation_id = :organisation_id
                LIMIT 1
            ");
            $check->execute([":id" => $id, ":organisation_id" => $organisation_id]);
            $vehicle = $check->fetch(PDO::FETCH_ASSOC);

            if (!$vehicle) {
                
                echo json_encode([
                    "error" => true,
                    "data" => "Vehicle not found.",
                    "code" => null
                ]);
                exit;
            }

            if (
                ($vehicle["insurance_expiry"] !== null &&
                    $vehicle["insurance_expiry"] < date("Y-m-d")) ||
                ($vehicle["roadworthiness_expiry"] !== null &&
                    $vehicle["roadworthiness_expiry"] < date("Y-m-d"))
            ) {
                
                echo json_encode([
                    "error" => true,
                    "data" => "Vehicle documents have expired. Renew them before activation.",
                    "code" => $vehicle
                ]);
                exit;
            }

            
            echo json_encode([
                "error" => true,
                "data" => "This vehicle cannot be activated from its current status.",
                "code" => $vehicle
            ]);
            exit;
        }

        echo json_encode([
            "error" => false,
            "data" => "Vehicle activated successfully.",
            "code" => ["id" => $id, "status" => "Approved"]
        ]);
    } catch (PDOException $e) {
        
        echo json_encode([
            "error" => true,
            "data" => "Could not activate vehicle.",
            "code" => null
        ]);
    }