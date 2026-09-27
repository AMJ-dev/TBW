<?php
    require_once dirname(__DIR__, 1) . '/include/conn.php';

    // Only allow POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['error' => true, 'message' => 'Method not allowed']);
        exit;
    }

    try {
        // 1. Get and sanitize input
        $name    = trim($_POST['name'] ?? '');
        $email   = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
        $phone   = trim($_POST['phone'] ?? '');
        $subject = trim($_POST['subject'] ?? '');
        $message = trim($_POST['message'] ?? '');

        // 2. Validate required fields
        $errors = [];
        if (!$name || strlen($name) < 2) $errors[] = 'Valid name is required';
        if (!$email) $errors[] = 'Valid email is required';
        if (!$subject) $errors[] = 'Subject is required';
        if (!$message || strlen($message) < 10) $errors[] = 'Message must be at least 10 characters';

        if (!empty($errors)) {
            echo json_encode(['error' => true, 'message' => implode('. ', $errors)]);
            exit;
        }

        // 3. Sanitize for email body (prevent header injection)
        $name    = preg_replace('/[\r\n]/', '', htmlspecialchars($name, ENT_QUOTES, 'UTF-8'));
        $email   = preg_replace('/[\r\n]/', '', htmlspecialchars($email, ENT_QUOTES, 'UTF-8'));
        $phone   = preg_replace('/[\r\n]/', '', htmlspecialchars($phone, ENT_QUOTES, 'UTF-8'));
        $subject = preg_replace('/[\r\n]/', '', htmlspecialchars($subject, ENT_QUOTES, 'UTF-8'));
        $message = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));

        // 4. Format email content
        $emailSubject = "📩 New Contact Inquiry: $subject";
        
        $emailBody = "
            <h3>New Contact Form Submission</h3>
            <table style='border-collapse: collapse; width: 100%; max-width: 600px;'>
                <tr><td style='padding: 8px 0; font-weight: 600; width: 120px;'>Name:</td><td>$name</td></tr>
                <tr><td style='padding: 8px 0; font-weight: 600;'>Email:</td><td><a href='mailto:$email'>$email</a></td></tr>
                <tr><td style='padding: 8px 0; font-weight: 600;'>Phone:</td><td>" . ($phone ?: 'Not provided') . "</td></tr>
                <tr><td style='padding: 8px 0; font-weight: 600;'>Subject:</td><td>$subject</td></tr>
                <tr><td style='padding: 8px 0; font-weight: 600; vertical-align: top;'>Message:</td><td>$message</td></tr>
            </table>
            <hr style='margin: 20px 0; border: none; border-top: 1px solid #eee;' />
            <p style='color: #666; font-size: 12px;'>
                This message was sent from the contact form on <strong>$baseURL</strong><br/>
                Submitted on: " . date('F j, Y \a\t g:i A') . "
            </p>
        ";

        // 5. Send email to admin using your existing function
        $adminEmail = $info_email ?? 'admin@evcarsng.com'; // Fallback if $info_email not set
        
        $sent = send_email(
            $to         = $adminEmail,
            $name       = 'Admin',
            $subject    = $emailSubject,
            $message    = $emailBody,
            $reply_to   = $email,        // So admin can reply directly to customer
            $reply_name = $name,
            $attachment = []
        );

        if ($sent) echo json_encode(['error' => false, 'data' => 'Message sent successfully!']);
        else {
            error_log("Contact form email failed to send for: $email");
            echo json_encode(['error' => true, 'message' => 'Failed to send message. Please try again later.']);
        }

    } catch (Exception $e) {
        error_log("Contact form error: " . $e->getMessage());
        echo json_encode(['error' => true, 'message' => 'An error occurred. Please try again.']);
    }