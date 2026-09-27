<?php
    use \Firebase\JWT\JWT;
    require_once dirname(__DIR__, 1).'/include/conn.php';
    if(isset($_POST["jwt"])){
        $decoded = JWT::decode($_POST["jwt"], $publicKey, array('RS256'));
        $my_details = get_user($decoded->id);
        if(empty($my_details) || $my_details==false) invalid_token();
        $_SESSION["login_id"] = $decoded->id;
    }
    if(isset($_SESSION["login_id"])){
        $get_user = $conn->prepare("SELECT id, email, full_name FROM users WHERE id=:id");
        $get_user->execute([":id"=>$_SESSION["login_id"]]);
        if ($get_user->rowCount() > 0) {
            $my_details = $get_user->fetch(PDO::FETCH_OBJ);          
            $error = false; 
            $data = "Please check your email for your OTP"; 
            $email = $my_details->email;
            require_once __DIR__."/send-otp.php";
        }  
    }
    echo json_encode(["data"=>$data, "error"=>$error]);