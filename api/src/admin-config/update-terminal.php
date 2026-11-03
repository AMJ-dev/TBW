<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed",
        "code" => null
    ]);
    exit;
}

try {
    $terminalName = trim($_POST["terminal_name"] ?? "");
    $terminalCode = trim($_POST["terminal_code"] ?? "");
    $operatingHours = trim($_POST["operating_hours"] ?? "");
    $changeReason = trim($_POST["change_reason"] ?? "");

    if ($terminalName === "" || $terminalCode === "") {
        throw new InvalidArgumentException("Terminal name and terminal code are required.");
    }

    if (
        strlen($terminalName) > 255 ||
        strlen($terminalCode) > 80 ||
        strlen($operatingHours) > 100 ||
        strlen($changeReason) > 500
    ) {
        throw new InvalidArgumentException("One or more fields exceed the allowed length.");
    }

    $holds = $_POST["hold_reasons"] ?? [];
    $categories = $_POST["cargo_categories"] ?? [];
    $packagingTypes = $_POST["packaging_types"] ?? [];
    $shipmentTypes = $_POST["shipment_types"] ?? [];

    $groups = [
        "hold_reasons" => &$holds,
        "cargo_categories" => &$categories,
        "packaging_types" => &$packagingTypes,
        "shipment_types" => &$shipmentTypes
    ];

    foreach ($groups as $key => &$value) {
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
                throw new InvalidArgumentException("Invalid " . str_replace("_", " ", $key) . " data.");
            }
            $value = $decoded;
        }

        if (!is_array($value)) {
            throw new InvalidArgumentException("Invalid " . str_replace("_", " ", $key) . " data.");
        }
    }

    unset($value, $groups);

    $normaliseGroup = function ($items, $groupName) {
        $result = [];
        $seen = [];
        $ids = [];

        foreach ($items as $item) {
            if (!is_array($item)) {
                throw new InvalidArgumentException("Invalid entry in " . $groupName . ".");
            }

            $label = trim((string) ($item["label"] ?? ""));

            if ($label === "" || strlen($label) > 255) {
                throw new InvalidArgumentException("Every entry in " . $groupName . " needs a valid label.");
            }

            $labelKey = strtolower($label);

            if (isset($seen[$labelKey])) {
                throw new InvalidArgumentException("Duplicate entry in " . $groupName . ": " . $label);
            }

            $seen[$labelKey] = true;
            $id = trim((string) ($item["id"] ?? ""));

            if (
                !preg_match(
                    '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
                    $id
                ) ||
                isset($ids[$id])
            ) {
                $id = generateId();
            }

            $ids[$id] = true;
            $result[] = [
                "id" => $id,
                "label" => $label
            ];
        }

        return $result;
    };

    $holds = $normaliseGroup($holds, "hold reasons");
    $categories = $normaliseGroup($categories, "cargo categories");
    $packagingTypes = $normaliseGroup($packagingTypes, "packaging types");
    $shipmentTypes = $normaliseGroup($shipmentTypes, "shipment types");

    $conn->beginTransaction();

    $q = $conn->prepare("
        SELECT terminal_name, terminal_code, operating_hours
        FROM terminal_configuration
        WHERE id = 1
        FOR UPDATE
    ");
    $q->execute();
    $beforeTerminal = $q->fetch(PDO::FETCH_ASSOC);

    $beforeData = json_encode([
        "terminal" => $beforeTerminal,
        "hold_reasons" => $conn->query("SELECT * FROM terminal_hold_reasons ORDER BY label")->fetchAll(PDO::FETCH_ASSOC),
        "cargo_categories" => $conn->query("SELECT * FROM terminal_cargo_categories ORDER BY label")->fetchAll(PDO::FETCH_ASSOC),
        "packaging_types" => $conn->query("SELECT * FROM terminal_packaging_types ORDER BY label")->fetchAll(PDO::FETCH_ASSOC),
        "shipment_types" => $conn->query("SELECT * FROM terminal_shipment_types ORDER BY label")->fetchAll(PDO::FETCH_ASSOC),
        "change_reason" => $changeReason
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $q = $conn->prepare("
        INSERT INTO terminal_configuration (
            id, terminal_name, terminal_code, operating_hours
        ) VALUES (
            1, :name, :code, :hours
        )
        ON DUPLICATE KEY UPDATE
            terminal_name = VALUES(terminal_name),
            terminal_code = VALUES(terminal_code),
            operating_hours = VALUES(operating_hours)
    ");
    $q->bindValue(":name", $terminalName, PDO::PARAM_STR);
    $q->bindValue(":code", $terminalCode, PDO::PARAM_STR);
    $q->bindValue(":hours", $operatingHours, PDO::PARAM_STR);
    $q->execute();

    foreach ([
        ["table" => "terminal_hold_reasons", "items" => $holds],
        ["table" => "terminal_cargo_categories", "items" => $categories],
        ["table" => "terminal_packaging_types", "items" => $packagingTypes],
        ["table" => "terminal_shipment_types", "items" => $shipmentTypes]
    ] as $group) {
        $table = $group["table"];

        $conn->exec("UPDATE `$table` SET is_active = 0");

        $find = $conn->prepare("
            SELECT id
            FROM `$table`
            WHERE id = :id OR label = :label
            LIMIT 1
        ");

        $insert = $conn->prepare("
            INSERT INTO `$table` (id, label, is_active)
            VALUES (:id, :label, 1)
        ");

        $update = $conn->prepare("
            UPDATE `$table`
            SET label = :label, is_active = 1
            WHERE id = :id
        ");

        foreach ($group["items"] as $item) {
            $find->bindValue(":id", $item["id"], PDO::PARAM_STR);
            $find->bindValue(":label", $item["label"], PDO::PARAM_STR);
            $find->execute();
            $existingId = $find->fetchColumn();

            if ($existingId !== false) {
                $update->bindValue(":id", $existingId, PDO::PARAM_STR);
                $update->bindValue(":label", $item["label"], PDO::PARAM_STR);
                $update->execute();
            } else {
                $insert->bindValue(":id", $item["id"], PDO::PARAM_STR);
                $insert->bindValue(":label", $item["label"], PDO::PARAM_STR);
                $insert->execute();
            }
        }
    }

    $q = $conn->query("
        SELECT terminal_name, terminal_code, operating_hours
        FROM terminal_configuration
        WHERE id = 1
    ");
    $afterTerminal = $q->fetch(PDO::FETCH_ASSOC);

    $afterData = json_encode([
        "terminal" => $afterTerminal,
        "hold_reasons" => $conn->query("SELECT * FROM terminal_hold_reasons ORDER BY label")->fetchAll(PDO::FETCH_ASSOC),
        "cargo_categories" => $conn->query("SELECT * FROM terminal_cargo_categories ORDER BY label")->fetchAll(PDO::FETCH_ASSOC),
        "packaging_types" => $conn->query("SELECT * FROM terminal_packaging_types ORDER BY label")->fetchAll(PDO::FETCH_ASSOC),
        "shipment_types" => $conn->query("SELECT * FROM terminal_shipment_types ORDER BY label")->fetchAll(PDO::FETCH_ASSOC),
        "change_reason" => $changeReason
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $q = $conn->prepare("
        INSERT INTO terminal_configuration_audit (
            id,
            actor_id,
            action,
            before_data,
            after_data,
            ip_address,
            user_agent
        ) VALUES (
            :id,
            :actor_id,
            :action,
            :before_data,
            :after_data,
            :ip_address,
            :user_agent
        )
    ");

    $q->bindValue(":id", generateId(), PDO::PARAM_STR);
    $q->bindValue(":actor_id", (string) $my_details->id, PDO::PARAM_STR);
    $q->bindValue(":action", "terminal_configuration_updated", PDO::PARAM_STR);
    $q->bindValue(":before_data", $beforeData, PDO::PARAM_STR);
    $q->bindValue(":after_data", $afterData, PDO::PARAM_STR);

    $ipAddress = $_SERVER["REMOTE_ADDR"] ?? null;

    if ($ipAddress === null) {
        $q->bindValue(":ip_address", null, PDO::PARAM_NULL);
    } else {
        $q->bindValue(":ip_address", $ipAddress, PDO::PARAM_STR);
    }

    $q->bindValue(":user_agent", substr($_SERVER["HTTP_USER_AGENT"] ?? "", 0, 500), PDO::PARAM_STR);
    $q->execute();

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Terminal configuration updated successfully",
        "code" => [
            "terminal_name" => $terminalName,
            "terminal_code" => $terminalCode,
            "operating_hours" => $operatingHours,
            "hold_reasons" => $holds,
            "cargo_categories" => $categories,
            "packaging_types" => $packagingTypes,
            "shipment_types" => $shipmentTypes
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (InvalidArgumentException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode([
        "error" => true,
        "data" => $e->getMessage(),
        "code" => null
    ]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode([
        "error" => true,
        "data" => $e->getMessage(),
        "code" => null
    ]);
}
