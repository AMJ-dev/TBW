<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        if ($_SERVER["REQUEST_METHOD"] !== "POST") {
            echo json_encode([
                "error" => true,
                "data" => "Method not allowed.",
                "code" => null
            ]);
            exit;
        }

        $rawLanes = $_POST["gate_lanes"] ?? null;
        $rawDeletedIds = $_POST["deleted_ids"] ?? "[]";

        if (!is_string($rawLanes) || trim($rawLanes) === "") {
            echo json_encode([
                "error" => true,
                "data" => "Gate lane data is required.",
                "code" => null
            ]);
            exit;
        }

        $lanes = json_decode($rawLanes, true);
        $deletedIds = json_decode($rawDeletedIds, true);

        if (!is_array($lanes) || !is_array($deletedIds)) {
            echo json_encode([
                "error" => true,
                "data" => "Invalid gate lane data.",
                "code" => null
            ]);
            exit;
        }

        $conn->beginTransaction();

        $existingStmt = $conn->prepare("
            SELECT id
            FROM gate_lanes
            WHERE id = :id
            LIMIT 1
        ");

        $insertStmt = $conn->prepare("
            INSERT INTO gate_lanes (
                id,
                code,
                name,
                direction,
                gate_name,
                description,
                status,
                change_reason
            ) VALUES (
                :id,
                :code,
                :name,
                :direction,
                :gate_name,
                :description,
                :status,
                :change_reason
            )
        ");

        $updateStmt = $conn->prepare("
            UPDATE gate_lanes
            SET
                code = :code,
                name = :name,
                direction = :direction,
                gate_name = :gate_name,
                description = :description,
                status = :status,
                change_reason = :change_reason
            WHERE id = :id
        ");

        foreach ($lanes as $lane) {
            if (!is_array($lane)) {
                throw new InvalidArgumentException("Invalid gate lane entry.");
            }

            $id = isset($lane["id"]) && trim((string) $lane["id"]) !== ""
                ? trim((string) $lane["id"])
                : null;

            $code = strtoupper(trim((string) ($lane["code"] ?? "")));
            $name = trim((string) ($lane["name"] ?? ""));
            $direction = strtoupper(trim((string) ($lane["direction"] ?? "BOTH")));
            $gateName = trim((string) ($lane["gate_name"] ?? ""));
            $description = trim((string) ($lane["description"] ?? ""));
            $status = strtolower(trim((string) ($lane["status"] ?? "active")));
            $changeReason = trim((string) ($lane["change_reason"] ?? ""));

            if ($code === "" || $name === "") {
                throw new InvalidArgumentException(
                    "Every gate lane must have a code and name."
                );
            }

            if (!in_array($direction, ["IN", "OUT", "BOTH"], true)) {
                throw new InvalidArgumentException("Invalid gate lane direction.");
            }

            if (!in_array($status, ["active", "inactive"], true)) {
                throw new InvalidArgumentException("Invalid gate lane status.");
            }

            if ($id !== null) {
                $existingStmt->bindValue(":id", $id, PDO::PARAM_STR);
                $existingStmt->execute();

                if (!$existingStmt->fetch(PDO::FETCH_ASSOC)) {
                    throw new InvalidArgumentException(
                        "The specified gate lane does not exist."
                    );
                }

                if ($changeReason === "") {
                    throw new InvalidArgumentException(
                        "Change reason is required when editing a gate lane."
                    );
                }

                $updateStmt->bindValue(":code", $code, PDO::PARAM_STR);
                $updateStmt->bindValue(":name", $name, PDO::PARAM_STR);
                $updateStmt->bindValue(":direction", $direction, PDO::PARAM_STR);
                $updateStmt->bindValue(":gate_name", $gateName, PDO::PARAM_STR);
                $updateStmt->bindValue(":description", $description, PDO::PARAM_STR);
                $updateStmt->bindValue(":status", $status, PDO::PARAM_STR);
                $updateStmt->bindValue(":change_reason", $changeReason, PDO::PARAM_STR);
                $updateStmt->bindValue(":id", $id, PDO::PARAM_STR);
                $updateStmt->execute();
            } else {
                $id = generateId();

                $insertStmt->bindValue(":id", $id, PDO::PARAM_STR);
                $insertStmt->bindValue(":code", $code, PDO::PARAM_STR);
                $insertStmt->bindValue(":name", $name, PDO::PARAM_STR);
                $insertStmt->bindValue(":direction", $direction, PDO::PARAM_STR);
                $insertStmt->bindValue(":gate_name", $gateName, PDO::PARAM_STR);
                $insertStmt->bindValue(":description", $description, PDO::PARAM_STR);
                $insertStmt->bindValue(":status", $status, PDO::PARAM_STR);
                $insertStmt->bindValue(":change_reason", null, PDO::PARAM_NULL);
                $insertStmt->execute();
            }
        }

        if (count($deletedIds) > 0) {
            $deleteStmt = $conn->prepare("
                DELETE FROM gate_lanes
                WHERE id = :id
            ");

            foreach ($deletedIds as $deletedId) {
                if (!is_string($deletedId) || trim($deletedId) === "") {
                    throw new InvalidArgumentException(
                        "Invalid gate lane ID in deletion request."
                    );
                }

                $deleteStmt->bindValue(
                    ":id",
                    trim($deletedId),
                    PDO::PARAM_STR
                );

                $deleteStmt->execute();
            }
        }

        $conn->commit();

        $stmt = $conn->prepare("
            SELECT
                id,
                code,
                name,
                direction,
                gate_name,
                description,
                status,
                change_reason,
                created_at,
                updated_at
            FROM gate_lanes
            ORDER BY created_at DESC
        ");

        $stmt->execute();
        $savedLanes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => "Gate lane configuration saved successfully.",
            "code" => [
                "gate_lanes" => $savedLanes
            ]
        ]);
    } catch (InvalidArgumentException $e) {
        if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
            $conn->rollBack();
        }

        echo json_encode([
            "error" => true,
            "data" => $e->getMessage(),
            "code" => null
        ]);
    } catch (PDOException $e) {
        if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
            $conn->rollBack();
        }

        echo json_encode([
            "error" => true,
            "data" => "Could not save gate lane configuration. Check that the lane code is unique.",
            "code" => null
        ]);
    } catch (Throwable $e) {
        if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
            $conn->rollBack();
        }

        echo json_encode([
            "error" => true,
            "data" => "Could not save gate lane configuration.",
            "code" => null
        ]);
    }