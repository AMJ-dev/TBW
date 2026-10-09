<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        if ($_SERVER["REQUEST_METHOD"] !== "POST") {
            http_response_code(405);
            echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
            exit;
        }

        $configJson = $_POST["config"] ?? "";

        if (!is_string($configJson) || trim($configJson) === "") {
            http_response_code(400);
            echo json_encode(["error" => true, "data" => "The configuration payload is required.", "code" => null]);
            exit;
        }

        $config = json_decode($configJson, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($config)) {
            throw new InvalidArgumentException("The configuration payload must be valid JSON.");
        }

        $requiredFields = [
            "channels_enabled",
            "quiet_hours_enabled",
            "quiet_hours_start",
            "quiet_hours_end",
            "rate_limit_per_hour",
            "digest_frequency",
            "fallback_channel_enabled",
            "retry_count",
            "track_delivery_status",
            "transactional_marketing_split",
            "internal_alerts",
            "events"
        ];

        foreach ($requiredFields as $field) {
            if (!array_key_exists($field, $config)) {
                throw new InvalidArgumentException("Missing configuration field: " . $field);
            }
        }

        $isBoolean = function ($value) {
            return is_bool($value) || in_array($value, [0, 1, "0", "1"], true);
        };

        $toBoolean = function ($value) {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN);
        };

        if (!is_array($config["channels_enabled"])) {
            throw new InvalidArgumentException("Invalid notification channels configuration.");
        }

        foreach (["email", "sms"] as $channel) {
            if (!isset($config["channels_enabled"][$channel]) && !array_key_exists($channel, $config["channels_enabled"])) {
                throw new InvalidArgumentException("Missing channel setting: " . $channel);
            }

            if (!$isBoolean($config["channels_enabled"][$channel])) {
                throw new InvalidArgumentException("Invalid channel setting: " . $channel);
            }

            $config["channels_enabled"][$channel] = $toBoolean($config["channels_enabled"][$channel]);
        }

        if (!is_array($config["internal_alerts"])) {
            throw new InvalidArgumentException("Invalid internal alerts configuration.");
        }

        foreach (["sla", "exceptions", "integrations", "security"] as $alert) {
            if (!array_key_exists($alert, $config["internal_alerts"]) || !$isBoolean($config["internal_alerts"][$alert])) {
                throw new InvalidArgumentException("Invalid internal alert setting: " . $alert);
            }

            $config["internal_alerts"][$alert] = $toBoolean($config["internal_alerts"][$alert]);
        }

        foreach (["quiet_hours_enabled", "fallback_channel_enabled", "track_delivery_status", "transactional_marketing_split"] as $field) {
            if (!$isBoolean($config[$field])) {
                throw new InvalidArgumentException("Invalid boolean setting: " . $field);
            }

            $config[$field] = $toBoolean($config[$field]);
        }

        foreach (["quiet_hours_start", "quiet_hours_end"] as $field) {
            if (!is_string($config[$field]) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $config[$field])) {
                throw new InvalidArgumentException("Invalid time value: " . $field);
            }
        }

        if (!is_numeric($config["rate_limit_per_hour"]) || (int)$config["rate_limit_per_hour"] < 1 || (int)$config["rate_limit_per_hour"] > 1000) {
            throw new InvalidArgumentException("Rate limit must be between 1 and 1000 per hour.");
        }

        $config["rate_limit_per_hour"] = (int)$config["rate_limit_per_hour"];

        if (!is_numeric($config["retry_count"]) || (int)$config["retry_count"] < 0 || (int)$config["retry_count"] > 20) {
            throw new InvalidArgumentException("Retry count must be between 0 and 20.");
        }

        $config["retry_count"] = (int)$config["retry_count"];

        if (!in_array($config["digest_frequency"], ["immediate", "hourly", "daily"], true)) {
            throw new InvalidArgumentException("Invalid digest frequency.");
        }

        if (!is_array($config["events"]) || count($config["events"]) < 1 || count($config["events"]) > 200) {
            throw new InvalidArgumentException("Configure between 1 and 200 notification events.");
        }

        $cleanEvents = [];
        $seenIds = [];
        $seenKeys = [];
        $mandatoryKeys = ["hold_placed", "release_authorised"];

        foreach ($config["events"] as $event) {
            if (!is_array($event)) {
                throw new InvalidArgumentException("Each event must be an object.");
            }

            foreach (["id", "key", "label", "channels", "template", "mandatory"] as $field) {
                if (!array_key_exists($field, $event)) {
                    throw new InvalidArgumentException("An event is missing field: " . $field);
                }
            }

            $id = trim((string)$event["id"]);
            $key = trim((string)$event["key"]);
            $label = trim((string)$event["label"]);
            $template = trim((string)$event["template"]);

            if ($id === "" || strlen($id) > 100) {
                throw new InvalidArgumentException("Invalid event ID.");
            }

            if (!preg_match('/^[a-z][a-z0-9_]*$/', $key) || strlen($key) > 100) {
                throw new InvalidArgumentException("Event keys must use lowercase letters, numbers and underscores.");
            }

            if (isset($seenIds[$id]) || isset($seenKeys[$key])) {
                throw new InvalidArgumentException("Event IDs and keys must be unique.");
            }

            if ($label === "" || mb_strlen($label) > 150) {
                throw new InvalidArgumentException("Event labels must contain 1 to 150 characters.");
            }

            if (!preg_match('/^[a-zA-Z0-9_-]{1,100}$/', $template)) {
                throw new InvalidArgumentException("Invalid template identifier.");
            }

            if (!is_array($event["channels"]) || count($event["channels"]) === 0) {
                throw new InvalidArgumentException("Every event must have at least one channel.");
            }

            $channels = [];

            foreach ($event["channels"] as $channel) {
                if (!is_string($channel) || !in_array($channel, ["email", "sms"], true)) {
                    throw new InvalidArgumentException("Only email and SMS event channels are supported.");
                }

                if (!in_array($channel, $channels, true)) {
                    $channels[] = $channel;
                }
            }

            if (!$isBoolean($event["mandatory"])) {
                throw new InvalidArgumentException("Invalid mandatory setting for event " . $key . ".");
            }

            $mandatory = $toBoolean($event["mandatory"]);

            if (in_array($key, $mandatoryKeys, true) && !$mandatory) {
                throw new InvalidArgumentException($key . " must remain mandatory.");
            }

            $seenIds[$id] = true;
            $seenKeys[$key] = true;

            $cleanEvents[] = [
                "id" => $id,
                "key" => $key,
                "label" => $label,
                "channels" => $channels,
                "template" => $template,
                "mandatory" => $mandatory
            ];
        }

        foreach ($mandatoryKeys as $mandatoryKey) {
            $found = false;

            foreach ($cleanEvents as $event) {
                if ($event["key"] === $mandatoryKey && $event["mandatory"]) {
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                throw new InvalidArgumentException("Required mandatory event is missing: " . $mandatoryKey);
            }
        }

        $config["events"] = $cleanEvents;
        $actorId = (string)$my_details->id;
        $changeReason = trim((string)($_POST["change_reason"] ?? "Notification configuration updated"));

        if ($changeReason === "") {
            $changeReason = "Notification configuration updated";
        }

        if (mb_strlen($changeReason) > 500) {
            throw new InvalidArgumentException("Change reason cannot exceed 500 characters.");
        }

        $afterJson = json_encode($config, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $conn->beginTransaction();

        $q = $conn->prepare("SELECT id, version_no, config_json FROM notification_config_versions WHERE is_current = 1 ORDER BY version_no DESC LIMIT 1 FOR UPDATE");
        $q->execute();
        $current = $q->fetch(PDO::FETCH_ASSOC);
        $beforeJson = $current["config_json"] ?? null;

        if ($current) {
            $nextVersion = (int)$current["version_no"] + 1;
            $q = $conn->prepare("UPDATE notification_config_versions SET is_current = 0 WHERE is_current = 1");
            $q->execute();
        } else {
            $q = $conn->query("SELECT COALESCE(MAX(version_no), 0) + 1 FROM notification_config_versions");
            $nextVersion = (int)$q->fetchColumn();
        }

        $configurationId = generateId();

        $q = $conn->prepare("INSERT INTO notification_config_versions (id, version_no, is_current, config_json, change_reason, created_by) VALUES (:id, :version_no, 1, :config_json, :change_reason, :created_by)");
        $q->bindValue(":id", $configurationId, PDO::PARAM_STR);
        $q->bindValue(":version_no", $nextVersion, PDO::PARAM_INT);
        $q->bindValue(":config_json", $afterJson, PDO::PARAM_STR);
        $q->bindValue(":change_reason", $changeReason, PDO::PARAM_STR);
        $q->bindValue(":created_by", $actorId, PDO::PARAM_STR);
        $q->execute();

        foreach ($cleanEvents as $event) {
            $q = $conn->prepare("SELECT id FROM notification_config_events WHERE id = :id OR event_key = :event_key LIMIT 1 FOR UPDATE");
            $q->bindValue(":id", $event["id"], PDO::PARAM_STR);
            $q->bindValue(":event_key", $event["key"], PDO::PARAM_STR);
            $q->execute();
            $existingId = $q->fetchColumn();

            if ($existingId) {
                $q = $conn->prepare("UPDATE notification_config_events SET event_key = :event_key, label = :label, channels_json = :channels_json, template = :template, mandatory = :mandatory, updated_by = :updated_by WHERE id = :id");
                $q->bindValue(":id", $existingId, PDO::PARAM_STR);
                $q->bindValue(":event_key", $event["key"], PDO::PARAM_STR);
                $q->bindValue(":label", $event["label"], PDO::PARAM_STR);
                $q->bindValue(":channels_json", json_encode($event["channels"], JSON_THROW_ON_ERROR), PDO::PARAM_STR);
                $q->bindValue(":template", $event["template"], PDO::PARAM_STR);
                $q->bindValue(":mandatory", $event["mandatory"] ? 1 : 0, PDO::PARAM_INT);
                $q->bindValue(":updated_by", $actorId, PDO::PARAM_STR);
                $q->execute();
            } else {
                $q = $conn->prepare("INSERT INTO notification_config_events (id, event_key, label, channels_json, template, mandatory, created_by, updated_by) VALUES (:id, :event_key, :label, :channels_json, :template, :mandatory, :created_by, :updated_by)");
                $q->bindValue(":id", $event["id"], PDO::PARAM_STR);
                $q->bindValue(":event_key", $event["key"], PDO::PARAM_STR);
                $q->bindValue(":label", $event["label"], PDO::PARAM_STR);
                $q->bindValue(":channels_json", json_encode($event["channels"], JSON_THROW_ON_ERROR), PDO::PARAM_STR);
                $q->bindValue(":template", $event["template"], PDO::PARAM_STR);
                $q->bindValue(":mandatory", $event["mandatory"] ? 1 : 0, PDO::PARAM_INT);
                $q->bindValue(":created_by", $actorId, PDO::PARAM_STR);
                $q->bindValue(":updated_by", $actorId, PDO::PARAM_STR);
                $q->execute();
            }
        }

        $submittedIds = [];

        foreach ($cleanEvents as $event) {
            $q = $conn->prepare("SELECT id FROM notification_config_events WHERE event_key = :event_key LIMIT 1");
            $q->bindValue(":event_key", $event["key"], PDO::PARAM_STR);
            $q->execute();
            $savedId = $q->fetchColumn();

            if ($savedId) {
                $submittedIds[] = $savedId;
            }
        }

        if (count($submittedIds) > 0) {
            $placeholders = implode(",", array_fill(0, count($submittedIds), "?"));
            $q = $conn->prepare("DELETE FROM notification_config_events WHERE id NOT IN ($placeholders)");
            $q->execute($submittedIds);
        }

        $q = $conn->prepare("INSERT INTO notification_config_audit (id, config_version_id, actor_id, action, change_reason, before_json, after_json, request_id, ip_address, user_agent) VALUES (:id, :config_version_id, :actor_id, :action, :change_reason, :before_json, :after_json, :request_id, :ip_address, :user_agent)");
        $q->bindValue(":id", generateId(), PDO::PARAM_STR);
        $q->bindValue(":config_version_id", $configurationId, PDO::PARAM_STR);
        $q->bindValue(":actor_id", $actorId, PDO::PARAM_STR);
        $q->bindValue(":action", "notification_configuration_updated", PDO::PARAM_STR);
        $q->bindValue(":change_reason", $changeReason, PDO::PARAM_STR);
        $q->bindValue(":before_json", $beforeJson, $beforeJson === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $q->bindValue(":after_json", $afterJson, PDO::PARAM_STR);
        $q->bindValue(":request_id", bin2hex(random_bytes(16)), PDO::PARAM_STR);

        $ipAddress = $_SERVER["REMOTE_ADDR"] ?? null;
        $userAgent = substr((string)($_SERVER["HTTP_USER_AGENT"] ?? ""), 0, 500);

        $q->bindValue(":ip_address", $ipAddress, $ipAddress === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $q->bindValue(":user_agent", $userAgent, PDO::PARAM_STR);
        $q->execute();

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Notification configuration updated successfully.",
            "code" => [
                "configuration_id" => $configurationId,
                "version" => $nextVersion,
                "events" => $cleanEvents
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } catch (InvalidArgumentException $e) {
        if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(400);
        echo json_encode(["error" => true, "data" => $e->getMessage(), "code" => null]);
    } catch (Throwable $e) {
        if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
            $conn->rollBack();
        }

        error_log("Notification configuration update error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => true, "data" => "Unable to update notification configuration.", "code" => null]);
    }