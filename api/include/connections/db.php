<?php
    try {
        $dsn = "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4";

        $conn = new PDO($dsn, $db_user, $db_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
    } catch (PDOException $e) {
        die("DB Connection Failed: " . $e->getMessage());
    }