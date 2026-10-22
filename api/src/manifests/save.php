<?php
    require_once dirname(__DIR__, 2) . "/include/verify-user.php";

    if (($my_details->account_type ?? '') !== 'system' || empty($my_details->id)) {
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
    $containers = filter_var($_POST["containers"] ?? 0, FILTER_VALIDATE_INT, ["options" => ["min_range" => 0]]);
    $packages = filter_var($_POST["packages"] ?? 0, FILTER_VALIDATE_INT, ["options" => ["min_range" => 0]]);

    if ($ref === "" || $bl === "" || $consignee === "" || strlen($ref) > 150 || strlen($bl) > 150) {
        echo json_encode(["error" => true, "data" => "Valid manifest reference, bill of lading and consignee name are required.", "code" => null]);
        exit;
    }

    try {
        $find = $conn->prepare("
            SELECT id, manifest_ref, bill_of_lading
            FROM operation_manifests
            WHERE manifest_ref = :ref OR bill_of_lading = :bl
            LIMIT 1
        ");
        $find->execute([
            ":ref" => $ref,
            ":bl" => $bl
        ]);

        $existingManifest = $find->fetch(PDO::FETCH_ASSOC);

        if ($existingManifest) {

            $message = strcasecmp(trim((string) $existingManifest["manifest_ref"]), $ref) === 0
                ? "This manifest reference already exists."
                : "This Bill of Lading already exists.";

            echo json_encode([
                "error" => true,
                "data" => $message,
                "code" => [
                    "duplicate" => true,
                    "manifest_id" => $existingManifest["id"],
                    "manifest_ref" => $existingManifest["manifest_ref"],
                    "bill_of_lading" => $existingManifest["bill_of_lading"]
                ]
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        }

        if ($matchedShipmentId === "") {
            throw new InvalidArgumentException("Select and confirm the matching shipment declaration before submitting the manifest.");
        }

        if (!in_array($type, ["organisation", "individual"], true)) {
            throw new InvalidArgumentException("Invalid consignee type.");
        }

        if ($type === "organisation" && $orgId === "" && $email === "" && $phone === "") {
            throw new InvalidArgumentException("For an unregistered organisation, provide an email address or phone number for onboarding follow-up.");
        }

        if ($email !== "" && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException("Enter a valid consignee email address.");
        }

        if (!in_array($source, ["EDI", "CSV", "XLSX", "Manual"], true)) {
            throw new InvalidArgumentException("Invalid intake source.");
        }

        if ($source !== "Manual" && $uploadToken === "") {
            throw new InvalidArgumentException("Upload the manifest file before submitting.");
        }

        if ($containers === false || $packages === false) {
            throw new InvalidArgumentException("Containers and packages must be nonnegative integers.");
        }

        $conn->beginTransaction();

        if ($orgId !== "") {
            $checkOrg = $conn->prepare("SELECT id FROM organisations WHERE id = ? AND organisation_type <> 'agent' LIMIT 1");
            $checkOrg->execute([$orgId]);

            if (!$checkOrg->fetchColumn()) {
                throw new InvalidArgumentException("Selected consignee organisation was not found.");
            }
        }
        $agentId = trim((string) ($_POST["agentId"] ?? $_POST["agent_organisation_id"] ?? ""));
        if ($agentId !== "") {
            $agentCheck = $conn->prepare("SELECT id FROM organisations WHERE id = ? AND organisation_type = 'agent' LIMIT 1");
            $agentCheck->execute([$agentId]);
            if (!$agentCheck->fetchColumn()) {
                $agentId = "";
            }
        }
        if ($source !== "Manual") {
            $uploadQuery = $conn->prepare("SELECT id, source, consumed_at FROM operation_manifest_uploads WHERE upload_token = ? AND uploaded_by = ? FOR UPDATE");
            $uploadQuery->execute([$uploadToken, (string) $my_details->id]);
            $uploadRow = $uploadQuery->fetch(PDO::FETCH_ASSOC);

            if (!$uploadRow || $uploadRow["consumed_at"] !== null || $uploadRow["source"] !== $source) {
                throw new InvalidArgumentException("The uploaded manifest token is invalid, already used, or does not match the selected source.");
            }
        }

        $shipmentQuery = $conn->prepare("
            SELECT id, organisation_id, bill_of_lading, shipment_reference, consignee, status
            FROM portal_shipments
            WHERE id = :id
            LIMIT 1
            FOR UPDATE
        ");
        $shipmentQuery->execute([":id" => $matchedShipmentId]);
        $shipment = $shipmentQuery->fetch(PDO::FETCH_ASSOC);

        if (!$shipment) {
            throw new InvalidArgumentException("The selected shipment declaration could not be found. Search again and select a valid shipment.");
        }

        $normalise = static function ($value): string {
            return strtoupper((string) preg_replace('/[^A-Z0-9]/i', '', trim((string) $value)));
        };

        if (
            $normalise($shipment["bill_of_lading"] ?? "") === "" ||
            $normalise($shipment["bill_of_lading"]) !== $normalise($bl)
        ) {
            throw new InvalidArgumentException("The manifest bill of lading does not match the selected shipment declaration.");
        }

        $agentId = trim((string) ($_POST["agentId"] ?? $_POST["agent_organisation_id"] ?? ""));

        if ($agentId !== "") {
            $agentCheck = $conn->prepare("SELECT id FROM organisations WHERE id = ? AND organisation_type = 'agent' LIMIT 1");
            $agentCheck->execute([$agentId]);

            if (!$agentCheck->fetchColumn()) {
                $agentId = "";
            }
        }

        $notes = trim((string) ($_POST["notes"] ?? ""));

        if ($orgId === "") {
            $notes = trim($notes . "\nConsignee not yet in TRÏNŪ; onboarding and verification follow-up required.");
        }

        $id = generateId();
        $organisationId = $shipment["organisation_id"] ?? null;

        $stmt = $conn->prepare("
            INSERT INTO operation_manifests
            (
                id, organisation_id, manifest_ref, bill_of_lading, vessel,
                shipping_line, origin_port, eta, containers, packages,
                gross_weight, consignee, consignee_type, consignee_organisation_id,
                consignee_status, consignee_email, consignee_phone, consignee_address,
                agent, agent_organisation_id, source, status, notes, duplicate_of,
                created_by, matched_shipment_id
            )
            VALUES
            (
                :id, :organisation_id, :ref, :bl, :vessel,
                :line, :port, :eta, :containers, :packages,
                :weight, :consignee, :type, :org,
                :consignee_status, :email, :phone, :address,
                :agent, :agent_id, :source, :status, :notes, NULL,
                :actor, :matched_shipment_id
            )
        ");

        $stmt->execute([
            ":id" => $id,
            ":organisation_id" => $organisationId,
            ":ref" => $ref,
            ":bl" => $bl,
            ":vessel" => substr(trim((string) ($_POST["vessel"] ?? "")), 0, 200),
            ":line" => substr(trim((string) ($_POST["shippingLine"] ?? $_POST["shipping_line"] ?? "")), 0, 200),
            ":port" => substr(trim((string) ($_POST["originPort"] ?? $_POST["origin_port"] ?? "")), 0, 150),
            ":eta" => substr(trim((string) ($_POST["eta"] ?? "")), 0, 100),
            ":containers" => $containers,
            ":packages" => $packages,
            ":weight" => substr(trim((string) ($_POST["grossWeight"] ?? $_POST["gross_weight"] ?? "")), 0, 100),
            ":consignee" => $consignee,
            ":type" => $type,
            ":org" => $orgId !== "" ? $orgId : null,
            ":consignee_status" => $consigneeStatus,
            ":email" => $email !== "" ? $email : null,
            ":phone" => $phone !== "" ? $phone : null,
            ":address" => $address !== "" ? $address : null,
            ":agent" => substr(trim((string) ($_POST["agent"] ?? "")), 0, 255),
            ":agent_id" => $agentId !== "" ? $agentId : null,
            ":source" => $source,
            ":status" => "Pre-advice",
            ":notes" => $notes,
            ":actor" => (string) $my_details->id,
            ":matched_shipment_id" => $matchedShipmentId
        ]);

        $match = $conn->prepare("
            INSERT INTO operation_manifest_shipment_matches
            (id, manifest_id, shipment_id, match_method, matched_by, confirmed_by, notes)
            VALUES (:id, :manifest_id, :shipment_id, :match_method, :matched_by, :confirmed_by, :notes)
        ");

        $match->execute([
            ":id" => generateId(),
            ":manifest_id" => $id,
            ":shipment_id" => $matchedShipmentId,
            ":match_method" => "BILL_OF_LADING_CONFIRMED",
            ":matched_by" => (string) $my_details->id,
            ":confirmed_by" => (string) $my_details->id,
            ":notes" => "Shipment linked during manifest intake. Shipment reference: " . (string) ($shipment["shipment_reference"] ?? "")
        ]);

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
            INSERT INTO operation_manifest_events
            (id, manifest_id, actor_id, action, from_status, to_status, details)
            VALUES (:event_id, :id, :actor, :action, NULL, :status, :details)
        ");

        $event->execute([
            ":event_id" => generateId(),
            ":id" => $id,
            ":actor" => (string) $my_details->id,
            ":action" => "CREATED_AND_LINKED",
            ":status" => "Pre-advice",
            ":details" => trim($notes . "\nLinked shipment: " . (string) ($shipment["shipment_reference"] ?? $matchedShipmentId))
        ]);

        $conn->commit();

        echo json_encode([
            "error" => false,
            "data" => "Manifest created and linked to the existing shipment declaration.",
            "code" => [
                "id" => $id,
                "status" => "Pre-advice",
                "duplicate" => false,
                "duplicate_of" => null,
                "consignee_status" => $consigneeStatus,
                "matched_shipment_id" => $matchedShipmentId,
                "shipment_reference" => $shipment["shipment_reference"] ?? null,
                "shipment_status" => $shipment["status"] ?? null
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } catch (InvalidArgumentException $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        echo json_encode(["error" => true, "data" => $e->getMessage(), "code" => null], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        echo json_encode(["error" => true, "data" => "Unable to create manifest.", "code" => $e->getMessage()], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
