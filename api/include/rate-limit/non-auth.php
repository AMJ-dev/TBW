<?php
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $endpoint = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $endpoint = is_string($endpoint) && $endpoint !== '' ? rtrim($endpoint, '/') ?: '/' : '/';
    $rate_limit_checks = [
        ['key' => 'ip:' . $ip, 'limit' => 60, 'window' => 60],
        ['key' => 'ip-hour:' . $ip, 'limit' => 1000, 'window' => 3600],
        ['key' => 'endpoint:' . $ip . ':' . $method . ':' . $endpoint, 'limit' => 30, 'window' => 60]
    ];
    require __DIR__ . '/index.php';