const express = require('express');
const router = express.Router();
const { sendEmail, verifyEmailConnection, isEmailConfigured } = require('../utils/email.utils');

/**
 * Test email configuration
 * GET /api/test-email/config
 */
router.get('/config', async (req, res) => {
    try {
        const configured = isEmailConfigured();
        const verified = configured ? await verifyEmailConnection() : false;
        
        res.json({
            success: true,
            data: {
                configured,
                verified,
                config: {
                    host: process.env.EMAIL_HOST || 'Not set',
                    port: process.env.EMAIL_PORT || 'Not set',
                    user: process.env.EMAIL_USER ? '***' + process.env.EMAIL_USER.slice(-10) : 'Not set',
                    from: process.env.EMAIL_FROM || 'Not set'
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking email configuration',
            error: error.message
        });
    }
});

/**
 * Send test email
 * POST /api/test-email/send
 * Body: { to: "email@example.com" }
 */
router.post('/send', async (req, res) => {
    try {
        const { to } = req.body;
        
        if (!to) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a recipient email address'
            });
        }

        // Check if email is configured
        if (!isEmailConfigured()) {
            return res.status(503).json({
                success: false,
                message: 'Email service is not configured'
            });
        }

        // Send test email
        const result = await sendEmail({
            to,
            subject: 'Test Email from CIXIO',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { padding: 30px; background-color: #f9f9f9; border-radius: 0 0 5px 5px; }
                        .badge { background-color: #10B981; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; }
                        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Email Test Successful!</h1>
                        </div>
                        <div class="content">
                            <p><span class="badge">✓ SUCCESS</span></p>
                            
                            <h2>Your email configuration is working correctly!</h2>
                            
                            <p>This is a test email from CIXIO to verify that your SMTP email configuration is set up properly.</p>
                            
                            <p><strong>Test Details:</strong></p>
                            <ul>
                                <li>Sent at: ${new Date().toISOString()}</li>
                                <li>SMTP Host: ${process.env.EMAIL_HOST}</li>
                                <li>SMTP Port: ${process.env.EMAIL_PORT}</li>
                                <li>Sender: ${process.env.EMAIL_FROM}</li>
                            </ul>
                            
                            <p>Your application can now send emails for:</p>
                            <ul>
                                <li>✅ Email verification</li>
                                <li>✅ Password reset</li>
                                <li>✅ Contact form submissions</li>
                                <li>✅ Newsletter subscriptions</li>
                                <li>✅ System notifications</li>
                            </ul>
                            
                            <p>Best regards,<br>The CIXIO Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} CIXIO. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `Email Test Successful!\n\nYour email configuration is working correctly. This is a test email from CIXIO.\n\nSent at: ${new Date().toISOString()}\nSMTP Host: ${process.env.EMAIL_HOST}\nSMTP Port: ${process.env.EMAIL_PORT}\n\nBest regards,\nThe CIXIO Team`
        });

        res.json({
            success: true,
            message: 'Test email sent successfully!',
            data: {
                recipient: to,
                sentAt: new Date().toISOString(),
                messageId: result.messageId
            }
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: error.message
        });
    }
});

module.exports = router;
