<?php
    // update driver status to expired when licence_expiry is reached 
    // to run everyday
    require_once dirname(__DIR__, 1) . "/include/conn.php";
    $logFile = dirname(__DIR__, 1) . "/logs/check-driver-licences.log";

    try {
        $stmt = $conn->prepare("
            UPDATE gate_drivers
            SET status = 'Expired'
            WHERE licence_expiry IS NOT NULL
            AND licence_expiry < CURDATE()
            AND LOWER(status) NOT IN ('expired', 'rejected', 'suspended')
        ");

        $stmt->execute();

        $message = sprintf(
            "[%s] SUCCESS: Expired driver licences checked. Updated: %d%s",
            date("Y-m-d H:i:s"),
            $stmt->rowCount(),
            PHP_EOL
        );

        file_put_contents($logFile, $message, FILE_APPEND | LOCK_EX);
    } catch (Throwable $e) {
        $message = sprintf(
            "[%s] ERROR: Could not update expired driver licences. %s%s",
            date("Y-m-d H:i:s"),
            $e->getMessage(),
            PHP_EOL
        );

        file_put_contents($logFile, $message, FILE_APPEND | LOCK_EX);
    }