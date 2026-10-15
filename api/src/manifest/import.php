<?php
require_once __DIR__ . "/_bootstrap.php";
try {
    $actor = manifest_require_permission();
    if ($_SERVER["REQUEST_METHOD"] !== "POST") manifest_response(405, true, "Method not allowed.");
    if (!isset($_FILES["file"]) || $_FILES["file"]["error"] !== UPLOAD_ERR_OK) manifest_response(422, true, "Upload a valid CSV file.");
    if ((int)$_FILES["file"]["size"] > 10485760) manifest_response(413, true, "CSV file must not exceed 10 MB.");
    $name = (string)$_FILES["file"]["name"];
    if (strtolower(pathinfo($name, PATHINFO_EXTENSION)) !== "csv") manifest_response(415, true, "Only CSV imports are enabled. XLSX and EDI require their format-specific parsers.");
    $handle = fopen($_FILES["file"]["tmp_name"], "r");
    if (!$handle) manifest_response(422, true, "Unable to read the uploaded CSV.");
    $header = fgetcsv($handle);
    if (!$header || count($header) > 80) { fclose($handle); manifest_response(422, true, "CSV header row is missing or invalid."); }
    $header = array_map(static fn($v) => strtolower(trim(preg_replace('/^\xEF\xBB\xBF/', '', (string)$v))), $header);
    $required = ["manifest_reference", "bill_of_lading", "consignee_name"];
    foreach ($required as $column) if (!in_array($column, $header, true)) { fclose($handle); manifest_response(422, true, "CSV is missing required column: $column"); }
    $rows = [];
    $line = 1;
    while (($data = fgetcsv($handle)) !== false) {
        $line++;
        if (count($rows) >= 5000) { fclose($handle); manifest_response(413, true, "CSV imports are limited to 5,000 rows per request."); }
        if (count($data) !== count($header)) { $rows[] = ["line"=>$line, "error"=>"Column count does not match the header."]; continue; }
        $item = array_combine($header, $data);
        $ref = trim((string)$item["manifest_reference"]);
        $bl = trim((string)$item["bill_of_lading"]);
        $consignee = trim((string)$item["consignee_name"]);
        if ($ref === "" || $bl === "" || $consignee === "") { $rows[] = ["line"=>$line, "error"=>"Manifest reference, bill of lading and consignee are required."]; continue; }
        if (mb_strlen($ref) > 120 || mb_strlen($bl) > 120 || mb_strlen($consignee) > 255) { $rows[] = ["line"=>$line, "error"=>"One or more fields exceed the allowed length."]; continue; }
        $rows[] = ["line"=>$line, "manifest_reference"=>$ref, "bill_of_lading"=>$bl, "consignee_name"=>$consignee, "vessel_name"=>trim((string)($item["vessel_name"] ?? "")), "shipping_line"=>trim((string)($item["shipping_line"] ?? "")), "origin_port"=>trim((string)($item["origin_port"] ?? "")), "expected_arrival"=>trim((string)($item["expected_arrival"] ?? "")), "container_count"=>trim((string)($item["container_count"] ?? "0")), "package_count"=>trim((string)($item["package_count"] ?? "0")), "gross_weight"=>trim((string)($item["gross_weight"] ?? ""))];
    }
    fclose($handle);
    $inserted = 0; $errors = []; $seenRefs = []; $seenBls = [];
    foreach ($rows as $row) {
        if (isset($row["error"])) { $errors[] = ["line"=>$row["line"], "error"=>$row["error"]]; continue; }
        $refKey = mb_strtolower($row["manifest_reference"]); $blKey = mb_strtolower($row["bill_of_lading"]);
        if (isset($seenRefs[$refKey]) || isset($seenBls[$blKey])) { $errors[] = ["line"=>$row["line"], "error"=>"Duplicate reference or bill of lading within this file."]; continue; }
        $seenRefs[$refKey] = true; $seenBls[$blKey] = true;
        if ($row["expected_arrival"] !== "" && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $row["expected_arrival"])) { $errors[] = ["line"=>$row["line"], "error"=>"Expected arrival must use YYYY-MM-DD."]; continue; }
        if (!ctype_digit($row["container_count"] ?: "0") || !ctype_digit($row["package_count"] ?: "0")) { $errors[] = ["line"=>$row["line"], "error"=>"Container and package counts must be whole non-negative numbers."]; continue; }
        if ($row["gross_weight"] !== "" && (!is_numeric($row["gross_weight"]) || (float)$row["gross_weight"] < 0)) { $errors[] = ["line"=>$row["line"], "error"=>"Gross weight must be a non-negative number."]; continue; }
        $dup = $conn->prepare("SELECT id FROM manifest_intakes WHERE LOWER(manifest_reference) = LOWER(:ref) OR LOWER(bill_of_lading) = LOWER(:bl) LIMIT 1");
        $dup->execute([":ref"=>$row["manifest_reference"], ":bl"=>$row["bill_of_lading"]]);
        if ($dup->fetchColumn()) { $errors[] = ["line"=>$row["line"], "error"=>"Manifest reference or bill of lading already exists."]; continue; }
        try {
            $id = manifest_uuid();
            $s = $conn->prepare("INSERT INTO manifest_intakes (id, manifest_reference, bill_of_lading, vessel_name, shipping_line, origin_port, expected_arrival, container_count, package_count, gross_weight, consignee_name, intake_source, status, notes, received_by) VALUES (:id,:ref,:bl,:vessel,:line,:port,:eta,:containers,:packages,:weight,:consignee,'CSV','Pre-advice','Imported from CSV; awaiting validation.',:actor)");
            $s->execute([":id"=>$id, ":ref"=>$row["manifest_reference"], ":bl"=>$row["bill_of_lading"], ":vessel"=>$row["vessel_name"] ?: null, ":line"=>$row["shipping_line"] ?: null, ":port"=>$row["origin_port"] ?: null, ":eta"=>$row["expected_arrival"] ?: null, ":containers"=>(int)($row["container_count"] ?: 0), ":packages"=>(int)($row["package_count"] ?: 0), ":weight"=>$row["gross_weight"] === "" ? null : number_format((float)$row["gross_weight"], 3, ".", ""), ":consignee"=>$row["consignee_name"], ":actor"=>$actor]);
            manifest_event($conn, $id, $actor, "imported", null, "Pre-advice", "Imported from CSV.", ["line"=>$row["line"]]);
            $inserted++;
        } catch (Throwable $e) { $errors[] = ["line"=>$row["line"], "error"=>"Could not save this row; check for duplicate values."]; }
    }
    manifest_response(200, false, "CSV import processed.", ["inserted"=>$inserted, "failed"=>count($errors), "errors"=>$errors]);
} catch (Throwable $e) { manifest_log_exception($e); }
