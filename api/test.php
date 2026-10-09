<?php
require_once __DIR__ . '/include/conn.php';

try {
    $conn->beginTransaction();

    $q = $conn->prepare("INSERT INTO gate_configuration (id, config_key, slot_duration, concurrent_slots, advance_booking_window_days, amendment_cutoff_hours) VALUES (:id, :config_key, :slot_duration, :concurrent_slots, :advance_booking_window_days, :amendment_cutoff_hours) ON DUPLICATE KEY UPDATE slot_duration = VALUES(slot_duration), concurrent_slots = VALUES(concurrent_slots), advance_booking_window_days = VALUES(advance_booking_window_days), amendment_cutoff_hours = VALUES(amendment_cutoff_hours)");
    $q->bindValue(":id", generateId(), PDO::PARAM_STR);
    $q->bindValue(":config_key", "default", PDO::PARAM_STR);
    $q->bindValue(":slot_duration", 60, PDO::PARAM_INT);
    $q->bindValue(":concurrent_slots", 3, PDO::PARAM_INT);
    $q->bindValue(":advance_booking_window_days", 7, PDO::PARAM_INT);
    $q->bindValue(":amendment_cutoff_hours", 4, PDO::PARAM_INT);
    $q->execute();

    $q = $conn->prepare("SELECT id FROM gate_configuration WHERE config_key = :config_key LIMIT 1");
    $q->bindValue(":config_key", "default", PDO::PARAM_STR);
    $q->execute();
    $configurationId = $q->fetchColumn();

    $blackouts = [
        [
            "date" => date("Y") . "-12-25",
            "reason" => "Christmas Day"
        ],
        [
            "date" => date("Y") . "-01-01",
            "reason" => "New Year's Day"
        ]
    ];

    foreach ($blackouts as $item) {
        $q = $conn->prepare("INSERT INTO gate_blackout_periods (id, gate_configuration_id, blackout_date, reason) VALUES (:id, :configuration_id, :blackout_date, :reason) ON DUPLICATE KEY UPDATE reason = VALUES(reason)");
        $q->bindValue(":id", generateId(), PDO::PARAM_STR);
        $q->bindValue(":configuration_id", $configurationId, PDO::PARAM_STR);
        $q->bindValue(":blackout_date", $item["date"], PDO::PARAM_STR);
        $q->bindValue(":reason", $item["reason"], PDO::PARAM_STR);
        $q->execute();
    }

    $requirements = [
        "Valid vehicle registration",
        "Valid vehicle insurance certificate",
        "Valid roadworthiness certificate",
        "Valid driver's licence",
        "Approved cargo documentation",
        "Valid terminal booking confirmation"
    ];

    foreach ($requirements as $label) {
        $q = $conn->prepare("INSERT INTO gate_vehicle_requirements (id, gate_configuration_id, label) VALUES (:id, :configuration_id, :label) ON DUPLICATE KEY UPDATE label = VALUES(label)");
        $q->bindValue(":id", generateId(), PDO::PARAM_STR);
        $q->bindValue(":configuration_id", $configurationId, PDO::PARAM_STR);
        $q->bindValue(":label", $label, PDO::PARAM_STR);
        $q->execute();
    }

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => "Gate and booking configuration saved successfully",
        "code" => [
            "configuration_id" => $configurationId,
            "slot_duration" => 60,
            "concurrent_slots" => 3,
            "advance_booking_window_days" => 7,
            "amendment_cutoff_hours" => 4,
            "blackout_periods_saved" => count($blackouts),
            "vehicle_requirements_saved" => count($requirements)
        ]
    ]);
} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Unable to save gate and booking configuration",
        "code" => null
    ]);
}