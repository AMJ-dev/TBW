<?php 
    require_once __DIR__ . "/include/conn.php";
    $subject ="Info from Trinu Connect";
    $message ="This is a test message.";
    send_email("hqfdevelopers@gmail.com", "Sam dan", $subject, $message);