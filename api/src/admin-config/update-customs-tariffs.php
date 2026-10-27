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
        $import_dutyInput = trim((string) ($_POST["import_duty"] ?? ""));
        $vatInput = trim((string) ($_POST["vat"] ?? ""));
        $levyInput = trim((string) ($_POST["levy"] ?? ""));
        $excInput = trim((string) ($_POST["exc"] ?? ""));
        $wglInput = trim((string) ($_POST["wgl"] ?? ""));
        $ricInput = trim((string) ($_POST["ric"] ?? ""));
        $brlInput = trim((string) ($_POST["brl"] ?? ""));
        $wflInput = trim((string) ($_POST["wfl"] ?? ""));
        $sugInput = trim((string) ($_POST["sug"] ?? ""));
        $cemInput = trim((string) ($_POST["cem"] ?? ""));
        $cigInput = trim((string) ($_POST["cig"] ?? ""));
        $iroInput = trim((string) ($_POST["iro"] ?? ""));
        $crlInput = trim((string) ($_POST["crl"] ?? ""));
        $tplInput = trim((string) ($_POST["tpl"] ?? ""));
        $nauInput = trim((string) ($_POST["nau"] ?? ""));
        $nanInput = trim((string) ($_POST["nan"] ?? ""));
        $gtsInput = trim((string) ($_POST["gts"] ?? ""));
        $t5Input = trim((string) ($_POST["t5"] ?? ""));
        $t6Input = trim((string) ($_POST["t6"] ?? ""));
        $t7Input = trim((string) ($_POST["t7"] ?? ""));
        $t8Input = trim((string) ($_POST["t8"] ?? ""));
        $t9Input = trim((string) ($_POST["t9"] ?? ""));
        $t10Input = trim((string) ($_POST["t10"] ?? ""));
        $dateOfVersion = trim($_POST["date_of_version"] ?? "");

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

        $versionDate = null;
        if ($dateOfVersion !== "") {
            $versionDate = DateTimeImmutable::createFromFormat("!Y-m-d", $dateOfVersion);
            $versionErrors = DateTimeImmutable::getLastErrors();
            if (!$versionDate || ($versionErrors !== false && ($versionErrors["warning_count"] > 0 || $versionErrors["error_count"] > 0)) || $versionDate->format("Y-m-d") !== $dateOfVersion) {
                http_response_code(422);
                echo json_encode(["error" => true, "data" => "Invalid date of version.", "code" => null]);
                exit;
            }
        }

        $extraValues = [];
        if ($import_dutyInput !== "" && (!is_numeric($import_dutyInput) || !is_finite((float) $import_dutyInput) || (float) $import_dutyInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The import duty value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["import_duty"] = $import_dutyInput === "" ? null : (float) $import_dutyInput;
        if ($vatInput !== "" && (!is_numeric($vatInput) || !is_finite((float) $vatInput) || (float) $vatInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The vat value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["vat"] = $vatInput === "" ? null : (float) $vatInput;
        if ($levyInput !== "" && (!is_numeric($levyInput) || !is_finite((float) $levyInput) || (float) $levyInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The levy value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["levy"] = $levyInput === "" ? null : (float) $levyInput;
        if ($excInput !== "" && (!is_numeric($excInput) || !is_finite((float) $excInput) || (float) $excInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The exc value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["exc"] = $excInput === "" ? null : (float) $excInput;
        if ($wglInput !== "" && (!is_numeric($wglInput) || !is_finite((float) $wglInput) || (float) $wglInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The wgl value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["wgl"] = $wglInput === "" ? null : (float) $wglInput;
        if ($ricInput !== "" && (!is_numeric($ricInput) || !is_finite((float) $ricInput) || (float) $ricInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The ric value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["ric"] = $ricInput === "" ? null : (float) $ricInput;
        if ($brlInput !== "" && (!is_numeric($brlInput) || !is_finite((float) $brlInput) || (float) $brlInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The brl value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["brl"] = $brlInput === "" ? null : (float) $brlInput;
        if ($wflInput !== "" && (!is_numeric($wflInput) || !is_finite((float) $wflInput) || (float) $wflInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The wfl value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["wfl"] = $wflInput === "" ? null : (float) $wflInput;
        if ($sugInput !== "" && (!is_numeric($sugInput) || !is_finite((float) $sugInput) || (float) $sugInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The sug value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["sug"] = $sugInput === "" ? null : (float) $sugInput;
        if ($cemInput !== "" && (!is_numeric($cemInput) || !is_finite((float) $cemInput) || (float) $cemInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The cem value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["cem"] = $cemInput === "" ? null : (float) $cemInput;
        if ($cigInput !== "" && (!is_numeric($cigInput) || !is_finite((float) $cigInput) || (float) $cigInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The cig value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["cig"] = $cigInput === "" ? null : (float) $cigInput;
        if ($iroInput !== "" && (!is_numeric($iroInput) || !is_finite((float) $iroInput) || (float) $iroInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The iro value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["iro"] = $iroInput === "" ? null : (float) $iroInput;
        if ($crlInput !== "" && (!is_numeric($crlInput) || !is_finite((float) $crlInput) || (float) $crlInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The crl value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["crl"] = $crlInput === "" ? null : (float) $crlInput;
        if ($tplInput !== "" && (!is_numeric($tplInput) || !is_finite((float) $tplInput) || (float) $tplInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The tpl value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["tpl"] = $tplInput === "" ? null : (float) $tplInput;
        if ($nauInput !== "" && (!is_numeric($nauInput) || !is_finite((float) $nauInput) || (float) $nauInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The nau value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["nau"] = $nauInput === "" ? null : (float) $nauInput;
        if ($nanInput !== "" && (!is_numeric($nanInput) || !is_finite((float) $nanInput) || (float) $nanInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The nan value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["nan"] = $nanInput === "" ? null : (float) $nanInput;
        if ($gtsInput !== "" && (!is_numeric($gtsInput) || !is_finite((float) $gtsInput) || (float) $gtsInput < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The gts value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["gts"] = $gtsInput === "" ? null : (float) $gtsInput;
        if ($t5Input !== "" && (!is_numeric($t5Input) || !is_finite((float) $t5Input) || (float) $t5Input < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The t5 value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["t5"] = $t5Input === "" ? null : (float) $t5Input;
        if ($t6Input !== "" && (!is_numeric($t6Input) || !is_finite((float) $t6Input) || (float) $t6Input < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The t6 value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["t6"] = $t6Input === "" ? null : (float) $t6Input;
        if ($t7Input !== "" && (!is_numeric($t7Input) || !is_finite((float) $t7Input) || (float) $t7Input < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The t7 value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["t7"] = $t7Input === "" ? null : (float) $t7Input;
        if ($t8Input !== "" && (!is_numeric($t8Input) || !is_finite((float) $t8Input) || (float) $t8Input < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The t8 value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["t8"] = $t8Input === "" ? null : (float) $t8Input;
        if ($t9Input !== "" && (!is_numeric($t9Input) || !is_finite((float) $t9Input) || (float) $t9Input < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The t9 value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["t9"] = $t9Input === "" ? null : (float) $t9Input;
        if ($t10Input !== "" && (!is_numeric($t10Input) || !is_finite((float) $t10Input) || (float) $t10Input < 0)) {
            http_response_code(422);
            echo json_encode(["error" => true, "data" => "The t10 value must be a non-negative number.", "code" => null]);
            exit;
        }
        $extraValues["t10"] = $t10Input === "" ? null : (float) $t10Input;


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
                    import_duty = :import_duty,
                    vat = :vat,
                    levy = :levy,
                    exc = :exc,
                    wgl = :wgl,
                    ric = :ric,
                    brl = :brl,
                    wfl = :wfl,
                    sug = :sug,
                    cem = :cem,
                    cig = :cig,
                    iro = :iro,
                    crl = :crl,
                    tpl = :tpl,
                    nau = :nau,
                    nan = :nan,
                    gts = :gts,
                    t5 = :t5,
                    t6 = :t6,
                    t7 = :t7,
                    t8 = :t8,
                    t9 = :t9,
                    t10 = :t10,
                    date_of_version = :date_of_version,
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
                ":import_duty" => $extraValues["import_duty"],
                ":vat" => $extraValues["vat"],
                ":levy" => $extraValues["levy"],
                ":exc" => $extraValues["exc"],
                ":wgl" => $extraValues["wgl"],
                ":ric" => $extraValues["ric"],
                ":brl" => $extraValues["brl"],
                ":wfl" => $extraValues["wfl"],
                ":sug" => $extraValues["sug"],
                ":cem" => $extraValues["cem"],
                ":cig" => $extraValues["cig"],
                ":iro" => $extraValues["iro"],
                ":crl" => $extraValues["crl"],
                ":tpl" => $extraValues["tpl"],
                ":nau" => $extraValues["nau"],
                ":nan" => $extraValues["nan"],
                ":gts" => $extraValues["gts"],
                ":t5" => $extraValues["t5"],
                ":t6" => $extraValues["t6"],
                ":t7" => $extraValues["t7"],
                ":t8" => $extraValues["t8"],
                ":t9" => $extraValues["t9"],
                ":t10" => $extraValues["t10"],
                ":date_of_version" => $versionDate ? $versionDate->format("Y-m-d") : null,
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
                    import_duty,
                    vat,
                    levy,
                    exc,
                    wgl,
                    ric,
                    brl,
                    wfl,
                    sug,
                    cem,
                    cig,
                    iro,
                    crl,
                    tpl,
                    nau,
                    nan,
                    gts,
                    t5,
                    t6,
                    t7,
                    t8,
                    t9,
                    t10,
                    date_of_version,
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
                    :import_duty,
                    :vat,
                    :levy,
                    :exc,
                    :wgl,
                    :ric,
                    :brl,
                    :wfl,
                    :sug,
                    :cem,
                    :cig,
                    :iro,
                    :crl,
                    :tpl,
                    :nau,
                    :nan,
                    :gts,
                    :t5,
                    :t6,
                    :t7,
                    :t8,
                    :t9,
                    :t10,
                    :date_of_version,
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
                ":import_duty" => $extraValues["import_duty"],
                ":vat" => $extraValues["vat"],
                ":levy" => $extraValues["levy"],
                ":exc" => $extraValues["exc"],
                ":wgl" => $extraValues["wgl"],
                ":ric" => $extraValues["ric"],
                ":brl" => $extraValues["brl"],
                ":wfl" => $extraValues["wfl"],
                ":sug" => $extraValues["sug"],
                ":cem" => $extraValues["cem"],
                ":cig" => $extraValues["cig"],
                ":iro" => $extraValues["iro"],
                ":crl" => $extraValues["crl"],
                ":tpl" => $extraValues["tpl"],
                ":nau" => $extraValues["nau"],
                ":nan" => $extraValues["nan"],
                ":gts" => $extraValues["gts"],
                ":t5" => $extraValues["t5"],
                ":t6" => $extraValues["t6"],
                ":t7" => $extraValues["t7"],
                ":t8" => $extraValues["t8"],
                ":t9" => $extraValues["t9"],
                ":t10" => $extraValues["t10"],
                ":date_of_version" => $versionDate ? $versionDate->format("Y-m-d") : null,
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
                date_of_version,
                import_duty,
                vat,
                levy,
                exc,
                wgl,
                ric,
                brl,
                wfl,
                sug,
                cem,
                cig,
                iro,
                crl,
                tpl,
                nau,
                nan,
                gts,
                t5,
                t6,
                t7,
                t8,
                t9,
                t10,
                DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
            FROM customs_tariffs
            WHERE id = :id
            LIMIT 1
        ");
        $q->execute([":id" => $id]);
        $tariff = $q->fetch(PDO::FETCH_ASSOC);

        if ($tariff) {
            $tariff["rate"] = (float) $tariff["rate"];
            $tariff["import_duty"] = $tariff["import_duty"] === null ? null : (float) $tariff["import_duty"];
            $tariff["vat"] = $tariff["vat"] === null ? null : (float) $tariff["vat"];
            $tariff["levy"] = $tariff["levy"] === null ? null : (float) $tariff["levy"];
            $tariff["exc"] = $tariff["exc"] === null ? null : (float) $tariff["exc"];
            $tariff["wgl"] = $tariff["wgl"] === null ? null : (float) $tariff["wgl"];
            $tariff["ric"] = $tariff["ric"] === null ? null : (float) $tariff["ric"];
            $tariff["brl"] = $tariff["brl"] === null ? null : (float) $tariff["brl"];
            $tariff["wfl"] = $tariff["wfl"] === null ? null : (float) $tariff["wfl"];
            $tariff["sug"] = $tariff["sug"] === null ? null : (float) $tariff["sug"];
            $tariff["cem"] = $tariff["cem"] === null ? null : (float) $tariff["cem"];
            $tariff["cig"] = $tariff["cig"] === null ? null : (float) $tariff["cig"];
            $tariff["iro"] = $tariff["iro"] === null ? null : (float) $tariff["iro"];
            $tariff["crl"] = $tariff["crl"] === null ? null : (float) $tariff["crl"];
            $tariff["tpl"] = $tariff["tpl"] === null ? null : (float) $tariff["tpl"];
            $tariff["nau"] = $tariff["nau"] === null ? null : (float) $tariff["nau"];
            $tariff["nan"] = $tariff["nan"] === null ? null : (float) $tariff["nan"];
            $tariff["gts"] = $tariff["gts"] === null ? null : (float) $tariff["gts"];
            $tariff["t5"] = $tariff["t5"] === null ? null : (float) $tariff["t5"];
            $tariff["t6"] = $tariff["t6"] === null ? null : (float) $tariff["t6"];
            $tariff["t7"] = $tariff["t7"] === null ? null : (float) $tariff["t7"];
            $tariff["t8"] = $tariff["t8"] === null ? null : (float) $tariff["t8"];
            $tariff["t9"] = $tariff["t9"] === null ? null : (float) $tariff["t9"];
            $tariff["t10"] = $tariff["t10"] === null ? null : (float) $tariff["t10"];

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