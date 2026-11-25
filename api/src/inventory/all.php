
<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    try {
        $sql = "
            SELECT
                c.id,
                c.container_no,
                c.size,
                c.status AS container_status,
                c.package_count,
                c.package_type AS container_package_type,
                c.gross_weight,
                s.cargo_description AS container_description,
                c.received_at,
                c.created_at AS container_created_at,

                s.shipment_reference,
                s.bill_of_lading,
                s.consignee,
                s.cargo_description,
                s.package_type,
                s.package_count AS shipment_package_count,
                s.gross_weight AS shipment_gross_weight,
                s.volume,
                s.special_instructions,
                s.status AS shipment_status,

                l.id AS location_id,
                l.code AS location_code,
                l.name AS location_name,
                l.kind AS location_kind

            FROM portal_shipment_containers c

            INNER JOIN portal_shipments s
                ON s.id = c.shipment_id

            LEFT JOIN terminal_locations l
                ON l.id = c.current_location_id

            WHERE c.status NOT IN (
                'EXPECTED',
                'SCHEDULED',
                'ENTERED',
                'GATE_OUT',
                'TRANSFERRED_OUT',
                'RETURNED_RE_EXPORTED',
                'CANCELLED'
            )
            AND c.received_at IS NOT NULL
            AND c.gate_out_at IS NULL

            ORDER BY
                COALESCE(c.received_at, c.created_at) DESC
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute();

        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $data = array_map(function ($row) {
            $containerStatus = $row["container_status"];

            $status = match ($containerStatus) {
                "EXPECTED" => "Expected",
                "SCHEDULED" => "Scheduled",
                "ENTERED" => "Gate In",
                "RECEIVED" => "Received",
                "IN_YARD" => "In Yard",
                "IN_WAREHOUSE" => "In Warehouse",
                "EXAMINATION_SCHEDULED" => "Examination Scheduled",
                "UNDER_EXAMINATION" => "Under Examination",
                "EXAMINATION_COMPLETE" => "Examination Complete",
                "EXAMINATION_REJECTED" => "Examination Rejected",
                "CHARGES_PENDING" => "Charges Pending",
                "CHARGES_SETTLED" => "Charges Settled",
                "RELEASE_AUTHORISED" => "Release Authorised",
                "GATE_OUT" => "Gate Out",
                "TRANSFERRED_OUT" => "Transferred Out",
                "RETURNED_RE_EXPORTED" => "Returned / Re-exported",
                "CANCELLED" => "Cancelled",
                default => $containerStatus
            };

            $quantity = $row["package_count"]
                ?? $row["shipment_package_count"]
                ?? 0;

            $unit = $row["container_package_type"]
                ?: $row["package_type"]
                ?: "packages";

            $weight = $row["gross_weight"]
                ?? $row["shipment_gross_weight"]
                ?? 0;

            $receivedAt = $row["received_at"]
                ?: $row["container_created_at"];

            return [
                "id" => $row["id"],
                "sku" => $row["container_no"],
                "description" => $row["container_description"] ?: $row["cargo_description"],
                "consignee" => $row["consignee"] ?: "Not provided",
                "kind" => $row["container_package_type"] ?: $row["package_type"] ?: "Package",
                "quantity" => (float) $quantity,
                "unit" => $unit,
                "weight" => (float) $weight,
                "volume" => (float) ($row["volume"] ?? 0),
                "location" => $row["location_name"]
                    ? $row["location_code"] . " · " . $row["location_name"]
                    : "Not assigned",
                "locationId" => $row["location_id"],
                "locationCode" => $row["location_code"],
                "consignment" => $row["shipment_reference"],
                "billOfLading" => $row["bill_of_lading"],
                "container" => $row["container_no"],
                "containerSize" => $row["size"],
                "receivedAt" => $receivedAt,
                "status" => $status,
                "statusCode" => $containerStatus,
                "shipmentStatus" => $row["shipment_status"],
                "locationKind" => $row["location_kind"],
                "notes" => $row["special_instructions"] ?: ""
            ];
        }, $records);

        echo json_encode([
            "error" => false,
            "data" => $data,
            "code" => 200
        ]);

    } catch (Throwable $e) {
        echo json_encode([
            "error" => true,
            "data" => "Could not load inventory.",
            "code" => $e->getMessage()
        ]);
    }
