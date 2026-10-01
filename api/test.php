<?php 
    require_once __DIR__."/include/conn.php";
        
    $code = rand(123456, 999999);
    $result = send_sms("08164902529", "Your One-time Pass is: 587555. Use immediately");
    
    if ($result['success']) {
        echo "SMS sent successfully!";
        print_r($result['response']);
    } else {
        echo "Failed to send SMS. Status code: {$result['status_code']}";
        print_r($result['response']);
    }