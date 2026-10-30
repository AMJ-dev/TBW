<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    header("Content-Type: application/json; charset=UTF-8");

    if (($my_details->account_type ?? "") !== "system" || empty($my_details->id)) {
        echo json_encode([
            "error" => true,
            "data" => "Access denied.",
            "code" => null
        ]);
        exit;
    }

    if (($_SERVER["REQUEST_METHOD"] ?? "") !== "GET") {
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

        $manifest["shipment"] = null;
        $manifest["containers"] = [];
        $manifest["container_count"] = 0;
        $manifest["containers_count"] = 0;

        if ($isLinked) {
            $shipmentId = $linkedShipmentId;

            $shipmentStmt = $conn->prepare("
                SELECT
                    s.*,
                    o.organisation_name,
                    o.organisation_name AS organisation_display_name,
                    consignee_org.organisation_name AS consignee_organisation_name,
                    agent_org.organisation_name AS agent_organisation_name,
                    agent_org.rc_number AS agent_licence_number,
                    agent_org.contact_email AS agent_contact_email,
                    agent_org.contact_phone AS agent_contact_phone,
                    agent_org.verification_status AS agent_verification_status
                FROM portal_shipments s
                LEFT JOIN organisations o
                    ON o.id = s.organisation_id
                LEFT JOIN organisations consignee_org
                    ON consignee_org.id = s.consignee_organisation_id
                LEFT JOIN organisations agent_org
                    ON agent_org.id = s.licensed_agent_id
                WHERE s.id = :shipment_id
                LIMIT 1
            ");

            $shipmentStmt->execute([
                ":shipment_id" => $shipmentId
            ]);

            $shipment = $shipmentStmt->fetch(PDO::FETCH_ASSOC);

            if ($shipment) {
                unset($shipment["hs_code"]);

                $shipment["consignee_details"] = [
                    "type" => $shipment["consignee_type"] ?? "organisation",
                    "organisation_id" => $shipment["consignee_organisation_id"] ?? null,
                    "organisation_name" => $shipment["consignee_organisation_name"] ?? $shipment["consignee"] ?? "",
                    "status" => $shipment["consignee_status"] ?? "unregistered",
                    "contact_person" => $shipment["consignee_contact_person"] ?? "",
                    "name" => $shipment["consignee"] ?? "",
                    "email" => $shipment["consignee_email"] ?? "",
                    "phone" => $shipment["consignee_phone"] ?? "",
                    "address" => $shipment["consignee_address"] ?? "",
                    "country" => $shipment["consignee_country"] ?? ""
                ];

                $shipment["agent"] = [
                    "id" => $shipment["licensed_agent_id"] ?? null,
                    "name" => $shipment["agent_organisation_name"] ?? $shipment["licensed_agent_name"] ?? "",
                    "licence_number" => $shipment["agent_licence_number"] ?? "",
                    "contact_email" => $shipment["agent_contact_email"] ?? "",
                    "contact_phone" => $shipment["agent_contact_phone"] ?? "",
                    "verification_status" => $shipment["agent_verification_status"] ?? null
                ];

                $containerStmt = $conn->prepare("
                    SELECT
                        c.id,
                        c.shipment_id,
                        c.container_no,
                        c.size,
                        c.seal_no,
                        c.package_count,
                        c.gross_weight,
                        c.cargo_description,
                        c.package_type,
                        c.hs_code,
                        c.customs_tariff_id,
                        ct.hs_code AS tariff_hs_code,
                        ct.description AS customs_tariff_description,
                        c.item_quantity,
                        c.unit_of_measure,
                        c.unit_value,
                        c.currency,
                        c.total_value,
                        c.status,
                        c.gate_in_at,
                        c.received_at,
                        c.stored_at,
                        c.gate_out_at,
                        c.created_at,
                        c.updated_at
                    FROM portal_shipment_containers c
                    LEFT JOIN customs_tariffs ct
                        ON ct.id = c.customs_tariff_id
                    WHERE c.shipment_id = :shipment_id
                    ORDER BY c.container_no ASC, c.created_at ASC
                ");

                $containerStmt->execute([
                    ":shipment_id" => $shipmentId
                ]);

                $containers = $containerStmt->fetchAll(PDO::FETCH_ASSOC);

                $shipment["containers"] = $containers;
                $shipment["container_count"] = count($containers);
                $shipment["containers_count"] = count($containers);

                $manifest["shipment"] = $shipment;
                $manifest["containers"] = $containers;
                $manifest["container_count"] = count($containers);
                $manifest["containers_count"] = count($containers);
            }
        }

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

        echo json_encode([
            "error" => true,
            "data" => "Could not load this manifest.",
            "code" => null
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    }