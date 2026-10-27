<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $id = trim($_POST["id"] ?? "");
        $hsCode = trim($_POST["hs_code"] ?? "");
        $description = trim($_POST["description"] ?? "");
        $category = trim($_POST["category"] ?? "");
        $rateType = strtoupper(trim($_POST["rate_type"] ?? "PERCENTAGE"));
        $rateInput = $_POST["rate"] ?? null;
        $unit = trim($_POST["unit"] ?? "");
        $effectiveFrom = trim($_POST["effective_from"] ?? "");
        $effectiveTo = trim($_POST["effective_to"] ?? "");
        $status = strtoupper(trim($_POST["status"] ?? "ACTIVE"));
        $source = trim($_POST["source"] ?? "");

        $allowedRateTypes = ["PERCENTAGE", "FIXED"];
        $allowedStatuses = ["ACTIVE", "INACTIVE", "SCHEDULED", "EXPIRED"];

        if (
            $hsCode === "" ||
            $description === "" ||
            $category === "" ||
            $unit === "" ||
            $effectiveFrom === "" ||
            $rateInput === null ||
            $rateInput === "" ||
            !is_numeric($rateInput)
        ) {
            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "Complete all required tariff fields.",
                "code" => null
            ]);
            exit;
        }

        if (strlen($hsCode) > 20 || strlen($category) > 150 || strlen($unit) > 100) {
            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "One or more fields exceed the allowed length.",
                "code" => null
            ]);
            exit;
        }

        if (!in_array($rateType, $allowedRateTypes, true)) {
            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "Invalid tariff rate type.",
                "code" => null
            ]);
            exit;
        }

        if (!in_array($status, $allowedStatuses, true)) {
            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "Invalid tariff status.",
                "code" => null
            ]);
            exit;
        }

        $rate = (float) $rateInput;

        if (!is_finite($rate) || $rate < 0) {
            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "The tariff rate must be a valid non-negative number.",
                "code" => null
            ]);
            exit;
        }

        $fromDate = DateTimeImmutable::createFromFormat("!Y-m-d", $effectiveFrom);
        $fromErrors = DateTimeImmutable::getLastErrors();

        if (
            !$fromDate ||
            ($fromErrors !== false && ($fromErrors["warning_count"] > 0 || $fromErrors["error_count"] > 0)) ||
            $fromDate->format("Y-m-d") !== $effectiveFrom
        ) {
            http_response_code(422);
            echo json_encode([
                "error" => true,
                "data" => "Invalid effective-from date.",
                "code" => null
            ]);
            exit;
        }

        $toDate = null;

        if ($effectiveTo !== "") {
            $toDate = DateTimeImmutable::createFromFormat("!Y-m-d", $effectiveTo);
            $toErrors = DateTimeImmutable::getLastErrors();

            if (
                !$toDate ||
                ($toErrors !== false && ($toErrors["warning_count"] > 0 || $toErrors["error_count"] > 0)) ||
                $toDate->format("Y-m-d") !== $effectiveTo ||
                $toDate < $fromDate
            ) {
                http_response_code(422);
                echo json_encode([
                    "error" => true,
                    "data" => "The effective-to date must be valid and cannot precede the effective-from date.",
                    "code" => null
                ]);
                exit;
            }
        }

        if ($source === "") {
            $source = null;
        }

        if ($id !== "") {
            $q = $conn->prepare("SELECT id FROM customs_tariffs WHERE id = :id LIMIT 1");
            $q->execute([":id" => $id]);

            if (!$q->fetch(PDO::FETCH_ASSOC)) {
                http_response_code(404);
                echo json_encode([
                    "error" => true,
                    "data" => "Tariff record not found.",
                    "code" => null
                ]);
                exit;
            }
        } else {
            $id = generateId();
        }

        $myId = isset($my_details->id) ? (string) $my_details->id : null;

        $q = $conn->prepare("
            SELECT id
            FROM customs_tariffs
            WHERE hs_code = :hs_code
            AND effective_from = :effective_from
            AND id <> :id
            LIMIT 1
        ");
        $q->execute([
            ":hs_code" => $hsCode,
            ":effective_from" => $effectiveFrom,
            ":id" => $id
        ]);

        if ($q->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(409);
            echo json_encode([
                "error" => true,
                "data" => "A tariff with this HS code and effective-from date already exists.",
                "code" => null
            ]);
            exit;
        }

        if ($id !== "" && isset($_POST["id"]) && trim($_POST["id"]) !== "") {
            $q = $conn->prepare("
                UPDATE customs_tariffs
                SET
                    hs_code = :hs_code,
                    description = :description,
                    category = :category,
                    rate_type = :rate_type,
                    rate = :rate,
                    unit = :unit,
                    effective_from = :effective_from,
                    effective_to = :effective_to,
                    status = :status,
                    source = :source,
                    updated_by = :updated_by
                WHERE id = :id
            ");

            $q->execute([
                ":hs_code" => $hsCode,
                ":description" => $description,
                ":category" => $category,
                ":rate_type" => $rateType,
                ":rate" => $rate,
                ":unit" => $unit,
                ":effective_from" => $effectiveFrom,
                ":effective_to" => $effectiveTo !== "" ? $effectiveTo : null,
                ":status" => $status,
                ":source" => $source,
                ":updated_by" => $myId,
                ":id" => $id
            ]);

            $message = "Customs tariff updated successfully.";
        } else {
            $q = $conn->prepare("
                INSERT INTO customs_tariffs (
                    id,
                    hs_code,
                    description,
                    category,
                    rate_type,
                    rate,
                    unit,
                    effective_from,
                    effective_to,
                    status,
                    source,
                    created_by,
                    updated_by
                ) VALUES (
                    :id,
                    :hs_code,
                    :description,
                    :category,
                    :rate_type,
                    :rate,
                    :unit,
                    :effective_from,
                    :effective_to,
                    :status,
                    :source,
                    :created_by,
                    :updated_by
                )
            ");

            $q->execute([
                ":id" => $id,
                ":hs_code" => $hsCode,
                ":description" => $description,
                ":category" => $category,
                ":rate_type" => $rateType,
                ":rate" => $rate,
                ":unit" => $unit,
                ":effective_from" => $effectiveFrom,
                ":effective_to" => $effectiveTo !== "" ? $effectiveTo : null,
                ":status" => $status,
                ":source" => $source,
                ":created_by" => $myId,
                ":updated_by" => $myId
            ]);

            $message = "Customs tariff created successfully.";
        }

        $q = $conn->prepare("
            SELECT
                id,
                hs_code,
                description,
                category,
                rate_type,
                rate,
                unit,
                effective_from,
                effective_to,
                status,
                source,
                DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
            FROM customs_tariffs
            WHERE id = :id
            LIMIT 1
        ");
        $q->execute([":id" => $id]);
        $tariff = $q->fetch(PDO::FETCH_ASSOC);

        if ($tariff) {
            $tariff["rate"] = (float) $tariff["rate"];
        }

        echo json_encode([
            "error" => false,
            "data" => $message,
            "code" => [
                "tariff" => $tariff
            ]
        ]);
    } catch (PDOException $e) {
        error_log("Customs tariff save database error: " . $e->getMessage());

        if ($e->getCode() === "23000") {
            http_response_code(409);
            echo json_encode([
                "error" => true,
                "data" => "A tariff record conflicts with an existing record.",
                "code" => null
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "error" => true,
                "data" => "Could not save customs tariff.",
                "code" => null
            ]);
        }
    } catch (Throwable $e) {
        error_log("Customs tariff save error: " . $e->getMessage());
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not save customs tariff.",
            "code" => null
        ]);
    }