<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $q = $conn->prepare("SELECT id, slot_duration, concurrent_slots, advance_booking_window_days, amendment_cutoff_hours FROM gate_configuration WHERE config_key = :config_key LIMIT 1");
        $q->bindValue(":config_key", "default");
        $q->execute();
        $config = $q->fetch(PDO::FETCH_ASSOC);

        if (!$config) {
            $id = generateId();
            $q = $conn->prepare("INSERT INTO gate_configuration (id, config_key, slot_duration, concurrent_slots, advance_booking_window_days, amendment_cutoff_hours) VALUES (:id, :config_key, :slot_duration, :concurrent_slots, :advance_booking_window_days, :amendment_cutoff_hours)");
            $q->bindValue(":id", $id);
            $q->bindValue(":config_key", "default");
            $q->bindValue(":slot_duration", 60, PDO::PARAM_INT);
            $q->bindValue(":concurrent_slots", 3, PDO::PARAM_INT);
            $q->bindValue(":advance_booking_window_days", 7, PDO::PARAM_INT);
            $q->bindValue(":amendment_cutoff_hours", 4, PDO::PARAM_INT);
            $q->execute();

            $q = $conn->prepare("SELECT id, slot_duration, concurrent_slots, advance_booking_window_days, amendment_cutoff_hours FROM gate_configuration WHERE id = :id LIMIT 1");
            $q->bindValue(":id", $id);
            $q->execute();
            $config = $q->fetch(PDO::FETCH_ASSOC);
        }

        $q = $conn->prepare("SELECT id, blackout_date AS date, reason FROM gate_blackout_periods WHERE gate_configuration_id = :configuration_id ORDER BY blackout_date ASC");
        $q->bindValue(":configuration_id", $config["id"]);
        $q->execute();
        $config["blackout_periods"] = $q->fetchAll(PDO::FETCH_ASSOC);

        $q = $conn->prepare("SELECT id, label FROM gate_vehicle_requirements WHERE gate_configuration_id = :configuration_id ORDER BY created_at ASC");
        $q->bindValue(":configuration_id", $config["id"]);
        $q->execute();
        $config["vehicle_requirements"] = $q->fetchAll(PDO::FETCH_ASSOC);

        $config["slot_duration"] = (int) $config["slot_duration"];
        $config["concurrent_slots"] = (int) $config["concurrent_slots"];
        $config["advance_booking_window_days"] = (int) $config["advance_booking_window_days"];
        $config["amendment_cutoff_hours"] = (int) $config["amendment_cutoff_hours"];

        echo json_encode([
            "error" => false,
            "data" => "Gate and booking configuration loaded successfully.",
            "code" => $config
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            "error" => true,
            "data" => "Could not load gate and booking configuration.",
            "code" => null
        ]);
    }