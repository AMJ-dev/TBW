<?php
    require_once dirname(__DIR__, 1).'/include/conn.php';

    if (empty($_POST['npassword'])) $data = "Please enter your password";   
    elseif($_POST['npassword'] == $_POST['cpassword'])  {  
        $check_pass = $conn->prepare('SELECT `password` FROM users WHERE id=:id');
        $check_pass->execute([':id'=>$my_details->id]);
        $my_password = $check_pass->fetch(PDO::FETCH_OBJ)->password;                    
        if (password_verify($_POST['opassword'], $my_password)) {
            $update_pass=$conn->prepare("UPDATE users SET `password`=:my_password WHERE id=:id");
            $update_pass->bindValue("my_password", encrypt_pass($_POST['npassword']));
            $update_pass->bindValue("id", $my_details->id);
            if($update_pass->execute()){
                $error = false; 
                $data = "Password Changed Successfully";

                $subject = "Password Updated Successfully - Horizon Quantum Forge";
                
                $message = "
                    <!DOCTYPE html>
                    <html lang='en'>
                    <head>
                        <meta charset='UTF-8'>
                        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                        <title>Password Update Confirmation</title>
                        <style>
                            * {
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                            }
                            
                            body {
                                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                line-height: 1.6;
                                color: #1f2937;
                                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
                                padding: 20px;
                            }
                            
                            .email-container {
                                max-width: 600px;
                                margin: 0 auto;
                                background: white;
                                border-radius: 16px;
                                overflow: hidden;
                                box-shadow: 0 20px 60px -8px rgba(0, 0, 0, 0.15);
                                border: 1px solid #e2e8f0;
                            }
                            
                            .email-header {
                                background: linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%);
                                color: white;
                                padding: 40px 30px;
                                text-align: center;
                            }
                            
                            .email-header h1 {
                                font-size: 28px;
                                font-weight: 800;
                                margin-bottom: 8px;
                                letter-spacing: -0.025em;
                            }
                            
                            .email-header p {
                                font-size: 16px;
                                opacity: 0.9;
                                font-weight: 500;
                            }
                            
                            .email-body {
                                padding: 40px 30px;
                            }
                            
                            .confirmation-section {
                                background: #f0f9ff;
                                border: 1px solid #bae6fd;
                                border-radius: 12px;
                                padding: 24px;
                                margin-bottom: 24px;
                                text-align: center;
                            }
                            
                            .confirmation-icon {
                                width: 64px;
                                height: 64px;
                                background: linear-gradient(135deg, #10b981, #059669);
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                margin: 0 auto 16px;
                            }
                            
                            .confirmation-icon svg {
                                width: 32px;
                                height: 32px;
                                color: white;
                            }
                            
                            .details-section {
                                background: #f8fafc;
                                border-radius: 8px;
                                padding: 20px;
                                margin-bottom: 24px;
                                border: 1px solid #e2e8f0;
                            }
                            
                            .detail-row {
                                display: flex;
                                justify-content: space-between;
                                padding: 12px 0;
                                border-bottom: 1px solid #e5e7eb;
                            }
                            
                            .detail-row:last-child {
                                border-bottom: none;
                            }
                            
                            .detail-label {
                                font-weight: 600;
                                color: #374151;
                            }
                            
                            .detail-value {
                                color: #1f2937;
                                font-weight: 500;
                            }
                            
                            .security-notice {
                                background: #fef3c7;
                                border: 1px solid #f59e0b;
                                border-radius: 8px;
                                padding: 16px;
                                margin: 24px 0;
                            }
                            
                            .security-notice h3 {
                                color: #92400e;
                                font-size: 16px;
                                font-weight: 700;
                                margin-bottom: 8px;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            }
                            
                            .action-section {
                                text-align: center;
                                margin-top: 24px;
                            }
                            
                            .support-button {
                                display: inline-block;
                                background: linear-gradient(135deg, #1e40af, #0ea5e9);
                                color: white;
                                padding: 12px 24px;
                                text-decoration: none;
                                border-radius: 8px;
                                font-weight: 600;
                                font-size: 14px;
                                margin: 8px;
                            }
                            
                            .help-section {
                                background: #f8fafc;
                                border-radius: 8px;
                                padding: 20px;
                                margin-top: 24px;
                                text-align: center;
                                border: 1px solid #e2e8f0;
                            }
                            
                            .email-footer {
                                background: #f8fafc;
                                padding: 24px 30px;
                                text-align: center;
                                border-top: 1px solid #e2e8f0;
                                color: #6b7280;
                                font-size: 12px;
                            }
                            
                            .logo {
                                font-size: 20px;
                                font-weight: 800;
                                background: linear-gradient(135deg, #1e40af, #0ea5e9);
                                -webkit-background-clip: text;
                                -webkit-text-fill-color: transparent;
                                margin-bottom: 8px;
                            }
                            
                            .timestamp {
                                color: #6b7280;
                                font-size: 12px;
                                text-align: center;
                                margin-top: 16px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class='email-container'>
                            <div class='email-header'>
                                <h1>Password Updated Successfully</h1>
                                <p>Your Horizon Quantum Forge account security has been enhanced</p>
                            </div>
                            
                            <div class='email-body'>
                                <div class='confirmation-section'>
                                    <div class='confirmation-icon'>
                                        <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/>
                                        </svg>
                                    </div>
                                    <h2 style='color: #065f46; font-size: 20px; font-weight: 700; margin-bottom: 8px;'>
                                        Password Change Confirmed
                                    </h2>
                                    <p style='color: #047857; font-size: 14px;'>
                                        Your account password has been successfully updated and secured
                                    </p>
                                </div>
                                
                                <div class='details-section'>
                                    <h3 style='color: #1f2937; font-size: 16px; font-weight: 700; margin-bottom: 16px; text-align: center;'>
                                        Account Update Details
                                    </h3>
                                    <div class='detail-row'>
                                        <span class='detail-label'>Account Holder:</span>
                                        <span class='detail-value'>Admin</span>
                                    </div>
                                    <div class='detail-row'>
                                        <span class='detail-label'>Email Address:</span>
                                        <span class='detail-value'>{$my_details->email}</span>
                                    </div>
                                    <div class='detail-row'>
                                        <span class='detail-label'>Update Type:</span>
                                        <span class='detail-value'>Password Change</span>
                                    </div>
                                    <div class='detail-row'>
                                        <span class='detail-label'>Status:</span>
                                        <span class='detail-value' style='color: #059669; font-weight: 700;'>Completed Successfully</span>
                                    </div>
                                </div>
                                
                                <div class='security-notice'>
                                    <h3>
                                        <svg fill='none' stroke='currentColor' viewBox='0 0 24 24' style='width: 16px; height: 16px;'>
                                            <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'/>
                                        </svg>
                                        Important Security Information
                                    </h3>
                                    <p style='color: #92400e; font-size: 14px; line-height: 1.5;'>
                                        This password change was initiated from your account. If you did not authorize this change, 
                                        please contact our support team immediately to secure your account.
                                    </p>
                                </div>
                                
                                <div class='action-section'>
                                    <p style='color: #6b7280; font-size: 14px; margin-bottom: 16px;'>
                                        Need assistance or have questions about this change?
                                    </p>
                                    <a href='mailto:{$admin_email}' class='support-button'>
                                        Contact Support Team
                                    </a>
                                </div>
                                
                                <div class='help-section'>
                                    <h4 style='color: #374151; font-size: 14px; font-weight: 700; margin-bottom: 8px;'>
                                        Security Best Practices
                                    </h4>
                                    <p style='color: #6b7280; font-size: 12px; line-height: 1.4;'>
                                        • Use a unique, strong password for your account<br>
                                        • Enable two-factor authentication if available<br>
                                        • Never share your password with anyone<br>
                                        • Regularly update your password for enhanced security
                                    </p>
                                </div>
                                
                                <div class='timestamp'>
                                    This action was performed on " . date('F j, Y \a\t g:i A') . "
                                </div>
                            </div>
                            
                            <div class='email-footer'>
                                <div class='logo'>HORIZON QUANTUM FORGE</div>
                                <p>This is an automated security notification from Horizon Quantum Forge</p>
                                <p>If you have any concerns about your account security, please contact us immediately</p>
                                <p>&copy; " . date('Y') . " Horizon Quantum Forge. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                ";
                send_email($my_details->email, 'Admin', $subject, $message);
            } 
        } else $data = "Incorrect Password"; 
    } else $data = "Password did not match"; 

    echo json_encode(['error' => $error, 'data' => $data]);