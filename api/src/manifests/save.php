<?php
require_once dirname(__DIR__, 2) . "/include/verify-user.php";

if (($my_details->account_type ?? '') !== "system" || empty($my_details->id)) {
    echo json_encode(["error" => true, "data" => "Access denied.", "code" => null]);
    exit;
}

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "POST") {
    header("Allow: POST");
    echo json_encode(["error" => true, "data" => "Method not allowed.", "code" => null]);
    exit;
}

$bl = trim((string) ($_POST["bl"] ?? ""));
$ref = trim((string) ($_POST["manifest_ref"] ?? ""));
$consignee = trim((string) ($_POST["consignee"] ?? ""));
$matchedShipmentId = trim((string) ($_POST["matched_shipment_id"] ?? ""));
$type = (string) ($_POST["consignee_type"] ?? "organisation");
$orgId = trim((string) ($_POST["consignee_organisation_id"] ?? ""));
$email = trim((string) ($_POST["consignee_email"] ?? ""));
$phone = trim((string) ($_POST["consignee_phone"] ?? ""));
$address = trim((string) ($_POST["consignee_address"] ?? ""));
$consigneeStatus = $orgId !== "" ? "linked" : "unregistered";
$source = (string) ($_POST["source"] ?? "Manual");
$uploadToken = trim((string) ($_POST["uploadToken"] ?? $_POST["upload_token"] ?? ""));
$containersCount = filter_var($_POST["containers"] ?? 0, FILTER_VALIDATE_INT, ["options" => ["min_range" => 0]]);
$packages = filter_var($_POST["packages"] ?? 0, FILTER_VALIDATE_INT, ["options" => ["min_range" => 0]]);
$containerNumbersRaw = trim((string) ($_POST["containerNumbers"] ?? $_POST["container_numbers"] ?? ""));
$notes = trim((string) ($_POST["notes"] ?? ""));
$agentId = trim((string) ($_POST["agentId"] ?? $_POST["agent_organisation_id"] ?? ""));

if ($ref === "" || $bl === "" || $consignee === "" || strlen($ref) > 150 || strlen($bl) > 150) {
    echo json_encode(["error" => true, "data" => "Valid manifest reference, bill of lading and consignee name are required.", "code" => null]);
    exit;
}

if (!in_array($type, ["organisation", "individual"], true)) {
    echo json_encode(["error" => true, "data" => "Invalid consignee type.", "code" => null]);
    exit;
}

if ($type === "organisation" && $orgId === "" && $email === "" && $phone === "") {
    echo json_encode(["error" => true, "data" => "For an unregistered organisation, provide an email address or phone number for onboarding follow-up.", "code" => null]);
    exit;
}

if ($email !== "" && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["error" => true, "data" => "Enter a valid consignee email address.", "code" => null]);
    exit;
}

if (!in_array($source, ["EDI", "CSV", "XLSX", "Manual"], true)) {
    echo json_encode(["error" => true, "data" => "Invalid intake source.", "code" => null]);
    exit;
}

if ($source !== "Manual" && $uploadToken === "") {
    echo json_encode(["error" => true, "data" => "Upload the manifest file before submitting.", "code" => null]);
    exit;
}

if ($containersCount === false || $packages === false) {
    echo json_encode(["error" => true, "data" => "Containers and packages must be nonnegative integers.", "code" => null]);
    exit;
}

$containerNumbers = preg_split('/[\r\n,;]+/', $containerNumbersRaw) ?: [];
$containerNumbers = array_values(array_unique(array_filter(array_map(
    static function ($value): string {
        return strtoupper(trim((string) $value));
    },
    $containerNumbers
), static function ($value): bool {
    return $value !== "";
})));

if (count($containerNumbers) > 200) {
    echo json_encode(["error" => true, "data" => "A maximum of 200 containers can be submitted for one manifest.", "code" => null]);
    exit;
}

$normalise = static function ($value): string {
    return strtoupper((string) preg_replace('/[^A-Z0-9]/i', '', trim((string) $value)));
};

try {
    $conn->beginTransaction();

    $find = $conn->prepare("
        SELECT id, manifest_ref, bill_of_lading, status, matched_shipment_id
        FROM operation_manifests
        WHERE manifest_ref = :ref OR bill_of_lading = :bl
        LIMIT 1
        FOR UPDATE
    ");

    $find->execute([
        ":ref" => $ref,
        ":bl" => $bl
    ]);

    $existingManifest = $find->fetch(PDO::FETCH_ASSOC);

    if ($existingManifest) {
        $conn->rollBack();

        $sameReference = $normalise($existingManifest["manifest_ref"] ?? "") === $normalise($ref);
        $message = $sameReference
            ? "This manifest reference already exists."
            : "This Bill of Lading already exists.";

        echo json_encode([
            "error" => true,
            "data" => $message,
            "code" => [
                "duplicate" => true,
                "manifest_id" => $existingManifest["id"],
                "manifest_ref" => $existingManifest["manifest_ref"],
                "bill_of_lading" => $existingManifest["bill_of_lading"],
                "status" => $existingManifest["status"],
                "matched_shipment_id" => $existingManifest["matched_shipment_id"]
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($orgId !== "") {
        $checkOrg = $conn->prepare("
            SELECT id
            FROM organisations
            WHERE id = ? AND organisation_type <> 'agent'
            LIMIT 1
        ");
        $checkOrg->execute([$orgId]);

        if (!$checkOrg->fetchColumn()) {
            throw new InvalidArgumentException("Selected consignee organisation was not found.");
        }
    }

    if ($agentId !== "") {
        $agentCheck = $conn->prepare("
            SELECT id
            FROM organisations
            WHERE id = ? AND organisation_type = 'agent'
            LIMIT 1
        ");
        $agentCheck->execute([$agentId]);

        if (!$agentCheck->fetchColumn()) {
            throw new InvalidArgumentException("Selected licensed agent was not found.");
        }
    }

    if ($source !== "Manual") {
        $uploadQuery = $conn->prepare("
            SELECT id, source, consumed_at
            FROM operation_manifest_uploads
            WHERE upload_token = ? AND uploaded_by = ?
            FOR UPDATE
        ");
        $uploadQuery->execute([$uploadToken, (string) $my_details->id]);
        $uploadRow = $uploadQuery->fetch(PDO::FETCH_ASSOC);

        if (!$uploadRow || $uploadRow["consumed_at"] !== null || $uploadRow["source"] !== $source) {
            throw new InvalidArgumentException("The uploaded manifest token is invalid, already used, or does not match the selected source.");
        }
    }

    $shipment = null;

    if ($matchedShipmentId !== "") {
        $shipmentQuery = $conn->prepare("
            SELECT id, organisation_id, bill_of_lading, shipment_reference, consignee, status
            FROM portal_shipments
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
        ");
        $shipmentQuery->execute([$matchedShipmentId]);
        $shipment = $shipmentQuery->fetch(PDO::FETCH_ASSOC);

        if (!$shipment) {
            throw new InvalidArgumentException("The selected shipment declaration could not be found. Search again and select a valid shipment.");
        }

        if (
            $normalise($shipment["bill_of_lading"] ?? "") === "" ||
            $normalise($shipment["bill_of_lading"]) !== $normalise($bl)
        ) {
            throw new InvalidArgumentException("The manifest bill of lading does not match the selected shipment declaration.");
        }

        $existingManifestLink = $conn->prepare("
            SELECT id, manifest_ref
            FROM operation_manifests
            WHERE matched_shipment_id = ?
            LIMIT 1
            FOR UPDATE
        ");
        $existingManifestLink->execute([$matchedShipmentId]);
        $alreadyLinked = $existingManifestLink->fetch(PDO::FETCH_ASSOC);

        if ($alreadyLinked) {
            throw new InvalidArgumentException(
                "This shipment is already linked to manifest " . $alreadyLinked["manifest_ref"] . "."
            );
        }
    }

    $shipmentContainers = [];

    if ($shipment !== null) {
        $shipmentContainerQuery = $conn->prepare("
            SELECT
                id,
                container_no,
                seal_no,
                size,
                package_count,
                gross_weight
            FROM portal_shipment_containers
            WHERE shipment_id = ?
            ORDER BY created_at ASC
            FOR UPDATE
        ");
        $shipmentContainerQuery->execute([$matchedShipmentId]);
        $shipmentContainers = $shipmentContainerQuery->fetchAll(PDO::FETCH_ASSOC);
    }

    if (count($containerNumbers) === 0 && count($shipmentContainers) > 0) {
        foreach ($shipmentContainers as $shipmentContainer) {
            $containerNo = strtoupper(trim((string) ($shipmentContainer["container_no"] ?? "")));
            if ($containerNo !== "") {
                $containerNumbers[] = $containerNo;
            }
        }
        $containerNumbers = array_values(array_unique($containerNumbers));
    }

    $manifestContainerCount = count($containerNumbers) > 0
        ? count($containerNumbers)
        : (int) $containersCount;

    if ($orgId === "") {
        $notes = trim($notes . "\nConsignee not yet in TRÏNŪ; onboarding and verification follow-up required.");
    }

    if ($shipment === null) {
        $notes = trim($notes . "\nNo matching shipment declaration was found during manifest intake. Match this manifest when the organisation submits its declaration.");
    }

    if (count($containerNumbers) === 0) {
        $notes = trim($notes . "\nNo individual container numbers were supplied with this manifest.");
    }

    $manifestId = generateId();
    $organisationId = $shipment["organisation_id"] ?? null;
    $status = $shipment !== null ? "Pre-advice" : "Unmatched";

    $insertManifest = $conn->prepare("
        INSERT INTO operation_manifests (
            id,
            organisation_id,
            manifest_ref,
            bill_of_lading,
            vessel,
            shipping_line,
            origin_port,
            eta,
            containers,
            packages,
            gross_weight,
            consignee,
            consignee_type,
            consignee_organisation_id,
            consignee_status,
            consignee_email,
            consignee_phone,
            consignee_address,
            agent,
            agent_organisation_id,
            source,
            status,
            notes,
            duplicate_of,
            created_by,
            matched_shipment_id
        ) VALUES (
            :id,
            :organisation_id,
            :manifest_ref,
            :bill_of_lading,
            :vessel,
            :shipping_line,
            :origin_port,
            :eta,
            :containers,
            :packages,
            :gross_weight,
            :consignee,
            :consignee_type,
            :consignee_organisation_id,
            :consignee_status,
            :consignee_email,
            :consignee_phone,
            :consignee_address,
            :agent,
            :agent_organisation_id,
            :source,
            :status,
            :notes,
            NULL,
            :created_by,
            :matched_shipment_id
        )
    ");

    $insertManifest->execute([
        ":id" => $manifestId,
        ":organisation_id" => $organisationId,
        ":manifest_ref" => $ref,
        ":bill_of_lading" => $bl,
        ":vessel" => substr(trim((string) ($_POST["vessel"] ?? "")), 0, 200),
        ":shipping_line" => substr(trim((string) ($_POST["shippingLine"] ?? $_POST["shipping_line"] ?? "")), 0, 200),
        ":origin_port" => substr(trim((string) ($_POST["originPort"] ?? $_POST["origin_port"] ?? "")), 0, 150),
        ":eta" => substr(trim((string) ($_POST["eta"] ?? "")), 0, 100),
        ":containers" => $manifestContainerCount,
        ":packages" => $packages,
        ":gross_weight" => substr(trim((string) ($_POST["grossWeight"] ?? $_POST["gross_weight"] ?? "")), 0, 100),
        ":consignee" => $consignee,
        ":consignee_type" => $type,
        ":consignee_organisation_id" => $orgId !== "" ? $orgId : null,
        ":consignee_status" => $consigneeStatus,
        ":consignee_email" => $email !== "" ? $email : null,
        ":consignee_phone" => $phone !== "" ? $phone : null,
        ":consignee_address" => $address !== "" ? $address : null,
        ":agent" => substr(trim((string) ($_POST["agent"] ?? "")), 0, 255),
        ":agent_organisation_id" => $agentId !== "" ? $agentId : null,
        ":source" => $source,
        ":status" => $status,
        ":notes" => $notes !== "" ? $notes : null,
        ":created_by" => (string) $my_details->id,
        ":matched_shipment_id" => $shipment !== null ? $matchedShipmentId : null
    ]);

    $insertManifestContainer = $conn->prepare("
        INSERT INTO operation_manifest_containers (
            id,
            manifest_id,
            container_no,
            seal_no,
            size,
            package_count,
            gross_weight,
            matched_shipment_id,
            matched_shipment_container_id
        ) VALUES (
            :id,
            :manifest_id,
            :container_no,
            :seal_no,
            :size,
            :package_count,
            :gross_weight,
            :matched_shipment_id,
            :matched_shipment_container_id
        )
    ");

    $shipmentContainerMap = [];

    foreach ($shipmentContainers as $shipmentContainer) {
        $key = $normalise($shipmentContainer["container_no"] ?? "");
        if ($key !== "") {
            $shipmentContainerMap[$key] = $shipmentContainer;
        }
    }

    $linkedContainerCount = 0;
    $unmatchedContainerCount = 0;
    $savedManifestContainers = [];

    foreach ($containerNumbers as $containerNo) {
        $key = $normalise($containerNo);
        $matchedContainer = $shipmentContainerMap[$key] ?? null;

        $manifestContainerId = generateId();

        $insertManifestContainer->execute([
            ":id" => $manifestContainerId,
            ":manifest_id" => $manifestId,
            ":container_no" => $containerNo,
            ":seal_no" => $matchedContainer["seal_no"] ?? null,
            ":size" => $matchedContainer["size"] ?? null,
            ":package_count" => $matchedContainer["package_count"] ?? null,
            ":gross_weight" => $matchedContainer["gross_weight"] ?? null,
            ":matched_shipment_id" => $matchedContainer !== null ? $matchedShipmentId : null,
            ":matched_shipment_container_id" => $matchedContainer["id"] ?? null
        ]);

        if ($matchedContainer !== null) {
            $linkedContainerCount++;
        } else {
            $unmatchedContainerCount++;
        }

        $savedManifestContainers[] = [
            "id" => $manifestContainerId,
            "container_no" => $containerNo,
            "matched_shipment_container_id" => $matchedContainer["id"] ?? null,
            "linked" => $matchedContainer !== null
        ];
    }

    if ($shipment !== null) {
        $match = $conn->prepare("
            INSERT INTO operation_manifest_shipment_matches (
                id,
                manifest_id,
                shipment_id,
                match_method,
                matched_by,
                confirmed_by,
                notes
            ) VALUES (
                :id,
                :manifest_id,
                :shipment_id,
                :match_method,
                :matched_by,
                :confirmed_by,
                :notes
            )
        ");

        $match->execute([
            ":id" => generateId(),
            ":manifest_id" => $manifestId,
            ":shipment_id" => $matchedShipmentId,
            ":match_method" => "BILL_OF_LADING_CONFIRMED",
            ":matched_by" => (string) $my_details->id,
            ":confirmed_by" => (string) $my_details->id,
            ":notes" => "Shipment linked during manifest intake. Shipment reference: " . (string) ($shipment["shipment_reference"] ?? "")
        ]);
    }

    if ($source !== "Manual") {
        $consume = $conn->prepare("
            UPDATE operation_manifest_uploads
            SET consumed_at = NOW()
            WHERE upload_token = ? AND uploaded_by = ? AND consumed_at IS NULL
        ");
        $consume->execute([$uploadToken, (string) $my_details->id]);

        if ($consume->rowCount() !== 1) {
            throw new InvalidArgumentException("The manifest upload was already used. Upload the file again before submitting.");
        }
    }

    $event = $conn->prepare("
        INSERT INTO activity_logs (
            id,
            actor_id,
            category,
            action,
            entity_type,
            entity_id,
            description,
            old_values,
            new_values,
            metadata,
            severity,
            created_at
        ) VALUES (
            :id,
            :actor_id,
            :category,
            :action,
            :entity_type,
            :entity_id,
            :description,
            :old_values,
            :new_values,
            :metadata,
            :severity,
            CURRENT_TIMESTAMP
        )
    ");

    $action = $shipment !== null ? "CREATED_AND_LINKED" : "CREATED_UNMATCHED";

    $event->execute([
        ":id" => generateId(),
        ":actor_id" => (string) $my_details->id,
        ":category" => "MANIFEST",
        ":action" => $action,
        ":entity_type" => "MANIFEST",
        ":entity_id" => $manifestId,
        ":description" => $shipment !== null
            ? "Manifest created and linked to an existing shipment. Manifest containers were matched against shipment containers."
            : "Manifest created without a matching shipment.",
        ":old_values" => null,
        ":new_values" => json_encode([
            "status" => $status,
            "container_count" => $manifestContainerCount,
            "linked_container_count" => $linkedContainerCount,
            "unmatched_container_count" => $unmatchedContainerCount
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
        ":metadata" => json_encode([
            "source_table" => "operation_manifest_containers",
            "manifest_id" => $manifestId,
            "shipment_id" => $matchedShipmentId !== "" ? $matchedShipmentId : null,
            "shipment_reference" => $shipment["shipment_reference"] ?? null,
            "containers" => $savedManifestContainers
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
        ":severity" => "INFO"
    ]);

    $conn->commit();

    echo json_encode([
        "error" => false,
        "data" => $shipment !== null
            ? "Manifest created and linked to the existing shipment. Container records have been saved and matched where container numbers correspond."
            : "Manifest saved successfully. Its container records are saved and can be matched when a shipment declaration is submitted.",
        "code" => [
            "id" => $manifestId,
            "status" => $status,
            "duplicate" => false,
            "duplicate_of" => null,
            "consignee_status" => $consigneeStatus,
            "matched_shipment_id" => $shipment !== null ? $matchedShipmentId : null,
            "shipment_reference" => $shipment["shipment_reference"] ?? null,
            "shipment_status" => $shipment["status"] ?? null,
            "container_count" => $manifestContainerCount,
            "linked_container_count" => $linkedContainerCount,
            "unmatched_container_count" => $unmatchedContainerCount,
            "containers" => $savedManifestContainers
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (InvalidArgumentException $e) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode([
        "error" => true,
        "data" => $e->getMessage(),
        "code" => null
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "data" => "Unable to create manifest.",
        "code" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
