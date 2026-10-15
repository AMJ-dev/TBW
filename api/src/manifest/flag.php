<?php
require_once __DIR__ . "/_bootstrap.php";
try {
    $actor = manifest_require_permission();
    if ($_SERVER["REQUEST_METHOD"] !== "POST") manifest_response(405, true, "Method not allowed.");
    $id = trim((string)($_POST["id"] ?? ""));
    $reason = trim((string)($_POST["reason"] ?? ""));
    if ($id === "") manifest_response(422, true, "Manifest id is required.");
    if ($reason === "" || mb_strlen($reason) > 4000) manifest_response(422, true, "A reason of up to 4,000 characters is required.");
    $conn->beginTransaction();
    $s = $conn->prepare("SELECT id, status FROM manifest_intakes WHERE id = :id FOR UPDATE");
    $s->execute([":id"=>$id]);
    $row = $s->fetch(PDO::FETCH_ASSOC);
    if (!$row) { $conn->rollBack(); manifest_response(404, true, "Manifest not found."); }
    if ($row["status"] === "Received") { $conn->rollBack(); manifest_response(409, true, "A received manifest cannot be flagged through intake."); }
    $from = (string)$row["status"];
    $u = $conn->prepare("UPDATE manifest_intakes SET status = 'Discrepancy', flagged_by = :actor, flagged_at = NOW(), notes = :notes WHERE id = :id");
    $u->execute([":actor"=>$actor, ":notes"=>$reason, ":id"=>$id]);
    manifest_event($conn, $id, $actor, "flagged", $from, "Discrepancy", $reason);
    $conn->commit();
    manifest_response(200, false, "Manifest flagged for review.", ["id"=>$id, "status"=>"Discrepancy"]);
} catch (Throwable $e) { if ($conn->inTransaction()) $conn->rollBack(); manifest_log_exception($e); }
