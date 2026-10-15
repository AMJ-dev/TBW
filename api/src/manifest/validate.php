<?php
require_once __DIR__ . "/_bootstrap.php";
try {
    $actor = manifest_require_permission();
    if ($_SERVER["REQUEST_METHOD"] !== "POST") manifest_response(405, true, "Method not allowed.");
    $id = trim((string)($_POST["id"] ?? ""));
    if ($id === "") manifest_response(422, true, "Manifest id is required.");
    $conn->beginTransaction();
    $s = $conn->prepare("SELECT id, status, manifest_reference, bill_of_lading, consignee_name, duplicate_of FROM manifest_intakes WHERE id = :id FOR UPDATE");
    $s->execute([":id"=>$id]);
    $row = $s->fetch(PDO::FETCH_ASSOC);
    if (!$row) { $conn->rollBack(); manifest_response(404, true, "Manifest not found."); }
    if ($row["status"] === "Received") { $conn->rollBack(); manifest_response(409, true, "A received manifest cannot be revalidated."); }
    if ($row["status"] === "Duplicate" || $row["duplicate_of"] !== null) { $conn->rollBack(); manifest_response(409, true, "Resolve the duplicate flag before validation."); }
    if ($row["status"] === "Discrepancy") { $conn->rollBack(); manifest_response(409, true, "Resolve the discrepancy before validation."); }
    if (trim((string)$row["manifest_reference"]) === "" || trim((string)$row["bill_of_lading"]) === "" || trim((string)$row["consignee_name"]) === "") { $conn->rollBack(); manifest_response(422, true, "Manifest reference, bill of lading, and consignee are required."); }
    $dupe = $conn->prepare("SELECT id, manifest_reference FROM manifest_intakes WHERE id <> :id AND (LOWER(manifest_reference) = LOWER(:ref) OR LOWER(bill_of_lading) = LOWER(:bl)) LIMIT 1");
    $dupe->execute([":id"=>$id, ":ref"=>$row["manifest_reference"], ":bl"=>$row["bill_of_lading"]]);
    $duplicate = $dupe->fetch(PDO::FETCH_ASSOC);
    if ($duplicate) { $conn->rollBack(); manifest_response(409, true, "A duplicate reference or bill of lading exists. Flag this record for review.", ["duplicate"=>$duplicate]); }
    $from = (string)$row["status"];
    $u = $conn->prepare("UPDATE manifest_intakes SET status = 'Validated', validated_by = :actor, validated_at = NOW(), notes = COALESCE(notes, '') WHERE id = :id");
    $u->execute([":actor"=>$actor, ":id"=>$id]);
    manifest_event($conn, $id, $actor, "validated", $from, "Validated", "Manifest intake data validated.");
    $conn->commit();
    manifest_response(200, false, "Manifest validated.", ["id"=>$id, "status"=>"Validated"]);
} catch (Throwable $e) { if ($conn->inTransaction()) $conn->rollBack(); manifest_log_exception($e); }
