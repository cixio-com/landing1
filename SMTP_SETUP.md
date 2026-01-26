# SMTP Email Configuration Guide for CIXIO

## Overview
CIXIO uses NodeMailer to send emails. To enable email functionality, you need to configure SMTP settings in your `.env` file.

## Setup Options

### Option 1: Gmail (Development - Easiest)

**Steps:**
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select Mail and Device (Windows/Mac/Linux)
   - Google will generate a 16-character password
3. Update `.env`:
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=CIXIO <your-email@gmail.com>
EMAIL_FROM_NAME=CIXIO
SUPPORT_EMAIL=your-email@gmail.com
```

**Pros:** Free, easy setup, no limits for testing
**Cons:** Not recommended for production, daily sending limits

---

### Option 2: SendGrid (Recommended for Production)

**Steps:**
1. Sign up at https://sendgrid.com (free account available)
2. Create an API Key:
   - Go to Settings → API Keys
   - Generate a new key with "Mail Send" access
3. Update `.env`:
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=CIXIO <noreply@sendgrid.cixio.com>
EMAIL_FROM_NAME=CIXIO
SUPPORT_EMAIL=support@cixio.com
```

**Pros:** Enterprise-grade, good deliverability, analytics, free tier
**Cons:** May require domain verification

---

### Option 3: AWS SES (if using AWS)

**Steps:**
1. Go to AWS SES Console
2. Verify your domain or email
3. Create SMTP credentials:
   - Go to Account Dashboard → SMTP Settings
   - Click "Create My SMTP Credentials"
4. Update `.env`:
```bash
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-aws-smtp-username
EMAIL_PASS=your-aws-smtp-password
EMAIL_FROM=CIXIO <noreply@cixio.com>
EMAIL_FROM_NAME=CIXIO
SUPPORT_EMAIL=support@cixio.com
```

**Pros:** Integrated with AWS, cost-effective at scale
**Cons:** Requires AWS account

---

### Option 4: Mailgun

**Steps:**
1. Sign up at https://www.mailgun.com
2. Verify your domain
3. Get SMTP credentials from Domain Settings
4. Update `.env`:
```bash
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@yourdomain.mailgun.org
EMAIL_PASS=your-mailgun-smtp-password
EMAIL_FROM=CIXIO <noreply@yourdomain.mailgun.org>
EMAIL_FROM_NAME=CIXIO
SUPPORT_EMAIL=support@cixio.com
```

**Pros:** Developer-friendly, good documentation, free tier
**Cons:** Domain verification required

---

### Option 5: cPanel/Hosting Provider (For www.cixio.com)

If you have a hosting account with cPanel:

**Steps:**
1. Log in to cPanel
2. Go to Email Accounts
3. Create an email account (e.g., noreply@cixio.com)
4. Get SMTP details from your hosting provider
5. Update `.env`:
```bash
EMAIL_HOST=mail.cixio.com
EMAIL_PORT=587
EMAIL_USER=noreply@cixio.com
EMAIL_PASS=your-cPanel-email-password
EMAIL_FROM=CIXIO <noreply@cixio.com>
EMAIL_FROM_NAME=CIXIO
SUPPORT_EMAIL=support@cixio.com
```

**Pros:** Uses your own domain, integrated with hosting
**Cons:** Dependent on hosting provider

---

## Complete .env Configuration Example

```bash
# =============================================================================
# EMAIL CONFIGURATION - Gmail Example
# =============================================================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=CIXIO <your-email@gmail.com>
EMAIL_FROM_NAME=CIXIO
EMAIL_FROM_ADDRESS=your-email@gmail.com

SUPPORT_EMAIL=your-email@gmail.com
INFO_EMAIL=your-email@gmail.com

# Frontend URL (for email links)
FRONTEND_URL=https://www.cixio.com
API_URL=https://www.cixio.com/api
```

## Testing Email Configuration

### 1. Check if Email is Configured
```bash
# On EC2, check logs
docker logs cixio-app | grep -i "email\|mail"
```

### 2. Manual Test from Terminal
```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# Go to project directory
cd /home/ec2-user/landing1

# Test email configuration (from within container)
docker exec cixio-app node -e "
const dotenv = require('dotenv');
dotenv.config();
console.log('Email Config:');
console.log('HOST:', process.env.EMAIL_HOST);
console.log('PORT:', process.env.EMAIL_PORT);
console.log('USER:', process.env.EMAIL_USER);
console.log('PASS: [' + (process.env.EMAIL_PASS ? 'SET' : 'NOT SET') + ']');
console.log('FROM:', process.env.EMAIL_FROM);
"
```

### 3. Monitor Email Sending
```bash
# Watch logs for email activity
docker logs -f cixio-app | grep -i "email\|send\|mail"
```

## Common Issues

### "ECONNREFUSED" - Connection Failed
- Check EMAIL_HOST and EMAIL_PORT
- Verify firewall allows outgoing SMTP
- Test with: `telnet mail.your-host.com 587`

### "Invalid Login" - Authentication Failed
- Verify EMAIL_USER and EMAIL_PASS are correct
- For Gmail, use App Password (not regular password)
- For SendGrid, USER must be "apikey"

### Emails Not Sending
- Check if EMAIL_HOST is set (if not set, emails log to console)
- Look for errors in `docker logs cixio-app`
- Verify email configuration in .env

### Emails Going to Spam
- Add SPF record: `v=spf1 include:sendgrid.net ~all`
- Add DKIM records (provided by email service)
- Use domain for FROM address (not generic @gmail.com)

## For Production

**Recommended: SendGrid or AWS SES**

1. **SendGrid** - Best for most use cases
   - Free tier: 100 emails/day
   - Good deliverability
   - Excellent analytics

2. **AWS SES** - Best if already on AWS
   - Very cost-effective at scale
   - Excellent deliverability
   - Need to request production access

## Deployment Steps

1. Choose your email service
2. Get SMTP credentials
3. Update `.env` file on EC2:
   ```bash
   # SSH into EC2
   ssh -i your-key.pem ec2-user@your-ec2-ip
   
   # Edit .env
   nano /home/ec2-user/landing1/.env
   
   # Add your email configuration
   # Save: Ctrl+O, Enter, Ctrl+X
   ```

4. Rebuild Docker image:
   ```bash
   cd /home/ec2-user/landing1
   docker-compose down
   docker build --no-cache -t cixio-app:latest .
   docker-compose up -d
   ```

5. Verify email is working:
   ```bash
   # Register a new user and check logs
   docker logs -f cixio-app | grep -i "email\|send"
   ```

## Email Templates

Email templates are located in `src/emails/`:
- `email-verification.html` - Sent when user registers
- `subscription-confirmation.html` - Sent when subscription is activated
- `subscription-renewal.html` - Sent before subscription renews
- `subscription-cancellation.html` - Sent when subscription is cancelled

To customize templates, edit the HTML files and redeploy.

## Support

For issues with specific email providers:
- **Gmail**: Check https://support.google.com/accounts/answer/185833
- **SendGrid**: Check https://docs.sendgrid.com/ui/account-and-settings/smtp
- **AWS SES**: Check https://docs.aws.amazon.com/ses/latest/dg/send-email.html
- **Mailgun**: Check https://documentation.mailgun.com/en/latest/user_manual.html#smtp-credentials
