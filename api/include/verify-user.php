<?php
    require_once __DIR__ . '/check-user.php';

    if($my_details->account_status !== 'active') invalid_token();

    