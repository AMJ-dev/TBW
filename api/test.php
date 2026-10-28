<?php
require_once __DIR__ . "/include/conn.php";

$update = $conn->prepare("
    UPDATE portal_shipments AS s
    INNER JOIN operation_manifests AS m
        ON m.bill_of_lading = s.bill_of_lading
    SET s.status = 'EXPECTED'
    WHERE m.status = 'Validated'
      AND s.status IN ('PENDING_REVIEW', 'CHANGES_REQUESTED', 'pending_review', 'changes_requested')
");

$update->execute();

echo json_encode([
    "error" => false,
    "data" => "Shipments updated successfully.",
    "updated" => $update->rowCount()
]);
?>