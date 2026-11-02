<?php
    require_once __DIR__ . "/include/conn.php";

    try {
        $conn->beginTransaction();

    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

    }