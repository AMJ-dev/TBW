<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
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
            ORDER BY hs_code ASC, effective_from DESC
        ");
        $q->execute();

        $tariffs = $q->fetchAll(PDO::FETCH_ASSOC);

        foreach ($tariffs as &$tariff) {
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
        unset($tariff);

        echo json_encode([
            "error" => false,
            "data" => "Customs tariffs loaded successfully.",
            "code" => [
                "tariffs" => $tariffs
            ]
        ]);
    } catch (Throwable $e) {
        error_log("Customs tariffs load error: " . $e->getMessage());
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not load customs tariffs.",
            "code" => null
        ]);
    }