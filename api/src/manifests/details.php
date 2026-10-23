<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    header("Content-Type: application/json; charset=UTF-8");

    if (($my_details->account_type ?? "") !== "system" || empty($my_details->id)) {
        http_response_code(403);
        echo json_encode([
            "error" => true,
            "data" => "Access denied.",
            "code" => null
        ]);
        exit;
    }

    if (($_SERVER["REQUEST_METHOD"] ?? "") !== "GET") {
        http_response_code(405);
        header("Allow: GET");
        echo json_encode([
            "error" => true,
            "data" => "Method not allowed.",
            "code" => null
        ]);
        exit;
    }

    $id = trim((string) ($_GET["id"] ?? ""));

    if ($id === "") {
        $path = parse_url((string) ($_SERVER["REQUEST_URI"] ?? ""), PHP_URL_PATH);

        if (
            is_string($path) &&
            preg_match('~/operations/manifests/details/([^/]+)/?$~', $path, $matches)
        ) {
            $id = rawurldecode($matches[1]);
        }
    }

    if ($id === "" || strlen($id) > 100) {
        http_response_code(400);
        echo json_encode([
            "error" => true,
            "data" => "A valid manifest ID is required.",
            "code" => null
        ]);
        exit;
    }

    try {
        $stmt = $conn->prepare("
            SELECT
                m.*,
                ps.id AS linked_shipment_exists_id,
                ps.shipment_reference AS linked_shipment_reference,
                ps.status AS linked_shipment_status,
                ps.organisation_id AS linked_shipment_organisation_id,
                ps.bill_of_lading AS linked_shipment_bill_of_lading
            FROM operation_manifests m
            LEFT JOIN portal_shipments ps
                ON ps.id = m.matched_shipment_id
            WHERE m.id = :id
            LIMIT 1
        ");

        $stmt->execute([
            ":id" => $id
        ]);

        $manifest = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$manifest) {
            http_response_code(404);
            echo json_encode([
                "error" => true,
                "data" => "Manifest not found.",
                "code" => null
            ]);
            exit;
        }

        $matchedShipmentId = trim(
            (string) ($manifest["matched_shipment_id"] ?? "")
        );

        $linkedShipmentId = trim(
            (string) ($manifest["linked_shipment_exists_id"] ?? "")
        );

        $shipmentReference = trim(
            (string) ($manifest["linked_shipment_reference"] ?? "")
        );

        $shipmentStatus = $manifest["linked_shipment_status"] ?? null;

        $shipmentOrganisationId =
            $manifest["linked_shipment_organisation_id"] ?? null;

        $shipmentBillOfLading = trim(
            (string) ($manifest["linked_shipment_bill_of_lading"] ?? "")
        );

        $isLinked = $linkedShipmentId !== "";

        $manifest["matched_shipment_id"] =
            $matchedShipmentId !== "" ? $matchedShipmentId : null;

        $manifest["shipment_reference"] =
            $shipmentReference !== "" ? $shipmentReference : null;

        $manifest["shipment_status"] = $shipmentStatus;

        $manifest["shipment_organisation_id"] = $shipmentOrganisationId;

        $manifest["shipment_bill_of_lading"] =
            $shipmentBillOfLading !== "" ? $shipmentBillOfLading : null;

        $manifest["shipment_linked"] = $isLinked;

        $manifest["shipment_link_status"] = $isLinked
            ? "linked"
            : "unmatched";

        $manifest["shipment_link_message"] = $isLinked
            ? "A shipment declaration is linked to this manifest."
            : "No shipment declaration is currently linked to this manifest. The organisation may not have submitted its declaration, or the records may not have been matched.";

        unset(
            $manifest["linked_shipment_exists_id"],
            $manifest["linked_shipment_reference"],
            $manifest["linked_shipment_status"],
            $manifest["linked_shipment_organisation_id"],
            $manifest["linked_shipment_bill_of_lading"]
        );

        if (
            isset($manifest["consignee"]) &&
            is_string($manifest["consignee"])
        ) {
            $manifest["consignee"] = trim($manifest["consignee"]);
        }

        if (
            isset($manifest["agent"]) &&
            is_string($manifest["agent"])
        ) {
            $manifest["agent"] = trim($manifest["agent"]);
        }

        echo json_encode([
            "error" => false,
            "data" => "Manifest loaded successfully.",
            "code" => [
                "manifest" => $manifest
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);

    } catch (Throwable $e) {
        http_response_code(500);

        echo json_encode([
            "error" => true,
            "data" => "Could not load this manifest.",
            "code" => null
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    }