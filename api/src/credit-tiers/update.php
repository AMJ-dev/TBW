    <?php

    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $id = trim($_POST["id"] ?? "");

        $name = trim($_POST["name"] ?? "");
        $code = strtoupper(trim($_POST["code"] ?? ""));
        $description = trim($_POST["description"] ?? "");

        $minimum_limit = $_POST["minimum_limit"] ?? null;
        $maximum_limit = $_POST["maximum_limit"] ?? null;

        $payment_duration = $_POST["payment_duration"] ?? null;
        $payment_unit = strtoupper(trim($_POST["payment_unit"] ?? "DAYS"));

        $interest_rate = $_POST["interest_rate"] ?? 0;
        $grace_period = $_POST["grace_period"] ?? 0;

        $eligibility_duration = $_POST["eligibility_duration"] ?? 0;
        $eligibility_unit = strtoupper(trim($_POST["eligibility_unit"] ?? "MONTHS"));

        $minimum_transaction_volume = $_POST["minimum_transaction_volume"] ?? 0;
        $status = strtoupper(trim($_POST["status"] ?? "ACTIVE"));

        $internal_notes = trim($_POST["internal_notes"] ?? "");

        if ($id === "") {
            echo json_encode([
                "error" => true,
                "data" => "Credit tier ID is required.",
                "code" => null
            ]);
            exit;
        }

        if ($name === "" || $code === "" || $description === "") {
            echo json_encode([
                "error" => true,
                "data" => "Name, code and description are required.",
                "code" => null
            ]);
            exit;
        }

        if (
            !is_numeric($minimum_limit) ||
            !is_numeric($maximum_limit) ||
            !is_numeric($payment_duration) ||
            !is_numeric($interest_rate) ||
            !is_numeric($grace_period) ||
            !is_numeric($eligibility_duration) ||
            !is_numeric($minimum_transaction_volume)
        ) {
            echo json_encode([
                "error" => true,
                "data" => "Invalid numeric values supplied.",
                "code" => null
            ]);
            exit;
        }

        $minimum_limit = (float) $minimum_limit;
        $maximum_limit = (float) $maximum_limit;
        $payment_duration = (int) $payment_duration;
        $interest_rate = (float) $interest_rate;
        $grace_period = (int) $grace_period;
        $eligibility_duration = (int) $eligibility_duration;
        $minimum_transaction_volume = (float) $minimum_transaction_volume;

        if (
            $minimum_limit <= 0 ||
            $maximum_limit < $minimum_limit ||
            $payment_duration < 1 ||
            $interest_rate < 0 ||
            $grace_period < 0 ||
            $eligibility_duration < 0 ||
            $minimum_transaction_volume < 0
        ) {
            echo json_encode([
                "error" => true,
                "data" => "One or more numeric values are outside the allowed range.",
                "code" => null
            ]);
            exit;
        }

        if (!in_array($payment_unit, ["DAYS", "MONTHS", "YEARS"], true)) {
            echo json_encode([
                "error" => true,
                "data" => "Invalid payment duration unit.",
                "code" => null
            ]);
            exit;
        }

        if (!in_array($eligibility_unit, ["DAYS", "MONTHS", "YEARS"], true)) {
            echo json_encode([
                "error" => true,
                "data" => "Invalid eligibility duration unit.",
                "code" => null
            ]);
            exit;
        }

        if (!in_array($status, ["ACTIVE", "INACTIVE"], true)) {
            echo json_encode([
                "error" => true,
                "data" => "Invalid credit tier status.",
                "code" => null
            ]);
            exit;
        }

        $check = $conn->prepare("
            SELECT id
            FROM finance_credit_tiers
            WHERE code = :code
            AND id != :id
            LIMIT 1
        ");

        $check->execute([
            "code" => $code,
            "id" => $id
        ]);

        if ($check->fetch(PDO::FETCH_ASSOC)) {
            echo json_encode([
                "error" => true,
                "data" => "Another credit tier already uses this code.",
                "code" => null
            ]);
            exit;
        }

        $exists = $conn->prepare("
            SELECT id
            FROM finance_credit_tiers
            WHERE id = :id
            LIMIT 1
        ");

        $exists->execute(["id" => $id]);

        if (!$exists->fetch(PDO::FETCH_ASSOC)) {
            echo json_encode([
                "error" => true,
                "data" => "Credit tier not found.",
                "code" => null
            ]);
            exit;
        }

        $sql = "
            UPDATE finance_credit_tiers
            SET
                name = :name,
                code = :code,
                description = :description,
                minimum_limit = :minimum_limit,
                maximum_limit = :maximum_limit,
                payment_duration = :payment_duration,
                payment_unit = :payment_unit,
                interest_rate = :interest_rate,
                grace_period = :grace_period,
                eligibility_duration = :eligibility_duration,
                eligibility_unit = :eligibility_unit,
                minimum_transaction_volume = :minimum_transaction_volume,
                status = :status,
                internal_notes = :internal_notes
            WHERE id = :id
        ";

        $stmt = $conn->prepare($sql);

        $stmt->execute([
            "id" => $id,
            "name" => $name,
            "code" => $code,
            "description" => $description,
            "minimum_limit" => $minimum_limit,
            "maximum_limit" => $maximum_limit,
            "payment_duration" => $payment_duration,
            "payment_unit" => $payment_unit,
            "interest_rate" => $interest_rate,
            "grace_period" => $grace_period,
            "eligibility_duration" => $eligibility_duration,
            "eligibility_unit" => $eligibility_unit,
            "minimum_transaction_volume" => $minimum_transaction_volume,
            "status" => $status,
            "internal_notes" => $internal_notes
        ]);

        $fetch = $conn->prepare("
            SELECT *
            FROM finance_credit_tiers
            WHERE id = :id
            LIMIT 1
        ");

        $fetch->execute(["id" => $id]);

        $tier = $fetch->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "error" => false,
            "data" => "Credit tier updated successfully.",
            "code" => $tier
        ]);

    } catch (PDOException $e) {
        echo json_encode([
            "error" => true,
            "data" => "Could not update credit tier.",
            "code" => null
        ]);
    } catch (Throwable $e) {
        echo json_encode([
            "error" => true,
            "data" => "An unexpected error occurred.",
            "code" => null
        ]);
    }