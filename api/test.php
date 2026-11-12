<?php
    require_once __DIR__ . "/include/conn.php";
    
    try {
        $get =  $conn->prepare("SELECT id, document_type FROM portal_shipment_documents");
        $get->execute();
        while($docs = $get->fetch(PDO::FETCH_OBJ)){
            $type = clean_type($docs->document_type)."\n";
            $reference_code = generate_ref($type);
            $update = $conn->prepare("UPDATE portal_shipment_documents SET reference_code=:reference_code WHERE id=:id");
            $update->bindValue(":reference_code", $reference_code);
            $update->bindValue(":id", $docs->id);
            $update->execute();
        }
    } catch (Throwable $e) {
        echo $e->getMessage();
    }