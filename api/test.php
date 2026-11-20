<?php
    $user = ["full_name"=>"Eloike david"];
    $otp = "232233";

    echo $message = "
        <div style='margin:0;padding:0;background-color:#FAF0E3;'>
            <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color:#FAF0E3;padding:40px 16px;'>
                <tr>
                    <td align='center'>
                        <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='max-width:600px;background-color:#FFFBF5;border:1px solid #E8D9C2;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;'>

                            <tr>
                                <td style='background-color:#FF6600;padding:28px 32px;'>
                                    <div style='font-size:24px;font-weight:800;letter-spacing:2px;color:#FFFFFF;'>
                                        TRINŪ
                                    </div>
                                    <div style='font-size:11px;font-weight:600;letter-spacing:1.5px;color:#FFE3CF;text-transform:uppercase;margin-top:5px;'>
                                        Bonded Terminal Digital Platform
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td style='padding:36px 32px 28px;'>
                                    <div style='display:inline-block;background-color:#FFF0E5;color:#D95700;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:7px 12px;border-radius:20px;margin-bottom:20px;'>
                                        Sign-in verification
                                    </div>

                                    <h1 style='margin:0 0 14px;font-size:25px;line-height:1.3;font-weight:800;color:#2B2A28;'>
                                        Verify your identity
                                    </h1>

                                    <p style='margin:0 0 12px;font-size:15px;line-height:1.7;color:#2B2A28;'>
                                        Hello " . htmlspecialchars($user["full_name"], ENT_QUOTES, "UTF-8") . ",
                                    </p>

                                    <p style='margin:0 0 28px;font-size:14px;line-height:1.8;color:#6B6357;'>
                                        You're almost there. Enter the verification code below to securely complete your sign-in to TRINŪ.
                                    </p>

                                    <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0'>
                                        <tr>
                                            <td align='center' style='background-color:#FAF0E3;border:1px solid #E8D9C2;border-radius:12px;padding:28px 16px;'>
                                                <div style='font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#8C7C69;margin-bottom:14px;'>
                                                    Your verification code
                                                </div>
                                                <div style='font-family:Consolas,Monaco,monospace;font-size:34px;font-weight:800;letter-spacing:10px;color:#FF6600;'>
                                                    " . htmlspecialchars($otp, ENT_QUOTES, "UTF-8") . "
                                                </div>
                                            </td>
                                        </tr>
                                    </table>

                                    <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-top:26px;'>
                                        <tr>
                                            <td style='padding:8px 0;font-size:13px;line-height:1.6;color:#6B6357;'>
                                                <span style='color:#FF6600;font-weight:700;'>&#9679;</span>&nbsp;&nbsp;
                                                This code expires in <strong style='color:#2B2A28;'>5 minutes</strong>.
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style='padding:8px 0;font-size:13px;line-height:1.6;color:#6B6357;'>
                                                <span style='color:#FF6600;font-weight:700;'>&#9679;</span>&nbsp;&nbsp;
                                                You have a maximum of <strong style='color:#2B2A28;'>5 verification attempts</strong>.
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style='padding:8px 0;font-size:13px;line-height:1.6;color:#6B6357;'>
                                                <span style='color:#FF6600;font-weight:700;'>&#9679;</span>&nbsp;&nbsp;
                                                If you did not attempt to sign in, you can safely ignore this email.
                                            </td>
                                        </tr>
                                    </table>

                                    <div style='margin-top:26px;padding:15px 16px;background-color:#FFF4E9;border-left:3px solid #FF6600;border-radius:4px;'>
                                        <p style='margin:0;font-size:12px;line-height:1.7;color:#765C45;'>
                                            <strong style='color:#2B2A28;'>Security reminder:</strong>
                                            Never share your verification code with anyone. TRINŪ will never ask you to disclose it.
                                        </p>
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td style='padding:0 32px;'>
                                    <div style='border-top:1px solid #E8D9C2;height:1px;line-height:1px;font-size:0;'>&nbsp;</div>
                                </td>
                            </tr>

                            <tr>
                                <td style='padding:24px 32px 30px;text-align:center;'>
                                    <div style='font-size:14px;font-weight:800;letter-spacing:1.5px;color:#FF6600;'>
                                        TRINŪ
                                    </div>
                                    <p style='margin:8px 0 0;font-size:11px;line-height:1.6;color:#8C7C69;'>
                                        Bonded Terminal Digital Platform
                                    </p>
                                    <p style='margin:12px 0 0;font-size:11px;line-height:1.6;color:#B8A894;'>
                                        This is an automated message. Please do not reply.
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </div>
    ";