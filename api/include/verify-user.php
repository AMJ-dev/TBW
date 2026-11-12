<?php
    require_once __DIR__ . '/check-user.php';
    require_once __DIR__ . '/rate-limit/auth.php';
    if($my_details->account_status !== 'active') invalid_token();