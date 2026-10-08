<?php
    try {
        $redis = new Redis();
        $redis->connect('127.0.0.1', 6379, 2.5);
    } catch (Throwable $e) {
        die("Redis connection failed: " . $e->getMessage());
    }