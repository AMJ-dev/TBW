<?php
    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\Exception;
    use PHPMailer\PHPMailer\SMTP;

    require_once __DIR__ . "/include/conn.php";

    // $email_host = "mail.tbw.ng";
    // $email_port = 465;
    // $email_user = "api@tbw.ng";
    // $email_password = "Group2026@";
    // $sender_email = "api@tbw.ng";

    // function send_email1($to, $name, $subject, $message, $reply_to="", $reply_name="", $attachment=[]){
    //     global $baseURL, $AppName, $sender_email, $comp_logo, $email_host, $email_port, $email_user, $email_password;  

    //     $template = file_get_contents(__DIR__."/include/email/index.tpl");
    //     $template = str_replace("<!-- #{AppName} -->", $AppName, $template);
    //     $template = str_replace("<!-- #{comp_logo} -->", $comp_logo, $template);
    //     $template = str_replace("<!-- #{baseURL} -->", $baseURL, $template);
    //     $template = str_replace("<!-- #{message} -->", $message, $template);
    //     $template = str_replace("<!-- #{email_user} -->", $email_user, $template);
    //     $template = str_replace("<!-- #{date_year} -->", date("Y"), $template);
       
    //     try {
    //         $mail = new PHPMailer(true);             
    //         $mail->isSMTP();      
    //         $mail->Mailer = "smtp";                                      
    //         $mail->SMTPAuth=true;                                            
    //         $mail->SMTPKeepAlive=true;                                
    //         $mail->SMTPSecure = "ssl"; 
    //         $mail->CharSet = "UTF-8";
    //         $mail->Encoding = "base64";                                            
    //         $mail->Host       = $email_host;                    
    //         $mail->Port       = $email_port;                
    //         $mail->Username   = $email_user;                    
    //         $mail->Password   = $email_password; 
    //         $mail->Sender = $sender_email;    
    //         $mail->From     = $sender_email;
    //         $mail->FromName = $AppName;                         
    //         $mail->Subject = $subject;
    //         $mail->Body    = $template;
    //         $mail->addAddress($to, $name);
            
    //         if(!empty($reply_to)) $mail->addReplyTo($reply_to, $reply_name);  
    //         else $mail->addReplyTo($sender_email, $AppName);
    //         if (is_array($attachment) && isset($attachment['path']) && file_exists($attachment['path'])) {
    //             $name = isset($attachment['name']) ? $attachment['name'] : basename($attachment['path']);
    //             $mail->addAttachment($attachment['path'], $name);
    //         }
    //         $mail->isHTML(true);
    //         try {
    //             $is_send = $mail->send();
    //             $mail->clearAddresses();
    //             $mail->clearAttachments();
    //             $mail->clearAllRecipients();
    //             $mail->clearCustomHeaders();
    //             return $is_send;
    //         } catch (\Throwable $th) {
    //             throw $th;
    //         }
    //     } catch (Exception $e) {
    //         echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
    //     }
    // }
    $subject = "TRINŪ Email ".rand(3322,32323);

    $message = "
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#333;'>
            <h2 style='color:#2258BF;'>TRINŪ</h2>
            <p>Hello HQF,</p>
            <p>This is an email to confirm that the outgoing mail configuration is working correctly.</p>
            <div style='background:#f4f6fa;padding:20px;text-align:center;border-radius:8px;'>
                <p style='margin:0;color:#2258BF;font-weight:bold;'>Email sent successfully.</p>
            </div>
            <p style='color:#777;font-size:12px;'>TRINŪ Bonded Terminal Digital Platform</p>
        </div>
    ";

    send_email("hqfdevelopers@gmail.com", "HQF", $subject, $message);