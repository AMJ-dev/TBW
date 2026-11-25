<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        if ($_SERVER["REQUEST_METHOD"] !== "POST") {
            echo json_encode([
                "error" => true,
                "data" => "Invalid request method.",
                "code" => null
            ]);
            exit;
        }

        $user_id = $my_details->id ?? null;
        $organisation_id = $my_details->organisation_id ?? null;

        if (!$user_id || !$organisation_id) {
            echo json_encode([
                "error" => true,
                "data" => "Authentication or organisation details could not be verified.",
                "code" => null
            ]);
            exit;
        }

        $credit_tier_id = trim($_POST["credit_tier_id"] ?? "");
        $requested_limit = trim($_POST["requested_limit"] ?? "");
        $average_monthly_spend = trim($_POST["average_monthly_spend"] ?? "");
        $bank_name = trim($_POST["bank_name"] ?? "");
        $bank_account_number = trim($_POST["bank_account_number"] ?? "");
        $bank_contact = trim($_POST["bank_contact"] ?? "");
        $trade_reference_1 = trim($_POST["trade_reference_1"] ?? "");
        $trade_reference_2 = trim($_POST["trade_reference_2"] ?? "");
        $notes = trim($_POST["notes"] ?? "");

        if ($credit_tier_id === "" || $requested_limit === "" || $bank_name === "" || $bank_account_number === "" || $trade_reference_1 === "") {
            echo json_encode([
                "error" => true,
                "data" => "Please complete all required fields.",
                "code" => null
            ]);
            exit;
        }

        if (!is_numeric($requested_limit) || (float) $requested_limit <= 0) {
            echo json_encode([
                "error" => true,
                "data" => "Enter a valid requested credit limit.",
                "code" => null
            ]);
            exit;
        }

        $requested_limit = (float) $requested_limit;

        if ($average_monthly_spend !== "") {
            if (!is_numeric($average_monthly_spend) || (float) $average_monthly_spend < 0) {
                echo json_encode([
                    "error" => true,
                    "data" => "Enter a valid average monthly spend.",
                    "code" => null
                ]);
                exit;
            }

            $average_monthly_spend = (float) $average_monthly_spend;
        } else {
            $average_monthly_spend = null;
        }

        $tier_stmt = $conn->prepare("
            SELECT
                id,
                name,
                code,
                minimum_limit,
                maximum_limit,
                status
            FROM finance_credit_tiers
            WHERE id = :id
            AND status = 'ACTIVE'
            LIMIT 1
        ");

        $tier_stmt->bindValue(":id", $credit_tier_id, PDO::PARAM_STR);
        $tier_stmt->execute();

        $tier = $tier_stmt->fetch(PDO::FETCH_ASSOC);

        if (!$tier) {
            echo json_encode([
                "error" => true,
                "data" => "The selected credit tier is unavailable.",
                "code" => null
            ]);
            exit;
        }

        if ($requested_limit < (float) $tier["minimum_limit"] || $requested_limit > (float) $tier["maximum_limit"]) {
            echo json_encode([
                "error" => true,
                "data" => "The requested credit limit must be between " .
                    number_format((float) $tier["minimum_limit"], 2) .
                    " and " .
                    number_format((float) $tier["maximum_limit"], 2) .
                    " for the selected tier.",
                "code" => null
            ]);
            exit;
        }

        $existing_stmt = $conn->prepare("
            SELECT id, status
            FROM credit_applications
            WHERE organisation_id = :organisation_id
            AND status IN ('PENDING_REVIEW', 'UNDER_REVIEW')
            LIMIT 1
        ");

        $existing_stmt->bindValue(
            ":organisation_id",
            $organisation_id,
            PDO::PARAM_STR
        );

        $existing_stmt->execute();

        $existing_application = $existing_stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing_application) {
            echo json_encode([
                "error" => true,
                "data" => "Your organisation already has a credit application awaiting review.",
                "code" => [
                    "application_id" => $existing_application["id"],
                    "status" => $existing_application["status"]
                ]
            ]);
            exit;
        }

        $id = generateId();

        $conn->beginTransaction();

        $insert_stmt = $conn->prepare("
            INSERT INTO credit_applications (
                id,
                organisation_id,
                credit_tier_id,
                requested_limit,
                average_monthly_spend,
                bank_name,
                bank_account_number,
                bank_contact,
                trade_reference_1,
                trade_reference_2,
                notes,
                status
            ) VALUES (
                :id,
                :organisation_id,
                :credit_tier_id,
                :requested_limit,
                :average_monthly_spend,
                :bank_name,
                :bank_account_number,
                :bank_contact,
                :trade_reference_1,
                :trade_reference_2,
                :notes,
                :status
            )
        ");

        $insert_stmt->bindValue(":id", $id, PDO::PARAM_STR);
        $insert_stmt->bindValue(
            ":organisation_id",
            $organisation_id,
            PDO::PARAM_STR
        );
        $insert_stmt->bindValue(
            ":credit_tier_id",
            $credit_tier_id,
            PDO::PARAM_STR
        );
        $insert_stmt->bindValue(
            ":requested_limit",
            $requested_limit
        );

        $insert_stmt->bindValue(
            ":average_monthly_spend",
            $average_monthly_spend,
            $average_monthly_spend === null
                ? PDO::PARAM_NULL
                : PDO::PARAM_STR
        );

        $insert_stmt->bindValue(":bank_name", $bank_name, PDO::PARAM_STR);
        $insert_stmt->bindValue(
            ":bank_account_number",
            $bank_account_number,
            PDO::PARAM_STR
        );

        $insert_stmt->bindValue(
            ":bank_contact",
            $bank_contact === "" ? null : $bank_contact,
            $bank_contact === "" ? PDO::PARAM_NULL : PDO::PARAM_STR
        );

        $insert_stmt->bindValue(
            ":trade_reference_1",
            $trade_reference_1,
            PDO::PARAM_STR
        );

        $insert_stmt->bindValue(
            ":trade_reference_2",
            $trade_reference_2 === "" ? null : $trade_reference_2,
            $trade_reference_2 === "" ? PDO::PARAM_NULL : PDO::PARAM_STR
        );

        $insert_stmt->bindValue(
            ":notes",
            $notes === "" ? null : $notes,
            $notes === "" ? PDO::PARAM_NULL : PDO::PARAM_STR
        );

        $insert_stmt->bindValue(
            ":status",
            "PENDING_REVIEW",
            PDO::PARAM_STR
        );

        $insert_stmt->execute();

        $metadata = json_encode([
            "credit_tier_id" => $credit_tier_id,
            "credit_tier_name" => $tier["name"],
            "credit_tier_code" => $tier["code"],
            "requested_limit" => $requested_limit,
            "average_monthly_spend" => $average_monthly_spend,
            "status" => "PENDING_REVIEW"
        ]);

        $log_stmt = $conn->prepare("
            INSERT INTO activity_logs (
                id,
                request_id,
                organisation_id,
                actor_id,
                category,
                action,
                entity_type,
                entity_id,
                entity_reference,
                description,
                reason,
                old_values,
                new_values,
                metadata,
                ip_address,
                user_agent,
                severity
            ) VALUES (
                :id,
                :request_id,
                :organisation_id,
                :actor_id,
                :category,
                :action,
                :entity_type,
                :entity_id,
                :entity_reference,
                :description,
                :reason,
                :old_values,
                :new_values,
                :metadata,
                :ip_address,
                :user_agent,
                :severity
            )
        ");

        $ip_address = $_SERVER["REMOTE_ADDR"] ?? null;
        $user_agent = $_SERVER["HTTP_USER_AGENT"] ?? null;

        $log_stmt->bindValue(":id", generateId(), PDO::PARAM_STR);
        $log_stmt->bindValue(":request_id", null, PDO::PARAM_NULL);
        $log_stmt->bindValue(
            ":organisation_id",
            $organisation_id,
            PDO::PARAM_STR
        );
        $log_stmt->bindValue(":actor_id", $user_id, PDO::PARAM_STR);
        $log_stmt->bindValue(":category", "FINANCE", PDO::PARAM_STR);
        $log_stmt->bindValue(
            ":action",
            "CREDIT_APPLICATION_SUBMITTED",
            PDO::PARAM_STR
        );
        $log_stmt->bindValue(
            ":entity_type",
            "CREDIT_APPLICATION",
            PDO::PARAM_STR
        );
        $log_stmt->bindValue(":entity_id", $id, PDO::PARAM_STR);
        $log_stmt->bindValue(":entity_reference", null, PDO::PARAM_NULL);
        $log_stmt->bindValue(
            ":description",
            "Credit application submitted for review.",
            PDO::PARAM_STR
        );
        $log_stmt->bindValue(":reason", null, PDO::PARAM_NULL);
        $log_stmt->bindValue(":old_values", null, PDO::PARAM_NULL);
        $log_stmt->bindValue(":new_values", null, PDO::PARAM_NULL);
        $log_stmt->bindValue(":metadata", $metadata, PDO::PARAM_STR);

        $log_stmt->bindValue(
            ":ip_address",
            $ip_address,
            $ip_address === null ? PDO::PARAM_NULL : PDO::PARAM_STR
        );

        $log_stmt->bindValue(
            ":user_agent",
            $user_agent,
            $user_agent === null ? PDO::PARAM_NULL : PDO::PARAM_STR
        );

        $log_stmt->bindValue(":severity", "INFO", PDO::PARAM_STR);

        $log_stmt->execute();

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Your credit application has been submitted successfully.",
            "code" => [
                "id" => $id,
                "credit_tier" => $tier["name"],
                "requested_limit" => $requested_limit,
                "status" => "PENDING_REVIEW"
            ]
        ]);
        exit;

    } catch (PDOException $e) {
        if ($conn->inTransaction()) $conn->rollBack();
        
        echo json_encode([
            "error" => true,
            "data" => "Could not submit your credit application. Please try again.",
            "code" => null
        ]);
        exit;

    } catch (Throwable $e) {
        if ($conn->inTransaction()) $conn->rollBack();

        echo json_encode([
            "error" => true,
            "data" => "An unexpected error occurred while submitting your application.",
            "code" => null
        ]);
        exit;
    }