<?php
header("Content-Type: application/json; charset=utf-8");

require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed.",
        "code" => null
    ]);
    exit;
}

$shipment_id = trim((string)($_POST["shipment_id"] ?? ""));
$containersInput = $_POST["containers"] ?? [];
$performed_by = $user_id ?? ($_SESSION["user_id"] ?? null);

if (is_string($containersInput)) {
    $decodedContainers = json_decode($containersInput, true);
    $containers = is_array($decodedContainers) ? $decodedContainers : [];
} else {
    $containers = is_array($containersInput) ? $containersInput : [];
}

if ($shipment_id === "" || count($containers) === 0) {
    http_response_code(400);
    echo json_encode([
        "error" => true,
        "data" => "Shipment and at least one container are required.",
        "code" => null
    ]);
    exit;
}

$allowed_conditions = ["GOOD", "DAMAGED", "SEAL_MISMATCH", "OTHER_DISCREPANCY"];
$allowed_proof_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
$uploadedProofs = [];

try {
    $conn->beginTransaction();

    $shipmentQuery = $conn->prepare("
        SELECT id, shipment_reference
        FROM portal_shipments
        WHERE id = :shipment_id
        LIMIT 1
        FOR UPDATE
    ");
    $shipmentQuery->execute(["shipment_id" => $shipment_id]);
    $shipment = $shipmentQuery->fetch(PDO::FETCH_ASSOC);

    if (!$shipment) {
        throw new RuntimeException("Shipment was not found.");
    }

    $preparedContainers = [];
    $seenContainerIds = [];

    $locationQuery = $conn->prepare("
        SELECT id, code, name
        FROM terminal_locations
        WHERE id = :location_id
          AND kind IN ('RECEIVING', 'YARD', 'WAREHOUSE', 'INSPECTION_BAY')
          AND status = 'active'
        LIMIT 1
    ");

    foreach ($containers as $item) {
        if (!is_array($item)) {
            throw new RuntimeException("Invalid container data.");
        }

        $container_id = trim((string)($item["container_id"] ?? ""));
        $condition = strtoupper(trim((string)($item["condition"] ?? "")));
        $actual_seal_no = trim((string)($item["actual_seal_no"] ?? ""));
        $location_id = trim((string)($item["receiving_location_id"] ?? ""));
        $actual_weight = trim((string)($item["actual_weight"] ?? ""));
        $remarks = trim((string)($item["remarks"] ?? ""));

        if ($container_id === "" || isset($seenContainerIds[$container_id])) {
            throw new RuntimeException("Each selected container must have a unique valid ID.");
        }

        $seenContainerIds[$container_id] = true;

        if (!in_array($condition, $allowed_conditions, true)) {
            throw new RuntimeException("Select a valid condition for every selected container.");
        }

        if ($location_id === "") {
            throw new RuntimeException("Receiving location is required for every selected container.");
        }

        $locationQuery->execute(["location_id" => $location_id]);
        $location = $locationQuery->fetch(PDO::FETCH_ASSOC);

        if (!$location) {
            throw new RuntimeException("Select a valid receiving yard or warehouse location.");
        }

        if ($actual_weight !== "" && (!is_numeric($actual_weight) || (float)$actual_weight < 0)) {
            throw new RuntimeException("Actual weight must be a valid non-negative number.");
        }

        $containerQuery = $conn->prepare("
            SELECT id, shipment_id, container_no, seal_no, status
            FROM portal_shipment_containers
            WHERE id = :container_id AND shipment_id = :shipment_id
            LIMIT 1
            FOR UPDATE
        ");
        $containerQuery->execute([
            "container_id" => $container_id,
            "shipment_id" => $shipment_id
        ]);
        $container = $containerQuery->fetch(PDO::FETCH_ASSOC);

        if (!$container) {
            throw new RuntimeException("A selected container does not belong to this shipment.");
        }

        if (strtoupper((string)$container["status"]) !== "ENTERED") {
            throw new RuntimeException("Container " . $container["container_no"] . " has not been recorded as entering the gate.");
        }

        $gateQuery = $conn->prepare("
            SELECT gp.pass_code
            FROM gate_appointment_containers gac
            INNER JOIN gate_appointments ga ON ga.id = gac.appointment_id
            INNER JOIN gate_passes gp ON gp.appointment_id = ga.id
            INNER JOIN gate_movement_records gmr
                ON gmr.appointment_id = ga.id
                AND gmr.gate_pass_id = gp.id
            WHERE UPPER(TRIM(gac.container_no)) = UPPER(TRIM(:container_no))
              AND gmr.direction = 'in'
              AND gmr.decision = 'ADMIT'
            ORDER BY gmr.movement_at DESC
            LIMIT 1
        ");
        $gateQuery->execute(["container_no" => $container["container_no"]]);
        $gatePassNumber = $gateQuery->fetchColumn();

        if (!$gatePassNumber) {
            throw new RuntimeException("Container " . $container["container_no"] . " has no admitted inbound gate movement.");
        }

        $alreadyReceivedQuery = $conn->prepare("
            SELECT id
            FROM portal_receiving_containers
            WHERE container_id = :container_id
              AND receiving_status IN ('RECEIVED', 'DISCREPANCY')
            LIMIT 1
            FOR UPDATE
        ");
        $alreadyReceivedQuery->execute(["container_id" => $container_id]);

        if ($alreadyReceivedQuery->fetchColumn()) {
            throw new RuntimeException("Container " . $container["container_no"] . " has already been received.");
        }

        $expectedSeal = trim((string)($container["seal_no"] ?? ""));

        if ($expectedSeal !== "" && $actual_seal_no === "") {
            throw new RuntimeException("Enter the actual seal number for container " . $container["container_no"] . ".");
        }

        if ($expectedSeal !== "" && strtoupper($expectedSeal) !== strtoupper($actual_seal_no)) {
            $condition = "SEAL_MISMATCH";
        }

        if ($condition === "DAMAGED" && isset($_FILES["damage_proof"])) {
            $proofFile = $_FILES["damage_proof"];
            $fileIndex = $container_id;

            if (isset($proofFile["error"][$fileIndex]) && $proofFile["error"][$fileIndex] !== UPLOAD_ERR_NO_FILE) {
                if ($proofFile["error"][$fileIndex] !== UPLOAD_ERR_OK) {
                    throw new RuntimeException("Damage evidence upload failed for container " . $container["container_no"] . ".");
                }

                if (($proofFile["size"][$fileIndex] ?? 0) > 10 * 1024 * 1024) {
                    throw new RuntimeException("Damage evidence must not exceed 10 MB.");
                }

                $tmpPath = $proofFile["tmp_name"][$fileIndex] ?? "";
                $detectedMime = $tmpPath !== "" && is_file($tmpPath) ? mime_content_type($tmpPath) : "";

                if (!in_array($detectedMime, $allowed_proof_types, true)) {
                    throw new RuntimeException("Damage evidence must be a JPEG, PNG, WebP image, or PDF.");
                }

                if (!function_exists("upload_multiple_files")) {
                    throw new RuntimeException("The damage evidence upload function is unavailable.");
                }

                $uploadResult = upload_multiple_files($proofFile, $fileIndex, $allowed_proof_types);

                if (!empty($uploadResult["error"])) {
                    throw new RuntimeException((string)($uploadResult["data"] ?? "Could not upload damage evidence."));
                }

                $uploadedProofs[$container_id] = $uploadResult["data"];
            }
        }

        if ($condition === "DAMAGED" && isset($uploadedProofs[$container_id])) {
            $proofPath = $uploadedProofs[$container_id];
            $remarks = trim($remarks . ($remarks !== "" ? "\n" : "") . "Damage evidence: " . $proofPath);
        }

        $receivingStatus = $condition === "GOOD" ? "RECEIVED" : "DISCREPANCY";

        $preparedContainers[] = [
            "id" => $container_id,
            "container_no" => $container["container_no"],
            "expected_seal_no" => $expectedSeal,
            "actual_seal_no" => $actual_seal_no,
            "condition" => $condition,
            "actual_weight" => $actual_weight === "" ? null : (float)$actual_weight,
            "receiving_location" => $location["name"],
            "receiving_location_id" => $location["id"],
            "remarks" => $remarks,
            "damage_proof" => $uploadedProofs[$container_id] ?? null,
            "gate_pass_number" => $gatePassNumber,
            "receiving_status" => $receivingStatus
        ];
    }

    $receiving_id = generateId();
    $receiving_reference = "TRN-RCV-" . date("Y") . "-" . strtoupper(bin2hex(random_bytes(5)));
    $gatePassNumbers = array_values(array_unique(array_column($preparedContainers, "gate_pass_number")));
    $gate_pass_number = count($gatePassNumbers) === 1 ? $gatePassNumbers[0] : null;

    $totalQuery = $conn->prepare("
        SELECT COUNT(*)
        FROM portal_shipment_containers
        WHERE shipment_id = :shipment_id
    ");
    $totalQuery->execute(["shipment_id" => $shipment_id]);
    $totalContainers = (int)$totalQuery->fetchColumn();

    $createReceiving = $conn->prepare("
        INSERT INTO portal_receiving (
            id, receiving_reference, shipment_id, gate_pass_number, status,
            total_containers, received_containers, discrepancy_containers,
            started_by, started_at, remarks
        ) VALUES (
            :id, :receiving_reference, :shipment_id, :gate_pass_number, 'IN_PROGRESS',
            :total_containers, 0, 0, :started_by, NOW(), NULL
        )
    ");
    $createReceiving->execute([
        "id" => $receiving_id,
        "receiving_reference" => $receiving_reference,
        "shipment_id" => $shipment_id,
        "gate_pass_number" => $gate_pass_number,
        "total_containers" => $totalContainers,
        "started_by" => $performed_by
    ]);

    $insertContainer = $conn->prepare("
        INSERT INTO portal_receiving_containers (
            id, receiving_id, shipment_id, container_id, container_no,
            gate_pass_number, expected_seal_no, actual_seal_no, condition_status,
            actual_weight, receiving_location, receiving_status, remarks,
            received_by, received_at
        ) VALUES (
            :id, :receiving_id, :shipment_id, :container_id, :container_no,
            :gate_pass_number, :expected_seal_no, :actual_seal_no, :condition_status,
            :actual_weight, :receiving_location, :receiving_status, :remarks,
            :received_by, NOW()
        )
    ");

    $updateShipmentContainer = $conn->prepare("
        UPDATE portal_shipment_containers
        SET status = :status, received_at = NOW()
        WHERE id = :container_id AND shipment_id = :shipment_id
    ");

    $insertLog = $conn->prepare("
        INSERT INTO portal_receiving_logs (
            id, receiving_id, receiving_container_id, shipment_id, container_id,
            action, previous_status, new_status, description, metadata, performed_by
        ) VALUES (
            :id, :receiving_id, :receiving_container_id, :shipment_id, :container_id,
            :action, :previous_status, :new_status, :description, :metadata, :performed_by
        )
    ");

    foreach ($preparedContainers as $item) {
        $receiving_container_id = generateId();

        $insertContainer->execute([
            "id" => $receiving_container_id,
            "receiving_id" => $receiving_id,
            "shipment_id" => $shipment_id,
            "container_id" => $item["id"],
            "container_no" => $item["container_no"],
            "gate_pass_number" => $item["gate_pass_number"],
            "expected_seal_no" => $item["expected_seal_no"] !== "" ? $item["expected_seal_no"] : null,
            "actual_seal_no" => $item["actual_seal_no"] !== "" ? $item["actual_seal_no"] : null,
            "condition_status" => $item["condition"],
            "actual_weight" => $item["actual_weight"],
            "receiving_location" => $item["receiving_location"],
            "receiving_location_id" => $item["receiving_location_id"],
            "damage_proof_path" => $item["damage_proof"],
            "receiving_status" => $item["receiving_status"],
            "remarks" => $item["remarks"] !== "" ? $item["remarks"] : null,
            "received_by" => $performed_by
        ]);

        $updateShipmentContainer->execute([
            "status" => $item["receiving_status"],
            "container_id" => $item["id"],
            "shipment_id" => $shipment_id
        ]);

        $insertLog->execute([
            "id" => generateId(),
            "receiving_id" => $receiving_id,
            "receiving_container_id" => $receiving_container_id,
            "shipment_id" => $shipment_id,
            "container_id" => $item["id"],
            "action" => "CONTAINER_RECEIVED",
            "previous_status" => "PENDING",
            "new_status" => $item["receiving_status"],
            "description" => "Physical receiving inspection recorded for container " . $item["container_no"] . ".",
            "metadata" => json_encode([
                "container_no" => $item["container_no"],
                "expected_seal_no" => $item["expected_seal_no"],
                "actual_seal_no" => $item["actual_seal_no"],
                "condition_status" => $item["condition"],
                "actual_weight" => $item["actual_weight"],
                "receiving_location" => $item["receiving_location"],
                "receiving_location_id" => $item["receiving_location_id"],
                "damage_proof" => $item["damage_proof"],
                "remarks" => $item["remarks"]
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            "performed_by" => $performed_by
        ]);
    }

    $progressQuery = $conn->prepare("
        SELECT
            COUNT(*) AS total_containers,
            SUM(CASE WHEN receiving_status = 'RECEIVED' THEN 1 ELSE 0 END) AS received_containers,
            SUM(CASE WHEN receiving_status = 'DISCREPANCY' THEN 1 ELSE 0 END) AS discrepancy_containers
        FROM portal_receiving_containers
        WHERE shipment_id = :shipment_id
    ");
    $progressQuery->execute(["shipment_id" => $shipment_id]);
    $progress = $progressQuery->fetch(PDO::FETCH_ASSOC);

    $receivedCount = (int)($progress["received_containers"] ?? 0);
    $discrepancyCount = (int)($progress["discrepancy_containers"] ?? 0);
    $processedCount = $receivedCount + $discrepancyCount;

    if ($totalContainers > 0 && $processedCount >= $totalContainers) {
        $receivingStatus = $discrepancyCount > 0 ? "COMPLETED_WITH_DISCREPANCIES" : "COMPLETED";
        $completedAt = date("Y-m-d H:i:s");
    } elseif ($processedCount > 0) {
        $receivingStatus = "PARTIALLY_RECEIVED";
        $completedAt = null;
    } else {
        $receivingStatus = "IN_PROGRESS";
        $completedAt = null;
    }

    $updateReceiving = $conn->prepare("
        UPDATE portal_receiving
        SET status = :status,
            total_containers = :total_containers,
            received_containers = :received_containers,
            discrepancy_containers = :discrepancy_containers,
            completed_by = :completed_by,
            completed_at = :completed_at
        WHERE id = :receiving_id
    ");
    $updateReceiving->execute([
        "status" => $receivingStatus,
        "total_containers" => $totalContainers,
        "received_containers" => $receivedCount,
        "discrepancy_containers" => $discrepancyCount,
        "completed_by" => $completedAt !== null ? $performed_by : null,
        "completed_at" => $completedAt,
        "receiving_id" => $receiving_id
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => [
            "receiving_id" => $receiving_id,
            "receiving_reference" => $receiving_reference,
            "shipment_id" => $shipment_id,
            "shipment_reference" => $shipment["shipment_reference"],
            "status" => $receivingStatus,
            "containers_saved" => count($preparedContainers),
            "received_containers" => $receivedCount,
            "discrepancy_containers" => $discrepancyCount,
            "total_containers" => $totalContainers
        ],
        "code" => null
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code($e instanceof RuntimeException ? 422 : 500);

    echo json_encode([
        "error" => true,
        "data" => $e instanceof RuntimeException ? $e->getMessage() : "Could not save receiving.",
        "code" => $e instanceof PDOException ? $e->getCode() : null
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
