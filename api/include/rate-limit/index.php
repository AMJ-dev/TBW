
<?php

try {
    if (
        !isset($rate_limit_secret) ||
        !is_string($rate_limit_secret) ||
        strlen($rate_limit_secret) < 32
    ) {
        throw new RuntimeException('Rate limit secret is missing or invalid.');
    }

    if (!isset($redis) || !($redis instanceof Redis)) {
        throw new RuntimeException('Redis connection is unavailable.');
    }

    if (
        !isset($rate_limit_checks) ||
        !is_array($rate_limit_checks) ||
        count($rate_limit_checks) === 0
    ) {
        throw new RuntimeException('Rate limit configuration is invalid.');
    }

    $keys = [];
    $arguments = [];

    foreach ($rate_limit_checks as $check) {

        if (
            !isset($check['key'], $check['limit'], $check['window']) ||
            !is_string($check['key']) ||
            !is_int($check['limit']) ||
            !is_int($check['window']) ||
            $check['limit'] < 1 ||
            $check['window'] < 1
        ) {
            throw new RuntimeException('Invalid rate limit rule.');
        }

        $keys[] = 'trinu:{rate_limit}:v1:' . hash_hmac(
            'sha256',
            $check['key'],
            $rate_limit_secret
        );

        $arguments[] = $check['limit'];
        $arguments[] = $check['window'];
        $arguments[] = bin2hex(random_bytes(16));
    }

    $lua = <<<'LUA'
local time = redis.call('TIME')

local now = tonumber(time[1]) * 1000 +
    math.floor(tonumber(time[2]) / 1000)

local retention = 21600
local total = #KEYS

for i = 1, total do

    local offset = (i - 1) * 3

    local max_requests = tonumber(ARGV[offset + 1])
    local window = tonumber(ARGV[offset + 2])
    local window_ms = window * 1000

    local key = KEYS[i]

    redis.call(
        'ZREMRANGEBYSCORE',
        key,
        '-inf',
        now - window_ms
    )

    local count = redis.call('ZCARD', key)

    if count >= max_requests then

        local oldest = redis.call(
            'ZRANGE',
            key,
            0,
            0,
            'WITHSCORES'
        )

        local retry = math.max(
            1,
            math.ceil(
                (tonumber(oldest[2]) + window_ms - now) / 1000
            )
        )

        return {0, retry, i, count}

    end

end

for i = 1, total do

    local offset = (i - 1) * 3

    redis.call(
        'ZADD',
        KEYS[i],
        now,
        ARGV[offset + 3]
    )

    redis.call(
        'EXPIRE',
        KEYS[i],
        retention
    )

end

return {1, 0, 0, 0}
LUA;

    $result = $redis->eval(
        $lua,
        array_merge($keys, $arguments),
        count($keys)
    );

    if (!is_array($result) || !isset($result[0])) {
        throw new RuntimeException('Invalid Redis rate limit response.');
    }

    if ((int) $result[0] === 0) {

        $retryAfter = max(1, (int) $result[1]);

        http_response_code(429);

        header('Content-Type: application/json');
        header('Retry-After: ' . $retryAfter);
        header('Cache-Control: no-store');

        echo json_encode([
            'error' => true,
            'data' => 'Too many requests. Please try again later.',
            'code' => 429
        ]);

        exit;
    }

} catch (Throwable $e) {

    error_log('Rate limit error: ' . $e->getMessage());

    if (
        isset($rate_limit_failed_closed) &&
        (string) $rate_limit_failed_closed === '1'
    ) {

        http_response_code(503);

        header('Content-Type: application/json');
        header('Cache-Control: no-store');

        echo json_encode([
            'error' => true,
            'data' => 'API protection service is temporarily unavailable.',
            'code' => 503
        ]);

        exit;
    }
}
