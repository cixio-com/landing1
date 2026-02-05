# Email Configuration Guide for CIXIO

## ✅ Current Configuration

Your application is configured to use **AWS SES (Simple Email Service)** for sending emails.

### SMTP Settings (Already Configured)

```env
EMAIL_HOST=email-smtp.ap-south-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=YOUR_AWS_SES_SMTP_USERNAME
EMAIL_PASS=YOUR_AWS_SES_SMTP_PASSWORD
EMAIL_FROM=CIXIO <noreply@cixio.com>
```

> **Note:** Actual credentials are stored securely in `.env` file

## 📧 Email Features

The application sends emails for the following scenarios:

1. **User Authentication**
   - Email verification after registration
   - Password reset requests
   - Welcome emails

2. **Contact Forms**
   - User acknowledgment emails
   - Admin notification emails

3. **Newsletter**
   - Subscription confirmation
   - Newsletter verification
   - Unsubscribe confirmations

4. **System Notifications**
   - Account updates
   - Security alerts
   - General notifications

## 🧪 Testing Email Configuration

### 1. Check Email Configuration
```bash
GET http://localhost/api/test-email/config
```

### 2. Send Test Email
```bash
POST http://localhost/api/test-email/send
Content-Type: application/json

{
  "to": "your-email@example.com"
}
```

### 3. Using cURL (PowerShell)
```powershell
# Check configuration
Invoke-RestMethod -Uri "http://localhost/api/test-email/config" -Method GET

# Send test email
$body = @{
    to = "your-email@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost/api/test-email/send" -Method POST -Body $body -ContentType "application/json"
```

## 📝 AWS SES Important Notes

### 1. Verify Email Addresses (Sandbox Mode)
If your AWS SES is in **sandbox mode**, you need to verify:
- The sender email (`noreply@cixio.com`)
- Any recipient email addresses for testing

To verify an email in AWS SES:
1. Go to AWS SES Console
2. Navigate to "Verified identities"
3. Click "Create identity"
4. Choose "Email address"
5. Enter the email and verify

### 2. Request Production Access
For production use, request to move out of sandbox:
1. Go to AWS SES Console
2. Click "Account Dashboard"
3. Click "Request production access"
4. Fill in the form explaining your use case

### 3. Email Sending Limits
- **Sandbox mode**: Can only send to verified emails, 200 emails/day
- **Production mode**: Higher limits based on your request

### 4. Monitor Email Deliverability
- Check bounce and complaint rates in AWS SES Console
- Keep rates below 5% for bounces and 0.1% for complaints

## 🔧 Troubleshooting

### Email Not Sending
1. Check SMTP credentials are correct
2. Verify sender email is verified in AWS SES
3. Check CloudWatch logs for errors
4. Ensure port 587 is not blocked by firewall

### Emails Going to Spam
1. Set up SPF records for your domain
2. Set up DKIM signing in AWS SES
3. Set up DMARC policy
4. Verify domain ownership in AWS SES

### Connection Timeout
1. Check network connectivity
2. Verify security group allows outbound on port 587
3. Try different SMTP port (465 for SSL)

## 🔐 Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Rotate SMTP credentials** regularly in AWS IAM
3. **Use IAM roles** instead of access keys when possible
4. **Monitor email usage** to detect any abuse
5. **Implement rate limiting** for email endpoints (already configured)

## 📊 Monitoring Email Health

Check email sending status:
```bash
# View application logs
docker logs cixio-com-app -f

# Look for these indicators:
# ✅ SMTP connection verified successfully
# 📧 Email service ready: email-smtp.ap-south-1.amazonaws.com:587
# ✅ Email sent successfully
```

## 🌐 Domain Setup for Production

To send emails from `@cixio.com`:

1. **Verify Domain in AWS SES**
   ```
   Domain: cixio.com
   ```

2. **Add DNS Records**
   Add these records to your DNS (values from AWS SES Console):
   - TXT record for domain verification
   - CNAME records for DKIM (3 records)
   - TXT record for SPF: `v=spf1 include:amazonses.com ~all`
   - TXT record for DMARC: `v=DMARC1; p=none; rua=mailto:admin@cixio.com`

3. **Enable DKIM Signing**
   - Enable in AWS SES Console for better deliverability

## 📱 Email Templates Location

Email templates are stored in:
```
src/emails/
├── email-verification.html
├── password-reset.html
├── welcome.html
├── subscription-confirmation.html
└── subscription-cancellation.html
```

## 🚀 Production Deployment Checklist

- [ ] AWS SES moved to production access
- [ ] Domain verified in AWS SES
- [ ] DNS records configured (SPF, DKIM, DMARC)
- [ ] SMTP credentials secured in `.env` file
- [ ] Test emails sent successfully
- [ ] Email templates reviewed and customized
- [ ] Monitoring and alerting set up
- [ ] Bounce and complaint notifications configured

## 📞 Support

For email configuration issues:
- AWS SES Documentation: https://docs.aws.amazon.com/ses/
- Check AWS SES sending limits: https://console.aws.amazon.com/ses/

## 🔄 Alternative Email Providers

If you want to switch from AWS SES, update `.env`:

### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASS=your-mailgun-password
```

### Gmail (Development Only)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

---

**Note**: The application will automatically verify the SMTP connection on startup and log the status. Check the console output when starting the server.
