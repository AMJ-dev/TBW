<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=utf-8");

try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);
        echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
        exit;
    }

    $id = trim((string) ($_POST["id"] ?? ""));
    $name = trim((string) ($_POST["location_name"] ?? ""));
    $code = strtoupper(trim((string) ($_POST["location_code"] ?? "")));
    $kind = strtoupper(trim((string) ($_POST["location_type"] ?? "YARD")));
    $parentLocationId = trim((string) ($_POST["parent_location_id"] ?? "")) ?: null;
    $description = trim((string) ($_POST["description"] ?? ""));
    $capacityInput = $_POST["capacity"] ?? null;
    $isActive = filter_var($_POST["is_active"] ?? true, FILTER_VALIDATE_BOOLEAN);
    $changeReason = trim((string) ($_POST["change_reason"] ?? ""));

    if ($name === "" || $code === "") {
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "Location name and location code are required.", "code" => null]);
        exit;
    }

    if (strlen($name) > 255 || strlen($code) > 80 || strlen($description) > 1000) {
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "Location name, code or description exceeds the permitted length.", "code" => null]);
        exit;
    }

    if (!preg_match('/^[A-Z0-9_-]+$/', $code)) {
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "Location code may contain only letters, numbers, hyphens and underscores.", "code" => null]);
        exit;
    }

    if (!in_array($kind, ["YARD", "WAREHOUSE", "INSPECTION_BAY"], true)) {
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "Invalid location type.", "code" => null]);
        exit;
    }

    if ($capacityInput === "" || $capacityInput === null) {
        $capacity = null;
    } elseif (!is_numeric($capacityInput) || !is_finite((float) $capacityInput) || (float) $capacityInput < 0 || floor((float) $capacityInput) !== (float) $capacityInput) {
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "Capacity (TEU) must be a non-negative whole number.", "code" => null]);
        exit;
    } else {
        $capacity = (int) $capacityInput;
    }

    if ($changeReason === "" || strlen($changeReason) > 500) {
        http_response_code(422);
        echo json_encode(["error" => true, "data" => "A reason of 1 to 500 characters is required.", "code" => null]);
        exit;
    }

    if ($parentLocationId !== null) {
        if ($parentLocationId === $id && $id !== "") {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "A location cannot be its own parent.", "code" => null]);
            exit;
        }

        $parentQuery = $conn->prepare("SELECT id, kind FROM terminal_locations WHERE id = :id LIMIT 1");
        $parentQuery->execute([":id" => $parentLocationId]);
        $parent = $parentQuery->fetch(PDO::FETCH_ASSOC);

        if (!$parent) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The selected parent location does not exist.", "code" => null]);
            exit;
        }

        if ($parent["kind"] !== $kind) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The parent location must have the same location type.", "code" => null]);
            exit;
        }
    }

    $duplicateQuery = $conn->prepare("SELECT id FROM terminal_locations WHERE code = :code AND id <> :id LIMIT 1");
    $duplicateQuery->execute([":code" => $code, ":id" => $id]);

    if ($duplicateQuery->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(409);
        echo json_encode(["error" => true, "data" => "A location with this code already exists.", "code" => null]);
        exit;
    }

    $status = $isActive ? "active" : "inactive";

    if ($id !== "") {
        $existsQuery = $conn->prepare("SELECT id FROM terminal_locations WHERE id = :id LIMIT 1");
        $existsQuery->execute([":id" => $id]);

        if (!$existsQuery->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(404);
            echo json_encode(["error" => true, "data" => "Location not found.", "code" => null]);
            exit;
        }

        $query = $conn->prepare("UPDATE terminal_locations SET parent_location_id = :parent_location_id, code = :code, name = :name, description = :description, kind = :kind, status = :status, capacity = :capacity, change_reason = :change_reason WHERE id = :id");
        $query->execute([
            ":parent_location_id" => $parentLocationId,
            ":code" => $code,
            ":name" => $name,
            ":description" => $description,
            ":kind" => $kind,
            ":status" => $status,
            ":capacity" => $capacity,
            ":change_reason" => $changeReason,
            ":id" => $id
        ]);

        echo json_encode(["error" => false, "data" => "Location updated successfully.", "code" => ["id" => $id, "location_code" => $code]], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $id = generateId();
    $query = $conn->prepare("INSERT INTO terminal_locations (id, parent_location_id, code, name, description, kind, status, capacity, capacity_unit, change_reason) VALUES (:id, :parent_location_id, :code, :name, :description, :kind, :status, :capacity, 'TEU', :change_reason)");
    $query->execute([
        ":id" => $id,
        ":parent_location_id" => $parentLocationId,
        ":code" => $code,
        ":name" => $name,
        ":description" => $description,
        ":kind" => $kind,
        ":status" => $status,
        ":capacity" => $capacity,
        ":change_reason" => $changeReason
    ]);

    echo json_encode(["error" => false, "data" => "Location created successfully.", "code" => ["id" => $id, "location_code" => $code]], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => true, "data" => "Could not save the location. Check the supplied values and database constraints.", "code" => null]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => true, "data" => "An unexpected error occurred while saving the location.", "code" => null]);
}
