<?php
    require_once dirname(__DIR__, 1).'/include/conn.php';
    if($_POST["where"] == "send-link"){
        $check_user = $conn->prepare("SELECT id, full_name FROM users WHERE email=:email");
        $check_user->execute([":email"=>strtolower($_POST["email"])]);
        if($check_user->rowCount()>0){
            $my_details = $check_user->fetch(PDO::FETCH_OBJ);
            $link1 = generate_reset_link();
            $link2 = generate_reset_link();
            $update_link = $conn->prepare("UPDATE password_reset SET link1=:link1, link2=:link2, date_expires=:date_expires WHERE user_id=:user_id");
            $update_link->bindValue(":link1", $link1);
            $update_link->bindValue(":link2", $link2);
            $update_link->bindValue(":date_expires", get_expires());
            $update_link->bindValue(":user_id", $my_details->id);
            if($update_link->execute()){
                $error =false;
                $data = "Email Sent Successfully";
                $request_method = "post";
                
                $reset_link = $baseURL."page/non-auth/confirm-password/".gen_random_strings()."/$link1/$link2/";
                $subject = "Verify your email address";
                $message = "                
                    <h4>Hi {$my_details->full_name},</h4> <br>               
                    <p>
                        You recently requested to reset the password for your 
                        $AppName account. 
                        Click the button below to proceed.
                    </p>
                    <a href='$reset_link' style='$btn_style'>
                        RESET PASSWORD
                    </a>
                    <p>You can also copy the text below into your browser if you are having problems with the button.</p>
                    <a href='$reset_link'>$reset_link</a>
                    <p>
                        If you did not request a password reset, 
                        please ignore this email or reply to let us know. 
                        This password reset link is only valid for the next $otp_expires.
                    </p>
                ";
                send_email($_POST["email"], "Admin", $subject, $message);
            }
        }else $data = "Email doesnt exist";
    }elseif($_POST["where"] == "reset-link"){     
        $check_link = $conn->prepare("SELECT id, date_expires FROM password_reset WHERE link1 = :link1 && link2 = :link2");
        $check_link->bindValue(":link1", $_POST["link1"]);
        $check_link->bindValue(":link2", $_POST["link2"]);
        $check_link->execute();
        if($check_link->rowCount()>0){
            $my_details = $check_link->fetch(PDO::FETCH_OBJ); 
            if(strtotime($date_time) < strtotime($my_details->date_expires)){
                if($_POST["password1"] != $_POST["password2"]) $data = "password did not match";
                else{
                    $update_password = $conn->prepare("UPDATE users SET `password`=:user_pass WHERE id=:id");
                    $update_password->bindValue(":user_pass", encrypt_pass($_POST["password1"]));
                    $update_password->bindValue(":id", $my_details->id);
                    if($update_password->execute()){
                        $error = false; 
                        $data = "Your password has been reset";
                        $empty_link = $conn->prepare("UPDATE password_reset SET link1=:link1, link2=:link2, date_expires=:date_expires WHERE id=:id");
                        $empty_link->bindValue(":link1", "");
                        $empty_link->bindValue(":link2", "");
                        $empty_link->bindValue(":date_expires", "");
                        $empty_link->bindValue(":id", $my_details->id);
                        $empty_link->execute();
                        $me = get_user($my_details->id, "full_name, last_name, email");
                        $message = <<<HTML
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width,initial-scale=1">
                          <title>Password Reset Successful</title>
                          <style>
                            @media only screen and (max-width: 600px) {
                              .container { width: 100% !important; }
                              .px { padding-left: 24px !important; padding-right: 24px !important; }
                            }
                            .preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all; }
                          </style>
                        </head>
                        <body style="margin:0; padding:0; background-color:#f0f8ff; font-family: Inter, Arial, sans-serif; color:#333; line-height:1.6;">
                          <div class="preheader">
                            Your password has been reset successfully.
                          </div>
                        
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f0f8ff;">
                            <tr>
                              <td align="center" style="padding:20px 12px;">
                                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="container" style="max-width:600px; width:100%; background-color:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                                  
                                  <!-- Header -->
                                  <tr>
                                    <td align="center" style="background-color:#0000CC; padding:24px;">
                                      <div style="font-size:24px; font-weight:bold; color:#00FF00; letter-spacing:.5px;">
                                        {$AppName}
                                      </div>
                                    </td>
                                  </tr>
                                  
                                  <!-- Body -->
                                  <tr>
                                    <td class="px" style="padding:32px;">
                                      <div style="text-align:center; margin-bottom:20px;">
                                        <div style="display:inline-flex; align-items:center; justify-content:center; width:70px; height:70px; border-radius:50%; background-color:rgba(0,0,204,0.05); border:2px solid #0000CC; color:#0000CC; font-size:32px;">
                                          🔒
                                        </div>
                                      </div>
                        
                                      <h1 style="font-size:24px; color:#0000CC; text-align:center; margin:0 0 20px;">Password Reset Successful</h1>
                        
                                      <p style="margin:0 0 16px;">
                                        The password for your <strong>{$AppName}</strong> account has been successfully reset.
                                      </p>
                        
                                      <p style="margin:0 0 16px;">
                                        If you did not reset your password, please contact our support team immediately:
                                        <a href="mailto:{$email_user}" style="color:#0000CC; font-weight:bold; text-decoration:none;">here</a>.
                                      </p>
                        
                                      <div style="margin:24px 0; height:1px; background:linear-gradient(to right, transparent, #0000CC, transparent);"></div>
                        
                                      <p style="margin:0; font-size:14px; color:#666; text-align:center;">
                                        For security, we recommend updating your security questions and enabling two-factor authentication if not already active.
                                      </p>
                                    </td>
                                  </tr>
                                  
                                  <!-- Footer -->
                                  <tr>
                                    <td align="center" style="background-color:rgba(0,0,204,0.05); padding:20px; font-size:14px; color:#666;">
                                      © {date("Y")} {$AppName}. All rights reserved.
                                    </td>
                                  </tr>
                        
                                </table>
                              </td>
                            </tr>
                          </table>
                        </body>
                        </html>
                        HTML;
                        
                        send_email($me->email, $me->full_name, $data, $message);
                    }
                }
            }else $data = "Link expired, Please try again";
        }
    }
    echo json_encode(["data"=>$data, "error"=>$error]);