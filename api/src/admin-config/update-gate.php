<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        if ($_SERVER["REQUEST_METHOD"] !== "POST") {
            http_response_code(405);
            echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
            exit;
        }

        $slotDuration = filter_var($_POST["slot_duration"] ?? null, FILTER_VALIDATE_INT);
        $concurrentSlots = filter_var($_POST["concurrent_slots"] ?? null, FILTER_VALIDATE_INT);
        $advanceBookingWindowDays = filter_var($_POST["advance_booking_window_days"] ?? null, FILTER_VALIDATE_INT);
        $amendmentCutoffHours = filter_var($_POST["amendment_cutoff_hours"] ?? null, FILTER_VALIDATE_INT);

        if ($slotDuration === false || $slotDuration < 15 || $slotDuration > 480) throw new InvalidArgumentException("Slot duration must be between 15 and 480 minutes.");

        if ($concurrentSlots === false || $concurrentSlots < 1 || $concurrentSlots > 500) throw new InvalidArgumentException("Concurrent slots must be between 1 and 500.");
        if ($advanceBookingWindowDays === false || $advanceBookingWindowDays < 1 || $advanceBookingWindowDays > 365) throw new InvalidArgumentException("Advance booking window must be between 1 and 365 days.");
        if ($amendmentCutoffHours === false || $amendmentCutoffHours < 0 || $amendmentCutoffHours > 168) throw new InvalidArgumentException("Amendment cut-off must be between 0 and 168 hours.");
        
        $blackoutPeriods = $_POST["blackout_periods"] ?? [];
        $vehicleRequirements = $_POST["vehicle_requirements"] ?? [];

        if (is_string($blackoutPeriods))  $blackoutPeriods = json_decode($blackoutPeriods, true);
        if (is_string($vehicleRequirements)) $vehicleRequirements = json_decode($vehicleRequirements, true);
        if (!is_array($blackoutPeriods) || !is_array($vehicleRequirements)) throw new InvalidArgumentException("Blackout periods and vehicle requirements must be valid lists.");
        
        $validatedBlackouts = [];
        $seenDates = [];

        foreach ($blackoutPeriods as $blackout) {
            if (!is_array($blackout)) throw new InvalidArgumentException("Invalid blackout period.");
            $date = trim((string) ($blackout["date"] ?? ""));
            $reason = trim((string) ($blackout["reason"] ?? ""));

            $parsedDate = DateTimeImmutable::createFromFormat("!Y-m-d", $date);
            if (!$parsedDate || $parsedDate->format("Y-m-d") !== $date) throw new InvalidArgumentException("Every blackout period must have a valid date.");
            if ($reason === "" || mb_strlen($reason) > 255) throw new InvalidArgumentException("Every blackout period needs a reason of no more than 255 characters.");
            if (isset($seenDates[$date])) throw new InvalidArgumentException("Duplicate blackout date: " . $date);
            $seenDates[$date] = true;
            $validatedBlackouts[] = [ "id" => generateId(), "date" => $date, "reason" => $reason];
        }

        $validatedRequirements = [];
        $seenLabels = [];

        foreach ($vehicleRequirements as $requirement) {
            if (!is_array($requirement)) throw new InvalidArgumentException("Invalid vehicle requirement.");
            $label = trim((string) ($requirement["label"] ?? ""));

            if ($label === "" || mb_strlen($label) > 255) throw new InvalidArgumentException("Every vehicle requirement needs a label of no more than 255 characters.");
            $normalisedLabel = mb_strtolower($label);

            if (isset($seenLabels[$normalisedLabel])) throw new InvalidArgumentException("Duplicate vehicle requirement: " . $label);
            $seenLabels[$normalisedLabel] = true;
            $validatedRequirements[] = ["id" => generateId(), "label" => $label];
        }

        $actorId = (string) ($my_details->id ?? "");

        $conn->beginTransaction();

        $q = $conn->prepare("SELECT id, slot_duration, concurrent_slots, advance_booking_window_days, amendment_cutoff_hours FROM gate_configuration WHERE config_key = :config_key LIMIT 1 FOR UPDATE");
        $q->bindValue(":config_key", "default");
        $q->execute();
        $oldConfig = $q->fetch(PDO::FETCH_ASSOC);

        if (!$oldConfig) {
            $configurationId = generateId();
            $q = $conn->prepare("INSERT INTO gate_configuration (id, config_key, slot_duration, concurrent_slots, advance_booking_window_days, amendment_cutoff_hours) VALUES (:id, :config_key, :slot_duration, :concurrent_slots, :advance_booking_window_days, :amendment_cutoff_hours)");
            $q->bindValue(":id", $configurationId);
            $q->bindValue(":config_key", "default");
            $q->bindValue(":slot_duration", $slotDuration, PDO::PARAM_INT);
            $q->bindValue(":concurrent_slots", $concurrentSlots, PDO::PARAM_INT);
            $q->bindValue(":advance_booking_window_days", $advanceBookingWindowDays, PDO::PARAM_INT);
            $q->bindValue(":amendment_cutoff_hours", $amendmentCutoffHours, PDO::PARAM_INT);
            $q->execute();

            $oldConfig = [
                "id" => $configurationId,
                "slot_duration" => 60,
                "concurrent_slots" => 3,
                "advance_booking_window_days" => 7,
                "amendment_cutoff_hours" => 4
            ];
        }

        $configurationId = $oldConfig["id"];

        $q = $conn->prepare("UPDATE gate_configuration SET slot_duration = :slot_duration, concurrent_slots = :concurrent_slots, advance_booking_window_days = :advance_booking_window_days, amendment_cutoff_hours = :amendment_cutoff_hours WHERE id = :id");
        $q->bindValue(":slot_duration", $slotDuration, PDO::PARAM_INT);
        $q->bindValue(":concurrent_slots", $concurrentSlots, PDO::PARAM_INT);
        $q->bindValue(":advance_booking_window_days", $advanceBookingWindowDays, PDO::PARAM_INT);
        $q->bindValue(":amendment_cutoff_hours", $amendmentCutoffHours, PDO::PARAM_INT);
        $q->bindValue(":id", $configurationId);
        $q->execute();

        $q = $conn->prepare("DELETE FROM gate_blackout_periods WHERE gate_configuration_id = :configuration_id");
        $q->bindValue(":configuration_id", $configurationId);
        $q->execute();

        $q = $conn->prepare("INSERT INTO gate_blackout_periods (id, gate_configuration_id, blackout_date, reason) VALUES (:id, :configuration_id, :blackout_date, :reason)");

        foreach ($validatedBlackouts as $blackout) {
            $q->bindValue(":id", $blackout["id"]);
            $q->bindValue(":configuration_id", $configurationId);
            $q->bindValue(":blackout_date", $blackout["date"]);
            $q->bindValue(":reason", $blackout["reason"]);
            $q->execute();
        }

        $q = $conn->prepare("DELETE FROM gate_vehicle_requirements WHERE gate_configuration_id = :configuration_id");
        $q->bindValue(":configuration_id", $configurationId);
        $q->execute();

        $q = $conn->prepare("INSERT INTO gate_vehicle_requirements (id, gate_configuration_id, label) VALUES (:id, :configuration_id, :label)");

        foreach ($validatedRequirements as $requirement) {
            $q->bindValue(":id", $requirement["id"]);
            $q->bindValue(":configuration_id", $configurationId);
            $q->bindValue(":label", $requirement["label"]);
            $q->execute();
        }

        $newConfig = [
            "slot_duration" => $slotDuration,
            "concurrent_slots" => $concurrentSlots,
            "advance_booking_window_days" => $advanceBookingWindowDays,
            "amendment_cutoff_hours" => $amendmentCutoffHours,
            "blackout_periods" => $validatedBlackouts,
            "vehicle_requirements" => $validatedRequirements
        ];

        $q = $conn->prepare("INSERT INTO gate_configuration_audit (id, configuration_id, actor_id, action, old_values, new_values) VALUES (:id, :configuration_id, :actor_id, :action, :old_values, :new_values)");
        $q->bindValue(":id", generateId());
        $q->bindValue(":configuration_id", $configurationId);
        $q->bindValue(":actor_id", $actorId);
        $q->bindValue(":action", "UPDATE");
        $q->bindValue(":old_values", json_encode($oldConfig));
        $q->bindValue(":new_values", json_encode($newConfig));
        $q->execute();

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Gate and booking configuration saved successfully.",
            "code" => $newConfig
        ]);
    } catch (InvalidArgumentException $e) {
        if (isset($conn) && $conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => $e->getMessage(),
            "code" => null
        ]);
    } catch (Throwable $e) {
        if (isset($conn) && $conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(500);
        echo json_encode([
            "error" => true,
            "data" => "Could not save gate and booking configuration.",
            "code" => $e->getMessage()
        ]);
    }