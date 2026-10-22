<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $id = trim($_GET["id"] ?? "");

    if ($id === "") {
        echo json_encode([
            "error" => true,
            "data" => "Vehicle ID is required.",
            "code" => null
        ]);
        exit;
    }

    try {
        $organisation_id = $my_details->organisation_id ?? null;
        $stmt = $conn->prepare("
            SELECT *
            FROM gate_vehicles
            WHERE id = :id AND organisation_id=:organisation_id
            LIMIT 1
        ");
        $stmt->execute([":id" => $id, ":organisation_id" => $organisation_id]);
        $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$vehicle) {
            echo json_encode([
                "error" => true,
                "data" => "Vehicle not found.",
                "code" => null
            ]);
            exit;
        }

        if (
            $vehicle["status"] === "Approved" &&
            (
                (!empty($vehicle["insurance_expiry"]) &&
                    $vehicle["insurance_expiry"] < date("Y-m-d")) ||
                (!empty($vehicle["roadworthiness_expiry"]) &&
                    $vehicle["roadworthiness_expiry"] < date("Y-m-d"))
            )
        ) {
            $vehicle["status"] = "Expired documents";
        }

        echo json_encode([
            "error" => false,
            "data" => "Vehicle loaded successfully.",
            "code" => $vehicle
        ]);
    } catch (Throwable $e) {
        echo json_encode([
            "error" => true,
            "data" => "Could not load vehicle.",
            "code" => null
        ]);
    }