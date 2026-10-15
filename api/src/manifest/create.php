<?php
require_once __DIR__ . "/_bootstrap.php";
try {
    $actor = manifest_require_permission();
    if ($_SERVER["REQUEST_METHOD"] !== "POST") manifest_response(405, true, "Method not allowed.");
    $manifestRef = manifest_text("manifest_reference", 120, true);
    $bl = manifest_text("bill_of_lading", 120, true);
    $consignee = manifest_text("consignee_name", 255, true);
    $source = manifest_text("intake_source", 10, true);
    if (!in_array($source, ["EDI", "CSV", "XLSX", "Manual"], true)) manifest_response(422, true, "Invalid intake source.");
    $type = manifest_text("consignee_type", 20) ?? "individual";
    if (!in_array($type, ["organisation", "individual"], true)) manifest_response(422, true, "Invalid consignee type.");
    $organisationId = manifest_text("consignee_organisation_id", 36);
    $agentId = manifest_text("agent_organisation_id", 36);
    if ($organisationId !== null) {
        $s = $conn->prepare("SELECT organisation_name FROM organisations WHERE id = :id AND organisation_type = 'importer' AND verification_status = 'verified' LIMIT 1");
        $s->execute([":id" => $organisationId]);
        if (!$s->fetchColumn()) manifest_response(422, true, "Select a verified consignee organisation.");
    }
    if ($agentId !== null) {
        $s = $conn->prepare("SELECT organisation_name FROM organisations WHERE id = :id AND organisation_type = 'agent' AND verification_status = 'verified' LIMIT 1");
        $s->execute([":id" => $agentId]);
        if (!$s->fetchColumn()) manifest_response(422, true, "Select a verified licensed agent.");
    }
    $count = static function(string $key): int {
        $v = trim((string)($_POST[$key] ?? "0"));
        if ($v === "") return 0;
        if (!ctype_digit($v) || (int)$v > 1000000000) manifest_response(422, true, ucfirst(str_replace("_", " ", $key)) . " must be a non-negative whole number.");
        return (int)$v;
    };
    $weightRaw = manifest_text("gross_weight", 30);
    $weight = null;
    if ($weightRaw !== null) {
        if (!is_numeric($weightRaw) || (float)$weightRaw < 0 || (float)$weightRaw > 99999999999) manifest_response(422, true, "Gross weight must be a non-negative number.");
        $weight = number_format((float)$weightRaw, 3, ".", "");
    }
    $eta = manifest_date(manifest_text("expected_arrival", 10), "Expected arrival");
    $check = $conn->prepare("SELECT id, manifest_reference FROM manifest_intakes WHERE LOWER(manifest_reference) = LOWER(:ref) OR LOWER(bill_of_lading) = LOWER(:bl) LIMIT 1");
    $check->execute([":ref" => $manifestRef, ":bl" => $bl]);
    $duplicate = $check->fetch(PDO::FETCH_ASSOC);
    $id = manifest_uuid();
    $status = $duplicate ? "Duplicate" : "Pre-advice";
    $notes = manifest_text("notes", 4000) ?? ($duplicate ? "Possible duplicate detected during server-side intake." : "Pre-advice received; awaiting validation.");
    $agentName = null;
    if ($agentId !== null) {
        $s = $conn->prepare("SELECT organisation_name FROM organisations WHERE id = :id LIMIT 1");
        $s->execute([":id" => $agentId]);
        $agentName = $s->fetchColumn() ?: null;
    }
    $consigneeEmail = manifest_text("consignee_email", 254);
    if ($consigneeEmail !== null && !filter_var($consigneeEmail, FILTER_VALIDATE_EMAIL)) manifest_response(422, true, "Enter a valid consignee email address.");
    $stmt = $conn->prepare("INSERT INTO manifest_intakes (id, manifest_reference, bill_of_lading, vessel_name, shipping_line, origin_port, expected_arrival, container_count, package_count, gross_weight, consignee_type, consignee_organisation_id, consignee_name, consignee_contact_person, consignee_email, consignee_phone, consignee_address, consignee_country, agent_organisation_id, agent_name, intake_source, status, notes, duplicate_of, received_by) VALUES (:id,:ref,:bl,:vessel,:line,:port,:eta,:containers,:packages,:weight,:type,:org,:consignee,:contact,:email,:phone,:address,:country,:agent_id,:agent_name,:source,:status,:notes,:duplicate,:actor)");
    $stmt->execute([
        ":id"=>$id, ":ref"=>$manifestRef, ":bl"=>$bl, ":vessel"=>manifest_text("vessel_name",180), ":line"=>manifest_text("shipping_line",180), ":port"=>manifest_text("origin_port",180), ":eta"=>$eta,
        ":containers"=>$count("container_count"), ":packages"=>$count("package_count"), ":weight"=>$weight, ":type"=>$type, ":org"=>$organisationId, ":consignee"=>$consignee,
        ":contact"=>manifest_text("consignee_contact_person",180), ":email"=>$consigneeEmail, ":phone"=>manifest_text("consignee_phone",40), ":address"=>manifest_text("consignee_address",500), ":country"=>manifest_text("consignee_country",100),
        ":agent_id"=>$agentId, ":agent_name"=>$agentName ?? manifest_text("agent_name",255), ":source"=>$source, ":status"=>$status, ":notes"=>$notes, ":duplicate"=>$duplicate["id"] ?? null, ":actor"=>$actor
    ]);
    manifest_event($conn, $id, $actor, "created", null, $status, $notes, ["intake_source"=>$source, "duplicate_reference"=>$duplicate["manifest_reference"] ?? null]);
    $get = $conn->prepare("SELECT id, manifest_reference AS manifestRef, bill_of_lading AS bl, vessel_name AS vessel, shipping_line AS shippingLine, origin_port AS originPort, expected_arrival AS eta, container_count AS containers, package_count AS packages, gross_weight AS grossWeight, consignee_name AS consignee, agent_name AS agent, intake_source AS source, status, created_at AS receivedAt, notes, duplicate_of AS duplicateOf FROM manifest_intakes WHERE id = :id");
    $get->execute([":id"=>$id]);
    manifest_response(201, false, $duplicate ? "Manifest saved and flagged as a possible duplicate." : "Manifest saved.", ["item"=>$get->fetch(PDO::FETCH_ASSOC)]);
} catch (PDOException $e) {
    if ($e->getCode() === "23000") manifest_response(409, true, "A manifest with this reference already exists. Review the existing record before retrying.");
    manifest_log_exception($e);
} catch (Throwable $e) { manifest_log_exception($e); }
