<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

$containerRates = $_POST["container_rates"] ?? [];
$freeDays = $_POST["free_days"] ?? null;
$chargingUnit = $_POST["charging_unit"] ?? null;
$effectiveFrom = trim((string)($_POST["effective_from"] ?? ""));
$overstayThreshold = $_POST["overstay_threshold_days"] ?? null;
$overstayEscalation = $_POST["overstay_escalation_days"] ?? null;
$changeReason = trim((string)($_POST["change_reason"] ?? ""));
$tiers = $_POST["escalation_tiers"] ?? [];
$pauseOnHold = $_POST["pause_on_hold"] ?? false;
$pauseOnExamination = $_POST["pause_on_examination"] ?? false;

$fail = static function (int $status, string $message): void {
    echo json_encode([
        "error" => true,
        "data" => $message,
        "code" => null
    ]);
    exit;
};

if (is_string($containerRates)) {
    $containerRates = json_decode($containerRates, true);
}

if (!is_array($containerRates) || count($containerRates) === 0) {
    $fail(422, "At least one container size and storage rate is required.");
}

$normalisedRates = [];
$seenSizes = [];

foreach ($containerRates as $rate) {
    if (!is_array($rate)) {
        $fail(422, "Invalid container storage rate.");
    }

    $size = trim((string)($rate["size"] ?? $rate["container_size"] ?? ""));
    $amount = $rate["base_rate"] ?? $rate["baseRate"] ?? null;
    $sizeKey = mb_strtolower($size);

    if ($size === "" || mb_strlen($size) > 50) {
        $fail(422, "Every container rate must have a valid container size.");
    }

    if (isset($seenSizes[$sizeKey])) {
        $fail(422, "Container sizes must not be duplicated.");
    }

    if (!is_numeric($amount) || (float)$amount <= 0 || !is_finite((float)$amount)) {
        $fail(422, "Every container size must have a storage rate greater than zero.");
    }

    $seenSizes[$sizeKey] = true;

    $normalisedRates[] = [
        "size" => $size,
        "base_rate" => round((float)$amount, 2)
    ];
}

$legacyBaseRate = (float)$normalisedRates[0]["base_rate"];

if (filter_var($freeDays, FILTER_VALIDATE_INT) === false || (int)$freeDays < 0 || (int)$freeDays > 3650) {
    $fail(422, "Free storage days must be an integer between 0 and 3650.");
}

if (!in_array($chargingUnit, ["day", "week", "month"], true)) {
    $fail(422, "Invalid storage charging unit.");
}

$date = DateTimeImmutable::createFromFormat("!Y-m-d", $effectiveFrom);

if (!$date || $date->format("Y-m-d") !== $effectiveFrom) {
    $fail(422, "A valid effective date is required in YYYY-MM-DD format.");
}

if (filter_var($overstayThreshold, FILTER_VALIDATE_INT) === false || (int)$overstayThreshold < 1 || (int)$overstayThreshold > 3650) {
    $fail(422, "Overstay threshold must be between 1 and 3650 days.");
}

if (filter_var($overstayEscalation, FILTER_VALIDATE_INT) === false || (int)$overstayEscalation <= (int)$overstayThreshold || (int)$overstayEscalation > 3650) {
    $fail(422, "Overstay escalation must be later than the overstay threshold.");
}

if ($changeReason === "" || mb_strlen($changeReason) > 500) {
    $fail(422, "A change reason is required and cannot exceed 500 characters.");
}

if (is_string($tiers)) {
    $tiers = json_decode($tiers, true);
}

if (!is_array($tiers)) {
    $fail(422, "Escalation tiers must be a valid array.");
}

$normalisedTiers = [];

foreach ($tiers as $tier) {
    if (!is_array($tier)) {
        $fail(422, "Invalid escalation tier.");
    }

    $fromDay = $tier["from_day"] ?? null;
    $multiplier = $tier["rate_multiplier"] ?? null;

    if (filter_var($fromDay, FILTER_VALIDATE_INT) === false || (int)$fromDay <= (int)$freeDays || (int)$fromDay > 3650) {
        $fail(422, "Each escalation tier must start after the free period.");
    }

    if (!is_numeric($multiplier) || (float)$multiplier <= 0 || (float)$multiplier > 1000 || !is_finite((float)$multiplier)) {
        $fail(422, "Each escalation multiplier must be greater than zero and no more than 1000.");
    }

    $normalisedTiers[] = [
        "from_day" => (int)$fromDay,
        "rate_multiplier" => (float)$multiplier
    ];
}

usort($normalisedTiers, static fn(array $a, array $b): int => $a["from_day"] <=> $b["from_day"]);

$lastDay = null;

foreach ($normalisedTiers as $tier) {
    if ($lastDay !== null && $tier["from_day"] <= $lastDay) {
        $fail(422, "Escalation tier start days must be unique and increasing.");
    }

    $lastDay = $tier["from_day"];
}

$toBool = static function ($value): int {
    if (is_bool($value)) {
        return $value ? 1 : 0;
    }

    return in_array(strtolower(trim((string)$value)), ["1", "true", "yes", "on"], true) ? 1 : 0;
};

$pauseOnHold = $toBool($pauseOnHold);
$pauseOnExamination = $toBool($pauseOnExamination);

$newValues = [
    "container_rates" => $normalisedRates,
    "free_days" => (int)$freeDays,
    "charging_unit" => $chargingUnit,
    "currency_code" => "NGN",
    "effective_from" => $effectiveFrom,
    "overstay_threshold_days" => (int)$overstayThreshold,
    "overstay_escalation_days" => (int)$overstayEscalation,
    "pause_on_hold" => (bool)$pauseOnHold,
    "pause_on_examination" => (bool)$pauseOnExamination,
    "escalation_tiers" => $normalisedTiers,
    "change_reason" => $changeReason
];

try {
    $conn->beginTransaction();

    $sameDateQuery = $conn->prepare("
        SELECT *
        FROM storage_config_versions
        WHERE effective_from = :effective_from
        ORDER BY id DESC
        LIMIT 1
        FOR UPDATE
    ");
    $sameDateQuery->bindValue(":effective_from", $effectiveFrom, PDO::PARAM_STR);
    $sameDateQuery->execute();
    $sameDateConfig = $sameDateQuery->fetch(PDO::FETCH_ASSOC);

    $previousConfig = $sameDateConfig;

    if (!$previousConfig) {
        $previousQuery = $conn->prepare("
            SELECT *
            FROM storage_config_versions
            ORDER BY effective_from DESC, id DESC
            LIMIT 1
            FOR UPDATE
        ");
        $previousQuery->execute();
        $previousConfig = $previousQuery->fetch(PDO::FETCH_ASSOC);
    }

    $previousValues = null;

    if ($previousConfig) {
        $previousTierQuery = $conn->prepare("
            SELECT from_day, rate_multiplier
            FROM storage_escalation_tiers
            WHERE config_id = :config_id
            ORDER BY from_day ASC
        ");
        $previousTierQuery->bindValue(":config_id", $previousConfig["id"], PDO::PARAM_INT);
        $previousTierQuery->execute();

        $previousRateQuery = $conn->prepare("
            SELECT container_size, base_rate
            FROM storage_container_rates
            WHERE config_id = :config_id
            ORDER BY container_size ASC
        ");
        $previousRateQuery->bindValue(":config_id", $previousConfig["id"], PDO::PARAM_INT);
        $previousRateQuery->execute();

        $previousValues = [
            "container_rates" => array_map(
                static function (array $rate): array {
                    return [
                        "size" => $rate["container_size"],
                        "base_rate" => (float)$rate["base_rate"]
                    ];
                },
                $previousRateQuery->fetchAll(PDO::FETCH_ASSOC)
            ),
            "free_days" => (int)$previousConfig["free_days"],
            "charging_unit" => $previousConfig["charging_unit"],
            "currency_code" => $previousConfig["currency_code"],
            "effective_from" => $previousConfig["effective_from"],
            "overstay_threshold_days" => (int)$previousConfig["overstay_threshold_days"],
            "overstay_escalation_days" => (int)$previousConfig["overstay_escalation_days"],
            "pause_on_hold" => (bool)$previousConfig["pause_on_hold"],
            "pause_on_examination" => (bool)$previousConfig["pause_on_examination"],
            "escalation_tiers" => array_map(
                static function (array $tier): array {
                    return [
                        "from_day" => (int)$tier["from_day"],
                        "rate_multiplier" => (float)$tier["rate_multiplier"]
                    ];
                },
                $previousTierQuery->fetchAll(PDO::FETCH_ASSOC)
            )
        ];
    }

    if ($sameDateConfig) {
        $configId = (int)$sameDateConfig["id"];

        $save = $conn->prepare("
            UPDATE storage_config_versions
            SET base_rate = :base_rate,
                free_days = :free_days,
                charging_unit = :charging_unit,
                minimum_charge = 0,
                currency_code = :currency_code,
                overstay_threshold_days = :overstay_threshold_days,
                overstay_escalation_days = :overstay_escalation_days,
                pause_on_hold = :pause_on_hold,
                pause_on_examination = :pause_on_examination,
                pause_on_customs_hold = 0,
                change_reason = :change_reason,
                created_by = :created_by
            WHERE id = :id
        ");
        $save->bindValue(":id", $configId, PDO::PARAM_INT);
    } else {
        $save = $conn->prepare("
            INSERT INTO storage_config_versions (
                base_rate, free_days, charging_unit, minimum_charge,
                currency_code, effective_from, overstay_threshold_days,
                overstay_escalation_days, pause_on_hold, pause_on_examination,
                pause_on_customs_hold, change_reason, created_by
            ) VALUES (
                :base_rate, :free_days, :charging_unit, 0,
                :currency_code, :effective_from, :overstay_threshold_days,
                :overstay_escalation_days, :pause_on_hold, :pause_on_examination,
                0, :change_reason, :created_by
            )
        ");
        $save->bindValue(":effective_from", $effectiveFrom, PDO::PARAM_STR);
    }

    $save->bindValue(":base_rate", $legacyBaseRate);
    $save->bindValue(":free_days", (int)$freeDays, PDO::PARAM_INT);
    $save->bindValue(":charging_unit", $chargingUnit, PDO::PARAM_STR);
    $save->bindValue(":currency_code", "NGN", PDO::PARAM_STR);
    $save->bindValue(":overstay_threshold_days", (int)$overstayThreshold, PDO::PARAM_INT);
    $save->bindValue(":overstay_escalation_days", (int)$overstayEscalation, PDO::PARAM_INT);
    $save->bindValue(":pause_on_hold", $pauseOnHold, PDO::PARAM_INT);
    $save->bindValue(":pause_on_examination", $pauseOnExamination, PDO::PARAM_INT);
    $save->bindValue(":change_reason", $changeReason, PDO::PARAM_STR);
    $save->bindValue(":created_by", (string)$my_details->id, PDO::PARAM_STR);
    $save->execute();

    if (!$sameDateConfig) {
        $configId = (int)$conn->lastInsertId();
    }

    $deleteRates = $conn->prepare("DELETE FROM storage_container_rates WHERE config_id = :config_id");
    $deleteRates->bindValue(":config_id", $configId, PDO::PARAM_INT);
    $deleteRates->execute();

    $rateInsert = $conn->prepare("
        INSERT INTO storage_container_rates (config_id, container_size, base_rate)
        VALUES (:config_id, :container_size, :base_rate)
    ");

    foreach ($normalisedRates as $rate) {
        $rateInsert->execute([
            ":config_id" => $configId,
            ":container_size" => $rate["size"],
            ":base_rate" => $rate["base_rate"]
        ]);
    }

    $deleteTiers = $conn->prepare("DELETE FROM storage_escalation_tiers WHERE config_id = :config_id");
    $deleteTiers->bindValue(":config_id", $configId, PDO::PARAM_INT);
    $deleteTiers->execute();

    $tierInsert = $conn->prepare("
        INSERT INTO storage_escalation_tiers (config_id, from_day, rate_multiplier)
        VALUES (:config_id, :from_day, :rate_multiplier)
    ");

    foreach ($normalisedTiers as $tier) {
        $tierInsert->execute([
            ":config_id" => $configId,
            ":from_day" => $tier["from_day"],
            ":rate_multiplier" => $tier["rate_multiplier"]
        ]);
    }

    $audit = $conn->prepare("
        INSERT INTO activity_logs (
            id,
            actor_id,
            category,
            action,
            entity_type,
            entity_id,
            description,
            reason,
            old_values,
            new_values,
            metadata,
            severity,
            created_at
        ) VALUES (
            :id,
            :actor_id,
            :category,
            :action,
            :entity_type,
            :entity_id,
            :description,
            :reason,
            :old_values,
            :new_values,
            :metadata,
            :severity,
            CURRENT_TIMESTAMP
        )
    ");

    $previousJson = $previousValues === null
        ? null
        : json_encode($previousValues, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $newJson = json_encode($newValues, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($newJson === false || ($previousValues !== null && $previousJson === false)) {
        throw new RuntimeException("Unable to encode configuration audit data.");
    }

    $audit->execute([
        ":id" => generateId(),
        ":actor_id" => (string)$my_details->id,
        ":category" => "CONFIGURATION",
        ":action" => "STORAGE_CONFIGURATION_UPDATED",
        ":entity_type" => "STORAGE_CONFIGURATION",
        ":entity_id" => (string)$configId,
        ":description" => "Storage configuration updated.",
        ":reason" => $changeReason,
        ":old_values" => $previousJson,
        ":new_values" => $newJson,
        ":metadata" => json_encode([
            "source_table" => "storage_config_audit",
            "config_id" => $configId
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
        ":severity" => "INFO"
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Storage configuration saved successfully. Audit record created.",
        "code" => [
            "id" => $configId,
            "effective_from" => $effectiveFrom,
            "container_rates" => $normalisedRates,
            "base_rate" => $legacyBaseRate,
            "free_days" => (int)$freeDays,
            "charging_unit" => $chargingUnit,
            "currency_code" => "NGN",
            "overstay_threshold_days" => (int)$overstayThreshold,
            "overstay_escalation_days" => (int)$overstayEscalation,
            "pause_on_hold" => (bool)$pauseOnHold,
            "pause_on_examination" => (bool)$pauseOnExamination,
            "escalation_tiers" => $normalisedTiers
        ]
    ]);
} catch (PDOException $e) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log("Storage configuration SAVE failed: " . $e->getMessage());

    if ($e->getCode() === "23000") {
        echo json_encode([
            "error" => true,
            "data" => "A configuration conflicts with an existing database record. Please refresh and try again.",
            "code" => null
        ]);
        exit;
    }

    echo json_encode([
        "error" => true,
        "data" => "Could not save storage configuration.",
        "code" => null
    ]);
} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log("Storage configuration SAVE failed: " . $e->getMessage());

    echo json_encode([
        "error" => true,
        "data" => "Could not save storage configuration.",
        "code" => null
    ]);
}
