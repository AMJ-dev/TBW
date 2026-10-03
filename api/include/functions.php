<?php
    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\Exception;
    use PHPMailer\PHPMailer\SMTP;
    
    use Twilio\Rest\Client;
    require __DIR__ . "/Twilio/autoload.php";

    function encrypt_pass($pass){
        return password_hash($pass, PASSWORD_ARGON2I);
    } 

    function check_login(){
        if(!isset($_SESSION["id"])) no_permision();
    }
    function invalid_token(){ 
        header($_SERVER['SERVER_PROTOCOL'] . ' 405 Method Not Allowed');
        echo json_encode(["error"=>true, "data"=>"Invalid Token"]);
        die(); 
    }
    function account_suspended() { 
        header($_SERVER['SERVER_PROTOCOL'] . ' 403 Forbidden');
        echo json_encode([
            "error" => true, 
            "code" => "ACCOUNT_SUSPENDED",
            "data" => "Account Suspended"
        ]);
        die(); 
    }
    function is_valid_phone(string $phone): bool {
        $cleaned = preg_replace('/[^\d+]/', '', $phone);
        return (bool) preg_match('/^(?:\+234|234|0)[789]\d{9}$|^\+?[1-9]\d{1,14}$/', $cleaned);
    }
    function no_permision(){ 
        header($_SERVER['SERVER_PROTOCOL'] . ' 403 Forbidden');
        echo json_encode(["error"=>true, "data"=>"You don't have enough permission to access this Resources"]);
        die(); 
    }
    function humandate($timestamp){
        return date("F jS, Y", strtotime($timestamp));
    }
    function humandatetime($timestamp){
        return date("F jS, Y h:i A", strtotime($timestamp));
    }

    function rm_special_char($char){
        return preg_replace("/[^a-zA-Z0-9\.]/", "1", $char);
    }
    function gen_filename($filename){
        $file_name = rm_special_char($filename);
        $bytes = bin2hex(openssl_random_pseudo_bytes(5));
        $name = $bytes . date("Y_m_d_h_i_s") . substr($file_name, -8);
        return "uploads/$name";
    } 
    function upload_files($file, $accepted){
        $error=true;
        $target_path = gen_filename($file["name"]); 
        if (!in_array($file["type"], $accepted)) $data = "Invalid file format";
        elseif (move_uploaded_file($file["tmp_name"], dirname(__DIR__, 1)."/".$target_path)) {
            $data = $target_path;
            $error=false;
        } else $data="Invalid file";
        return ["error"=>$error, "data"=>$data];
    } 
        
    function upload_multiple_files($file, $i, $accepted){ 
        $error=true;
        $target_path = gen_filename($file["name"][$i]); 
        if (!in_array($file["type"][$i], $accepted)) $data = "Invalid file format";
        elseif (move_uploaded_file($file["tmp_name"][$i], dirname(__DIR__, 1)."/".$target_path)) {
            $data = $target_path;
            $error=false;
        } else $data="Invalid file";
        return ["error"=>$error, "data"=>$data];
    }    
    function send_sms(string $to, string $body): array {
        global $sms_api_token, $sms_sender;
        $url = "https://www.bulksmsnigeria.com/api/v2/sms";
        
        $payload = [
            "from" => $sms_sender,
            "to" => $to,
            "body" => $body,
            "gateway" => "direct-corporate"
        ];

        $ch = curl_init($url);
        
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer " . $sms_api_token,
            "Content-Type: application/json",
            "Accept: application/json"
        ]);

        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);

        if ($error) {
            return [
                "success" => false,
                "status_code" => $statusCode,
                "response" => "cURL Error: " . $error
            ];
        }

        return [
            "success" => ($statusCode >= 200 && $statusCode < 300),
            "status_code" => $statusCode,
            "response" => json_decode($response, true) ?? $response
        ];
    }
    function send_email($to, $name, $subject, $message, $reply_to="", $reply_name="", $attachment=[]){
        global $baseURL, $AppName, $sender_email, $comp_logo, $email_host, $email_port, $email_user, $email_password;  
   
        $template = file_get_contents(__DIR__."/email/index.tpl");
        $template = str_replace("<!-- #{AppName} -->", $AppName, $template);
        $template = str_replace("<!-- #{comp_logo} -->", $comp_logo, $template);
        $template = str_replace("<!-- #{baseURL} -->", $baseURL, $template);
        $template = str_replace("<!-- #{message} -->", $message, $template);
        $template = str_replace("<!-- #{email_user} -->", $email_user, $template);
        $template = str_replace("<!-- #{date_year} -->", date("Y"), $template);
       
        try {
            $mail = new PHPMailer(true);             
            $mail->isSMTP();      
            $mail->Mailer = "smtp";                                      
            $mail->SMTPAuth=true;                                            
            $mail->SMTPKeepAlive=true;                                
            $mail->SMTPSecure = "ssl"; 
            $mail->CharSet = "UTF-8";
            $mail->Encoding = "base64";                                            
            $mail->Host       = $email_host;                    
            $mail->Port       = $email_port;                
            $mail->Username   = $email_user;                    
            $mail->Password   = $email_password; 
            $mail->Sender = $sender_email;    
            $mail->From     = $email_user;
            $mail->FromName = $AppName;                         
            $mail->Subject = $subject;
            $mail->Body    = $template;
            $mail->addAddress($to, $name);
            
            if(!empty($reply_to)) $mail->addReplyTo($reply_to, $reply_name);  
            else $mail->addReplyTo($email_user, $AppName);
            if (is_array($attachment) && isset($attachment['path']) && file_exists($attachment['path'])) {
                $name = isset($attachment['name']) ? $attachment['name'] : basename($attachment['path']);
                $mail->addAttachment($attachment['path'], $name);
            }
            $mail->isHTML(true);
            try {
                $is_send = $mail->send();
                $mail->clearAddresses();
                $mail->clearAttachments();
                $mail->clearAllRecipients();
                $mail->clearCustomHeaders();
                return $is_send;
            } catch (\Throwable $th) {
                throw $th;
            }
        } catch (Exception $e) {
            echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
        }
    }
    function generateId(){
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        $hex = bin2hex($bytes);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split($hex, 4));
    }
    function delete_file($file){
        if(!empty($file)){
            $file_location=dirname(__DIR__, 1)."/".$file;
            try {
                if (file_exists($file_location)) unlink($file_location);
            } catch (\Throwable $th) {
                //throw $th;
            }
        }
    }   
    function rand_id(){
        return rand(3000, 4500000);
    } 
    function gen_link_code(){
        return bin2hex(openssl_random_pseudo_bytes(200));
    }
    function gen_token(){
        $keyLength = rand(55, 155);
        $iterations = rand(2000, 10000);
        $data=generate_uuid()."-".uniqid();
        $generated_key=openssl_pbkdf2($data, gen_random_strings(), $keyLength, $iterations, "sha256");
        return base64_encode($generated_key);
    }
    function generate_uuid($uid="%04x%04x%04x-%04x%04x-%04x%04x-%04x%04x-%04x%04x%04x") {
        return sprintf($uid,
            mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xff4B ),
            mt_rand( 0, 0xffff ), mt_rand( 0, 0xff4B ), mt_rand( 0, 0xff4B ),
            mt_rand( 0, 0x0C2f ) | 0x4000, mt_rand( 0, 0x3fff ) | 0x8000,
            mt_rand( 0, 0xff4B ), mt_rand( 0, 0x2Aff ), mt_rand( 0, 0xffD3 ), mt_rand( 0, 0xff4B )
        );   
    }
    function gen_random_strings(){
        return bin2hex(openssl_random_pseudo_bytes(rand(15, 80)));
    } 
    function gen_password(){
        return bin2hex(openssl_random_pseudo_bytes(8));
    }
    function get_user($user_id, $sel="*"){
        global $conn;
        $user = "";
        $get_user = $conn->prepare("SELECT $sel FROM users WHERE id=:id");
        $get_user->execute([":id"=>$user_id]);
        if($get_user->rowCount()>0){
            $user = $get_user->fetch(PDO::FETCH_OBJ);
            if(!isset($user->middle_name) || empty($user->middle_name)) $user->middle_name="";
            unset($user->passord);
            $get_org = $conn->prepare("SELECT * FROM organisations WHERE id=:organisation_id");
            $get_org->execute([":organisation_id"=>$user->organisation_id]);
            if($get_org->rowCount()>0) {
                $organisation->organisation = $get_org->fetch(PDO::FETCH_OBJ);
                unset($organisation->verified_by);
                unset($organisation->verified_at);
                unset($organisation->rejection_reason);
                unset($organisation->created_at);
                unset($organisation->updated_at);
                $user->organisation = $organisation;
            }
        }
        return $user;
    }
    function send_otp($user_id, $email, $full_name){ 
        global $conn, $date_time;
        $otp = generate_otp();
        
        $message = "Your verification code is $otp. Please, don\'t disclose this to anyone.";
        send_email($email, $full_name, strtoupper("email verification"), $message);

        $save_otp=$conn->prepare("UPDATE email_otp SET otp=:otp, date_time=:date_time WHERE user_id=:user_id");
        $save_otp->bindValue(':otp', $otp); 
        $save_otp->bindValue(':date_time', $date_time);
        $save_otp->bindValue(':user_id', $user_id); 
        return $save_otp->execute();
    }
    function hide_email($email){
        $em   = explode("@", strtolower($email));
        $name = implode('@', array_slice($em, 0, count($em) - 1));
        if(strlen($name)==1) return   '*'.'@'.end($em);
        $len  = floor(strlen($name)/2);
        return substr($name,0, $len) . str_repeat('*', $len) . "@" . end($em);
    }
    function hide_phone(string $phone): string {
        $cleaned = preg_replace('/[^\d+]/', '', $phone);
        $len = strlen($cleaned);
        if ($len <= 4) return str_repeat('*', $len);
        $visible_tail = substr($cleaned, -3);
        $masked_part = str_repeat('*', $len - 3);
        
        return $masked_part . $visible_tail;
    }
    function getUserIP(): string {
        $keys = [
            'HTTP_CF_CONNECTING_IP',   // Cloudflare
            'HTTP_X_REAL_IP',          // Nginx proxy
            'HTTP_X_FORWARDED_FOR',    // Standard proxy header (may contain multiple IPs)
            'HTTP_X_FORWARDED',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'HTTP_CLIENT_IP',
            'REMOTE_ADDR'
        ];

        foreach ($keys as $key) {
            if (!empty($_SERVER[$key])) {
                // Handle comma-separated list (e.g., X-Forwarded-For: client, proxy1, proxy2)
                $ip = trim(explode(',', $_SERVER[$key])[0]);
                
                // Validate IP format
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return '0.0.0.0'; // Fallback
    }
    function save_activity_log($action, $entity, $entity_name, $user_email){
        global $conn;
        $stmt = $conn->prepare("INSERT INTO activity_logs (action, entity, entity_name, user_email) VALUES (:action, :entity, :entity_name, :user_email)");
        $stmt->bindValue(':action', $action);
        $stmt->bindValue(':entity', $entity);
        $stmt->bindValue(':entity_name', $entity_name);
        $stmt->bindValue(':user_email', $user_email);
        $stmt->execute();
    }