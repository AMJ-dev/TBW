<?php
    try {
        $redis = new Redis();
        $redis->connect($redis_ip, $redis_port, 2.5);
        $redis->auth($redis_password);
    } catch (Throwable $e) {
        die("Redis connection failed: " . $e->getMessage());
    }