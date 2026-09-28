<?php
    use \Firebase\JWT\JWT; 
    require_once dirname(__DIR__, 1).'/include/conn.php';
    $code = [];
    $email = $_POST['email']; 
    $password = $_POST['password'];        
    $error = true; 
    $data = "Email or password incorrect";
    if ((!empty($email)) && (!empty($password))) {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $data = "Please enter valid email address.";
        else { 
            $chk_user = $conn->prepare('SELECT id, email, `password`, full_name FROM users WHERE email=:email');
           $chk_user->execute([':email'=>strtolower($email)]);
            if ($chk_user->rowCount() > 0) {
                $my_details = $chk_user->fetch(PDO::FETCH_OBJ);                    
                if (password_verify($password, $my_details->password)) {
                    $error = false; 
                    $data = "OTP sent to your email"; 

                    $token= ["id"=>$my_details->id];
                    $jwt = JWT::encode($token, $privateKey, 'RS256');
                    
                    $code = ["jwt"=>$jwt, "email"=>hide_email($my_details->email)];
                    
                    require_once __DIR__."/send-otp.php";
                }
            }  
        }
    }

    echo json_encode(['error'=>$error, 'data'=>$data, 'code'=>$code]);
