
<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

header("Content-Type: application/json; charset=UTF-8");

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "GET") {
    header("Allow: GET");
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed.",
        "code" => 405
    ]);
    exit;
}

if (
    empty($my_details->id) ||
    ($my_details->account_type ?? "") !== "system"
) {
    echo json_encode([
        "error" => true,
        "data" => "You are not authorised to access Operations manifest reviews.",
        "code" => 403
    ]);
    exit;
}

try {
    $sql = "
        SELECT
            om.id,
            om.manifest_ref,
            om.bill_of_lading,

            COALESCE(NULLIF(ps.vessel_name, ''), om.vessel) AS vessel,
            COALESCE(NULLIF(ps.shipping_line, ''), om.shipping_line) AS shipping_line,
            COALESCE(NULLIF(ps.origin_port, ''), om.origin_port) AS origin_port,
            COALESCE(
                NULLIF(ps.expected_arrival, '0000-00-00 00:00:00'),
                NULLIF(om.eta, '')
            ) AS eta,

            om.containers,

            COALESCE(
                NULLIF(ps.package_count, 0),
                NULLIF(om.packages, 0),
                0
            ) AS packages,

            COALESCE(
                NULLIF(ps.gross_weight, 0),
                NULLIF(om.gross_weight, ''),
                ''
            ) AS gross_weight,

            COALESCE(NULLIF(ps.consignee, ''), om.consignee) AS consignee,
            om.consignee_type,
            om.consignee_organisation_id,

            om.agent,
            om.agent_organisation_id,

            COALESCE(NULLIF(ps.consignee_email, ''), om.consignee_email) AS consignee_email,
            COALESCE(NULLIF(ps.consignee_phone, ''), om.consignee_phone) AS consignee_phone,
            om.consignee_address,

            om.source,
            om.status,
            om.notes,
            om.review_reason,
            om.review_responsible_party,
            om.flagged_by,
            om.flagged_at,
            om.duplicate_of,
            om.matched_shipment_id,
            om.created_by,
            om.validated_by,
            om.validated_at,
            om.received_at,
            om.updated_at,
            om.consignee_status,

            om.review_status,
            om.correction_reason,
            om.reviewed_by,
            om.reviewed_at,

            ps.id AS shipment_id,
            ps.shipment_reference,
            ps.user_id AS shipment_user_id,
            ps.organisation_id AS shipment_organisation_id,
            ps.shipment_type,
            ps.booking_number,
            ps.voyage_number,
            ps.origin_country,
            ps.destination_port,
            ps.cargo_description,
            ps.cargo_category,
            ps.package_type,
            ps.package_count AS shipment_package_count,
            ps.gross_weight AS shipment_gross_weight,
            ps.volume,
            ps.dangerous_goods,
            ps.temperature_controlled,
            ps.temperature,
            ps.special_instructions,
            ps.customs_reference,
            ps.status AS shipment_status,
            ps.created_at AS shipment_created_at,
            ps.updated_at AS shipment_updated_at

        FROM operation_manifests om

        LEFT JOIN portal_shipments ps
            ON ps.id = om.matched_shipment_id

        WHERE om.review_responsible_party = 'Operations'
            AND om.flagged_at IS NOT NULL
            AND om.status = 'Review required'

        ORDER BY om.flagged_at DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $manifests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $shipmentIds = [];

    foreach ($manifests as $manifest) {
        if (!empty($manifest["shipment_id"])) {
            $shipmentIds[] = (string) $manifest["shipment_id"];
        }
    }

    $shipmentIds = array_values(array_unique($shipmentIds));
    $containersByShipment = [];
    $containersById = [];

    if (!empty($shipmentIds)) {
        $placeholders = implode(",", array_fill(0, count($shipmentIds), "?"));

        $containerSql = "
            SELECT
                c.id,
                c.shipment_id,
                c.container_no,
                c.size,
                c.seal_no,
                c.package_count,
                c.gross_weight,
                c.package_type,
                c.status,
                c.gate_in_at,
                c.received_at,
                c.stored_at,
                c.current_location_id,
                c.gate_out_at,
                c.created_at,
                c.updated_at
            FROM portal_shipment_containers c
            WHERE c.shipment_id IN ($placeholders)
            ORDER BY c.created_at ASC, c.container_no ASC
        ";

        $containerStmt = $conn->prepare($containerSql);
        $containerStmt->execute($shipmentIds);

        $containers = $containerStmt->fetchAll(PDO::FETCH_ASSOC);
        $containerIds = [];

        foreach ($containers as $container) {
            $containerId = (string) $container["id"];
            $shipmentId = (string) $container["shipment_id"];

            $container["items"] = [];
            $container["item_count"] = 0;

            foreach (["package_count", "gross_weight"] as $field) {
                $container[$field] = $container[$field] !== null
                    ? (float) $container[$field]
                    : null;
            }

            $containersByShipment[$shipmentId][] = $container;

            $containersById[$containerId] = [
                "shipment_id" => $shipmentId,
                "index" => count($containersByShipment[$shipmentId]) - 1
            ];

            $containerIds[] = $containerId;
        }

        if (!empty($containerIds)) {
            $itemPlaceholders = implode(
                ",",
                array_fill(0, count($containerIds), "?")
            );

            $itemSql = "
                SELECT
                    i.id,
                    i.container_id,
                    i.customs_tariff_id,
                    ct.hs_code,
                    i.item_description,
                    ct.description AS customs_tariff_description,
                    i.quantity,
                    i.unit_of_measure,
                    i.unit_value,
                    i.currency,
                    i.total_value,
                    i.created_at,
                    i.updated_at
                FROM portal_shipment_container_items i
                LEFT JOIN customs_tariffs ct
                    ON ct.id = i.customs_tariff_id
                WHERE i.container_id IN ($itemPlaceholders)
                ORDER BY i.created_at ASC, i.id ASC
            ";

            $itemStmt = $conn->prepare($itemSql);
            $itemStmt->execute($containerIds);

            $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($items as $item) {
                $containerId = (string) $item["container_id"];

                if (!isset($containersById[$containerId])) {
                    continue;
                }

                $shipmentId = $containersById[$containerId]["shipment_id"];
                $containerIndex = $containersById[$containerId]["index"];

                $item["quantity"] = $item["quantity"] !== null
                    ? (float) $item["quantity"]
                    : null;

                $item["unit_value"] = $item["unit_value"] !== null
                    ? (float) $item["unit_value"]
                    : null;

                $item["total_value"] = $item["total_value"] !== null
                    ? (float) $item["total_value"]
                    : null;

                $containersByShipment[$shipmentId][$containerIndex]["items"][] = $item;

                $containersByShipment[$shipmentId][$containerIndex]["item_count"]++;
            }
        }
    }

    foreach ($manifests as &$manifest) {
        $shipmentId = $manifest["shipment_id"] ?? null;

        $manifest["shipment_containers"] = $shipmentId !== null
            ? ($containersByShipment[(string) $shipmentId] ?? [])
            : [];

        $manifest["container_count"] = count($manifest["shipment_containers"]);

        $manifest["packages"] = (float) ($manifest["packages"] ?? 0);

        $manifest["gross_weight"] = is_numeric($manifest["gross_weight"])
            ? (float) $manifest["gross_weight"]
            : $manifest["gross_weight"];

        if ($manifest["shipment_id"] !== null) {
            $manifest["shipment"] = [
                "id" => $manifest["shipment_id"],
                "shipment_reference" => $manifest["shipment_reference"],
                "user_id" => $manifest["shipment_user_id"],
                "organisation_id" => $manifest["shipment_organisation_id"],
                "shipment_type" => $manifest["shipment_type"],
                "booking_number" => $manifest["booking_number"],
                "voyage_number" => $manifest["voyage_number"],
                "origin_country" => $manifest["origin_country"],
                "destination_port" => $manifest["destination_port"],
                "cargo_description" => $manifest["cargo_description"],
                "cargo_category" => $manifest["cargo_category"],
                "package_type" => $manifest["package_type"],
                "package_count" => $manifest["shipment_package_count"] !== null
                    ? (float) $manifest["shipment_package_count"]
                    : null,
                "gross_weight" => $manifest["shipment_gross_weight"] !== null
                    ? (float) $manifest["shipment_gross_weight"]
                    : null,
                "volume" => $manifest["volume"] !== null
                    ? (float) $manifest["volume"]
                    : null,
                "dangerous_goods" => $manifest["dangerous_goods"],
                "temperature_controlled" => $manifest["temperature_controlled"],
                "temperature" => $manifest["temperature"],
                "special_instructions" => $manifest["special_instructions"],
                "customs_reference" => $manifest["customs_reference"],
                "status" => $manifest["shipment_status"],
                "created_at" => $manifest["shipment_created_at"],
                "updated_at" => $manifest["shipment_updated_at"],
                "containers" => $manifest["shipment_containers"]
            ];
        } else {
            $manifest["shipment"] = null;
        }
    }

    unset($manifest);

    echo json_encode([
        "error" => false,
        "data" => $manifests,
        "code" => null
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    error_log("Operations manifest reviews error: " . $e->getMessage());

    echo json_encode([
        "error" => true,
        "data" => "Could not load Operations manifest reviews.",
        "code" => $e instanceof PDOException ? $e->getCode() : null
    ]);
}
