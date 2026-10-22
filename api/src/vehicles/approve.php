<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    $id = trim($_POST["id"] ?? "");

    if ($id === "") {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "Vehicle ID is required.",
            "code" => null
        ]);
        exit;
    }

    $organisation_id = $my_details->organisation_id ?? null;

    try {
        $conn->beginTransaction();

        $check = $conn->prepare("
            SELECT `status`
            FROM gate_vehicles
            WHERE id = :id AND organisation_id=:organisation_id
            LIMIT 1
        ");
        $check->execute([":id" => $id, ":organisation_id" => $organisation_id]);
        $vehicle = $check->fetch(PDO::FETCH_ASSOC);

        if (!$vehicle) {
            http_response_code(404);
            echo json_encode([
                "error" => true,
                "data" => "Vehicle not found.",
                "code" => null
            ]);
            exit;
        }
        if ($vehicle["status"] !== "Pending review") {
            http_response_code(409);
            echo json_encode([
                "error" => true,
                "data" => "Only vehicles pending review can be approved.",
                "code" => ["status" => $vehicle["status"]]
            ]);
            exit;
        }

        $stmt = $conn->prepare("UPDATE gate_vehicles SET `status` = 'Approved' WHERE id = :id");
        if ($stmt->execute([":id" => $id])) {
            echo json_encode([
                "error" => false,
                "data" => "Vehicle approved successfully.",
                "code" => ["id" => $id, "status" => "Approved"]
            ]);
            $conn->commit();
        } else {
            $conn->rollBack();
            http_response_code(409);
            echo json_encode([
                "error" => true,
                "data" => "Could not approve vehicle.",
                "code" => ["status" => $vehicle["status"]]
            ]);
            exit;
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "error" => true,
            "data" => "Could not approve vehicle.",
            "code" => $e->getMessage(),
        ]);
    }