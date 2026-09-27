<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head> 
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="initial-scale=1.0" />
        <meta name="format-detection" content="telephone=no" />
        <title>Subject</title>
        <style type="text/css">  
            #outlook a {
                padding: 0;
            }
            body {
                width: 100% !important;
                -webkit-text-size-adjust: 100%;
                -ms-text-size-adjust: 100%;
                margin: 0;
                padding: 0;
            }
            .ExternalClass {
                width: 100%;
            }
            .ExternalClass,
            .ExternalClass span,
            .ExternalClass font,
            .ExternalClass td,
            .ExternalClass div {
                line-height: 100%;
            }
            .ExternalClass p {
                line-height: inherit;
            }
            #body-layout {
                margin: 0;
                padding: 0;
                width: 100% !important;
                line-height: 100% !important;
            }
            img {
                display: block;
                outline: none;
                text-decoration: none;
                -ms-interpolation-mode: bicubic;
            }
            a img {
                border: none;
            }
            table td {
                border-collapse: collapse;
            }
            table {
                border-collapse: collapse;
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
            }
            a {
                color: orange;
                outline: none;
            }
			.shadow {
				background-color: #fafffb !important;
				padding: 2% !important;
				margin: 1% !important;
				border-radius: 15px !important;
				height: auto;
			}
        </style> 
    </head>
    <body id="body-layout">    
		<div class="shadow"> 
			<div style="max-width:640px; margin:0 auto; "> 
				<div style="padding: 20px; background-color: #fff; color:#209e2e;">                    
					<p style="font-size: 18px;"> 
						Hello <!-- #{name} -->,<br><br>
						A password reset request has been created for your account.&nbsp;
					</p>                   
					<p style="font-size: 16px;"> To initiate the password reset process, please copy the code below:</p>
					<p style='font-size: 16px;'> 
                    <a class='btn btn-warning' href='<!-- #{link} -->/' target='_blank'>Reset Password</a>
                </p>
					<p style="font-size: 16px;"></p>
					<p>
						<span style="font-size: 16px; line-height: 20px;"><br></span>
					</p>
					<p>
						<span style="font-size: 16px; line-height: 20px;">
							If you've received this mail in error, it's likely that another user entered your email address by mistake while trying to reset a password.
						</span><br>
					</p>
					<p>
						<span style="font-size: 16px; line-height: 20px;">
							If you didn't initiate the request, you don't need to take any further action and can safely disregard this email.
						</span><br>
					</p>
					<p style="font-size: 16px;"><br></p>
					<p style="font-size: 16px;"><!-- #{AppName} --></p>
				</div>
			</div>
		</div>
    </body>
</html>