<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $actorId = $my_details->id;

        $maintenanceMode = filter_var($_POST["maintenance_mode"] ?? null, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $emergencyMaintenance = filter_var($_POST["emergency_maintenance"] ?? null, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $allowStaffAccess = filter_var($_POST["allow_staff_access"] ?? null, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $noticeBannerEnabled = filter_var($_POST["notice_banner_enabled"] ?? null, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        if (
            $maintenanceMode === null ||
            $emergencyMaintenance === null ||
            $allowStaffAccess === null ||
            $noticeBannerEnabled === null
        ) {
            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "Invalid boolean configuration value",
                "code" => "INVALID_CONFIGURATION"
            ]);
            exit;
        }

        $message = trim($_POST["message"] ?? "");
        $scheduledStart = trim($_POST["scheduled_start"] ?? "");
        $duration = filter_var($_POST["scheduled_duration_minutes"] ?? null, FILTER_VALIDATE_INT);
        $notifyHours = filter_var($_POST["notify_users_ahead_hours"] ?? null, FILTER_VALIDATE_INT);
        $changeReason = trim($_POST["change_reason"] ?? "");

        $notices = $_POST["notices"] ?? [];

        if (is_string($notices)) {
            $notices = json_decode($notices, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode([
                    "error" => true,
                    "data" => "Invalid notices JSON",
                    "code" => "INVALID_NOTICES_JSON"
                ]);
                exit;
            }
        }

        if (!is_array($notices)) {
            http_response_code(400);
            echo json_encode([
                "error" => true,
                "data" => "Notices must be an array",
                "code" => "INVALID_NOTICES"
            ]);
            exit;
        }

        if ($maintenanceMode && $message === "") {
            throw new Exception("Maintenance mode requires a message.");
        }

        if (strlen($message) > 1000) {
            throw new Exception("Maintenance message cannot exceed 1000 characters.");
        }

        if ($duration === false || $duration < 1 || $duration > 10080) {
            throw new Exception("Duration must be between 1 and 10,080 minutes.");
        }

        if ($notifyHours === false || $notifyHours < 0 || $notifyHours > 720) {
            throw new Exception("Advance notice must be between 0 and 720 hours.");
        }

        if ($emergencyMaintenance && !$maintenanceMode) {
            throw new Exception("Enable maintenance mode for emergency maintenance.");
        }

        if ($emergencyMaintenance && $scheduledStart !== "") {
            throw new Exception("Emergency maintenance cannot have a scheduled start time.");
        }

        if ($scheduledStart !== "") {
            $start = DateTime::createFromFormat("Y-m-d\TH:i", $scheduledStart);

            if (!$start || $start->format("Y-m-d\TH:i") !== $scheduledStart) {
                throw new Exception("Invalid scheduled start date and time.");
            }

            if ($start->getTimestamp() <= time()) {
                throw new Exception("Scheduled maintenance must start in the future.");
            }

            $scheduledStart = $start->format("Y-m-d H:i:s");
        } else {
            $scheduledStart = null;
        }

        if (strlen($changeReason) > 500) {
            throw new Exception("Change reason cannot exceed 500 characters.");
        }

        if ($changeReason === "") {
            throw new Exception("A reason for the change is required.");
        }

        foreach ($notices as $notice) {
            if (!is_array($notice)) {
                throw new Exception("Each notice must be an object.");
            }

            $noticeMessage = trim($notice["message"] ?? "");
            $severity = $notice["severity"] ?? "info";
            $audience = $notice["audience"] ?? "all";
            $active = filter_var($notice["active"] ?? true, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

            if ($noticeMessage === "" || strlen($noticeMessage) > 1000) {
                throw new Exception("Each notice must have a message of 1–1000 characters.");
            }

            if (!in_array($severity, ["info", "warning", "critical"], true)) {
                throw new Exception("Invalid notice severity.");
            }

            if (!in_array($audience, ["public", "portal", "all"], true)) {
                throw new Exception("Invalid notice audience.");
            }

            if ($active === null) {
                throw new Exception("Invalid notice active value.");
            }

            $startsAt = trim($notice["starts_at"] ?? "");
            $endsAt = trim($notice["ends_at"] ?? "");

            if ($startsAt !== "") {
                $startDate = DateTime::createFromFormat("Y-m-d\TH:i", $startsAt);

                if (!$startDate || $startDate->format("Y-m-d\TH:i") !== $startsAt) {
                    throw new Exception("Invalid notice start date.");
                }
            }

            if ($endsAt !== "") {
                $endDate = DateTime::createFromFormat("Y-m-d\TH:i", $endsAt);

                if (!$endDate || $endDate->format("Y-m-d\TH:i") !== $endsAt) {
                    throw new Exception("Invalid notice end date.");
                }
            }

            if ($startsAt !== "" && $endsAt !== "") {
                if (strtotime($endsAt) <= strtotime($startsAt)) {
                    throw new Exception("Notice end time must be later than its start time.");
                }
            }
        }

        if ($noticeBannerEnabled && count($notices) > 0) {
            foreach ($notices as $notice) {
                if (trim($notice["message"] ?? "") === "") {
                    throw new Exception("Every notice needs a message.");
                }
            }
        }

        $conn->beginTransaction();

        $q = $conn->query("
            SELECT *
            FROM maintenance_config
            ORDER BY created_at ASC
            LIMIT 1
            FOR UPDATE
        ");

        $oldConfig = $q->fetch(PDO::FETCH_ASSOC);

        $oldNotices = $conn->query("
            SELECT id, message, severity, active, audience, starts_at, ends_at
            FROM maintenance_notices
            ORDER BY created_at ASC
        ")->fetchAll(PDO::FETCH_ASSOC);

        $newConfig = [
            "maintenance_mode" => (int) $maintenanceMode,
            "emergency_maintenance" => (int) $emergencyMaintenance,
            "allow_staff_access" => (int) $allowStaffAccess,
            "message" => $message,
            "scheduled_start" => $scheduledStart,
            "scheduled_duration_minutes" => $duration,
            "notify_users_ahead_hours" => $notifyHours,
            "notice_banner_enabled" => (int) $noticeBannerEnabled
        ];

        if ($oldConfig) {
            $q = $conn->prepare("
                UPDATE maintenance_config
                SET maintenance_mode = :maintenance_mode,
                    emergency_maintenance = :emergency_maintenance,
                    allow_staff_access = :allow_staff_access,
                    message = :message,
                    scheduled_start = :scheduled_start,
                    scheduled_duration_minutes = :scheduled_duration_minutes,
                    notify_users_ahead_hours = :notify_users_ahead_hours,
                    notice_banner_enabled = :notice_banner_enabled,
                    updated_by = :updated_by
                WHERE id = :id
            ");

            $q->execute([
                ":maintenance_mode" => $newConfig["maintenance_mode"],
                ":emergency_maintenance" => $newConfig["emergency_maintenance"],
                ":allow_staff_access" => $newConfig["allow_staff_access"],
                ":message" => $newConfig["message"],
                ":scheduled_start" => $newConfig["scheduled_start"],
                ":scheduled_duration_minutes" => $newConfig["scheduled_duration_minutes"],
                ":notify_users_ahead_hours" => $newConfig["notify_users_ahead_hours"],
                ":notice_banner_enabled" => $newConfig["notice_banner_enabled"],
                ":updated_by" => $actorId,
                ":id" => $oldConfig["id"]
            ]);
        } else {
            $q = $conn->prepare("
                INSERT INTO maintenance_config (
                    id, maintenance_mode, emergency_maintenance,
                    allow_staff_access, message, scheduled_start,
                    scheduled_duration_minutes, notify_users_ahead_hours,
                    notice_banner_enabled, created_by, updated_by
                ) VALUES (
                    :id, :maintenance_mode, :emergency_maintenance,
                    :allow_staff_access, :message, :scheduled_start,
                    :scheduled_duration_minutes, :notify_users_ahead_hours,
                    :notice_banner_enabled, :created_by, :updated_by
                )
            ");

            $q->execute([
                ":id" => generateId(),
                ":maintenance_mode" => $newConfig["maintenance_mode"],
                ":emergency_maintenance" => $newConfig["emergency_maintenance"],
                ":allow_staff_access" => $newConfig["allow_staff_access"],
                ":message" => $newConfig["message"],
                ":scheduled_start" => $newConfig["scheduled_start"],
                ":scheduled_duration_minutes" => $newConfig["scheduled_duration_minutes"],
                ":notify_users_ahead_hours" => $newConfig["notify_users_ahead_hours"],
                ":notice_banner_enabled" => $newConfig["notice_banner_enabled"],
                ":created_by" => $actorId,
                ":updated_by" => $actorId
            ]);
        }

        $submittedIds = [];

        foreach ($notices as $notice) {
            $noticeId = trim($notice["id"] ?? "");

            if ($noticeId === "") {
                $noticeId = generateId();
            }

            if (in_array($noticeId, $submittedIds, true)) {
                throw new Exception("Duplicate notice ID.");
            }

            $submittedIds[] = $noticeId;

            $startsAt = trim($notice["starts_at"] ?? "");
            $endsAt = trim($notice["ends_at"] ?? "");

            $startsAt = $startsAt === ""
                ? null
                : str_replace("T", " ", $startsAt) . (strlen($startsAt) === 16 ? ":00" : "");

            $endsAt = $endsAt === ""
                ? null
                : str_replace("T", " ", $endsAt) . (strlen($endsAt) === 16 ? ":00" : "");

            $active = filter_var($notice["active"] ?? true, FILTER_VALIDATE_BOOLEAN);

            $q = $conn->prepare("
                SELECT id
                FROM maintenance_notices
                WHERE id = :id
                LIMIT 1
                FOR UPDATE
            ");
            $q->execute([":id" => $noticeId]);

            $existingNotice = $q->fetch(PDO::FETCH_ASSOC);

            if ($existingNotice) {
                $q = $conn->prepare("
                    UPDATE maintenance_notices
                    SET message = :message,
                        severity = :severity,
                        active = :active,
                        audience = :audience,
                        starts_at = :starts_at,
                        ends_at = :ends_at,
                        updated_by = :updated_by
                    WHERE id = :id
                ");

                $q->execute([
                    ":message" => trim($notice["message"]),
                    ":severity" => $notice["severity"],
                    ":active" => (int) $active,
                    ":audience" => $notice["audience"],
                    ":starts_at" => $startsAt,
                    ":ends_at" => $endsAt,
                    ":updated_by" => $actorId,
                    ":id" => $noticeId
                ]);
            } else {
                $q = $conn->prepare("
                    INSERT INTO maintenance_notices (
                        id, message, severity, active, audience,
                        starts_at, ends_at, created_by, updated_by
                    ) VALUES (
                        :id, :message, :severity, :active, :audience,
                        :starts_at, :ends_at, :created_by, :updated_by
                    )
                ");

                $q->execute([
                    ":id" => $noticeId,
                    ":message" => trim($notice["message"]),
                    ":severity" => $notice["severity"],
                    ":active" => (int) $active,
                    ":audience" => $notice["audience"],
                    ":starts_at" => $startsAt,
                    ":ends_at" => $endsAt,
                    ":created_by" => $actorId,
                    ":updated_by" => $actorId
                ]);
            }
        }

        if (count($submittedIds) > 0) {
            $placeholders = implode(",", array_fill(0, count($submittedIds), "?"));
            $q = $conn->prepare("DELETE FROM maintenance_notices WHERE id NOT IN ($placeholders)");
            $q->execute($submittedIds);
        } else {
            $conn->exec("DELETE FROM maintenance_notices");
        }

        $q = $conn->prepare("
            INSERT INTO maintenance_audit_logs (
                id, actor_id, action, change_reason, details
            ) VALUES (
                :id, :actor_id, :action, :change_reason, :details
            )
        ");

        $q->execute([
            ":id" => generateId(),
            ":actor_id" => $actorId,
            ":action" => "maintenance_configuration_updated",
            ":change_reason" => $changeReason,
            ":details" => json_encode([
                "old_config" => $oldConfig,
                "new_config" => $newConfig,
                "old_notices" => $oldNotices,
                "new_notices" => $notices
            ], JSON_THROW_ON_ERROR)
        ]);

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Maintenance configuration saved",
            "code" => [
                "config" => $newConfig,
                "notices" => $notices
            ]
        ]);
    } catch (Throwable $e) {
        if (isset($conn) && $conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(400);

        echo json_encode([
            "error" => true,
            "data" => $e->getMessage() ?: "Could not save maintenance configuration",
            "code" => "MAINTENANCE_UPDATE_FAILED"
        ]);
    }
