<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if (!in_array(($_SERVER["REQUEST_METHOD"] ?? ""), ["GET", "POST"], true)) {
    header("Allow: GET, POST");
    echo json_encode([
        "error" => true,
        "data" => "Method not allowed.",
        "code" => null
    ]);
    exit;
}

$q = trim((string) ($_GET["q"] ?? $_POST["q"] ?? ""));

if (strlen($q) < 2) {
    echo json_encode([
        "error" => false,
        "data" => "Enter at least two characters.",
        "code" => []
    ]);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT
            s.id,
            s.user_id,
            s.organisation_id,
            o.organisation_name,
            s.shipment_reference,
            s.shipment_type,
            s.bill_of_lading,
            s.booking_number,
            s.vessel_name,
            s.voyage_number,
            s.shipping_line,
            s.origin_country,
            s.origin_port,
            s.destination_port,
            s.expected_arrival,
            s.consignee,
            s.consignee_email,
            s.consignee_phone,
            s.consignee_type,
            s.consignee_organisation_id,
            s.consignee_status,
            s.consignee_contact_person,
            s.consignee_address,
            s.consignee_country,
            consignee_org.organisation_name AS consignee_organisation_name,
            s.licensed_agent_id,
            s.licensed_agent_name,
            agent_org.organisation_name AS registered_agent_name,
            agent_org.rc_number AS agent_licence_number,
            agent_org.contact_email AS agent_contact_email,
            agent_org.contact_phone AS agent_contact_phone,
            agent_org.verification_status AS agent_verification_status,
            s.cargo_description,
            s.cargo_category,
            s.package_type,
            s.package_count,
            s.gross_weight,
            s.volume,
            s.hs_code,
            s.dangerous_goods,
            s.temperature_controlled,
            s.temperature,
            s.special_instructions,
            s.customs_reference,
            s.status,
            s.created_at,
            s.updated_at
        FROM portal_shipments s
        LEFT JOIN organisations o ON o.id = s.organisation_id
        LEFT JOIN organisations consignee_org ON consignee_org.id = s.consignee_organisation_id
        LEFT JOIN organisations agent_org ON agent_org.id = s.licensed_agent_id
        WHERE
            s.shipment_reference LIKE :ref
            OR s.bill_of_lading LIKE :bl
            OR s.booking_number LIKE :booking
            OR s.consignee LIKE :consignee
            OR s.consignee_email LIKE :consignee_email
            OR s.consignee_phone LIKE :consignee_phone
            OR s.vessel_name LIKE :vessel
            OR s.shipping_line LIKE :shipping_line
            OR s.licensed_agent_name LIKE :agent_name
            OR agent_org.organisation_name LIKE :registered_agent
        ORDER BY
            CASE
                WHEN s.bill_of_lading = :exact_bl THEN 0
                WHEN s.shipment_reference = :exact_ref THEN 1
                WHEN s.booking_number = :exact_booking THEN 2
                ELSE 3
            END,
            s.created_at DESC
        LIMIT 20
    ");

    $like = "%" . $q . "%";
    $stmt->execute([
        ":ref" => $like,
        ":bl" => $like,
        ":booking" => $like,
        ":consignee" => $like,
        ":consignee_email" => $like,
        ":consignee_phone" => $like,
        ":vessel" => $like,
        ":shipping_line" => $like,
        ":agent_name" => $like,
        ":registered_agent" => $like,
        ":exact_bl" => $q,
        ":exact_ref" => $q,
        ":exact_booking" => $q
    ]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($rows) {
        $ids = array_column($rows, "id");
        $placeholders = implode(",", array_fill(0, count($ids), "?"));

        $containerQuery = $conn->prepare("
            SELECT
                id,
                shipment_id,
                container_no,
                size,
                seal_no,
                package_count,
                gross_weight,
                status,
                gate_in_at,
                received_at,
                stored_at,
                gate_out_at,
                created_at,
                updated_at
            FROM portal_shipment_containers
            WHERE shipment_id IN ($placeholders)
            ORDER BY container_no ASC, created_at ASC
        ");
        $containerQuery->execute($ids);

        $containersByShipment = [];
        foreach ($containerQuery->fetchAll(PDO::FETCH_ASSOC) as $container) {
            $containersByShipment[$container["shipment_id"]][] = $container;
        }

        $manifestQuery = $conn->prepare("
            SELECT
                om.id,
                om.manifest_ref,
                om.bill_of_lading,
                om.status,
                om.review_reason,
                om.review_responsible_party,
                om.flagged_at,
                om.notes,
                om.received_at,
                om.updated_at,
                om.matched_shipment_id
            FROM operation_manifests om
            WHERE om.matched_shipment_id IN ($placeholders)
               OR EXISTS (
                    SELECT 1
                    FROM operation_manifest_shipment_matches omsm
                    WHERE omsm.manifest_id = om.id
                      AND omsm.shipment_id IN ($placeholders)
               )
            ORDER BY om.updated_at DESC, om.received_at DESC
        ");
        $manifestQuery->execute(array_merge($ids, $ids));

        $manifestsByShipment = [];
        foreach ($manifestQuery->fetchAll(PDO::FETCH_ASSOC) as $manifest) {
            $shipmentKey = (string) ($manifest["matched_shipment_id"] ?? "");
            if ($shipmentKey !== "") {
                $manifestsByShipment[$shipmentKey][] = $manifest;
            }
        }

        foreach ($rows as &$row) {
            $shipmentId = (string) $row["id"];
            $shipmentContainers = $containersByShipment[$shipmentId] ?? [];
            $row["containers"] = $shipmentContainers;
            $row["container_count"] = count($shipmentContainers);
            $row["containers_count"] = count($shipmentContainers);
            $row["manifest_matches"] = $manifestsByShipment[$shipmentId] ?? [];
            $row["manifest"] = $row["manifest_matches"][0] ?? null;

            $row["consignee"] = [
                "type" => $row["consignee_type"] ?? "organisation",
                "organisation_id" => $row["consignee_organisation_id"] ?? null,
                "organisation_name" => $row["consignee_organisation_name"] ?? $row["consignee"] ?? "",
                "status" => $row["consignee_status"] ?? "unregistered",
                "contact_person" => $row["consignee_contact_person"] ?? "",
                "name" => $row["consignee"] ?? "",
                "email" => $row["consignee_email"] ?? "",
                "phone" => $row["consignee_phone"] ?? "",
                "address" => $row["consignee_address"] ?? "",
                "country" => $row["consignee_country"] ?? ""
            ];

            $row["agent"] = [
                "id" => $row["licensed_agent_id"] ?? null,
                "name" => $row["registered_agent_name"] ?? $row["licensed_agent_name"] ?? "",
                "licence_number" => $row["agent_licence_number"] ?? "",
                "contact_email" => $row["agent_contact_email"] ?? "",
                "contact_phone" => $row["agent_contact_phone"] ?? "",
                "verification_status" => $row["agent_verification_status"] ?? null
            ];

            $row["agent_id"] = $row["licensed_agent_id"] ?? null;
            $row["agent_name"] = $row["registered_agent_name"] ?? $row["licensed_agent_name"] ?? "";
            $row["agent_licence_number"] = $row["agent_licence_number"] ?? "";
        }
        unset($row);
    }

    echo json_encode([
        "error" => false,
        "data" => "Shipment declarations loaded.",
        "code" => $rows
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    echo json_encode([
        "error" => true,
        "data" => "Unable to search shipment declarations.",
        "code" => null
    ]);
}
