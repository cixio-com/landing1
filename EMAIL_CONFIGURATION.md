# Email Configuration Guide - CIXIO

## Quick Answer: Port 587 Security Group

**Do I need to expose port 587 in EC2?**

**Answer: NO** ❌

### Why?
- **Port 587** = SMTP outbound (your app sends emails OUT to Gmail/SendGrid/cPanel)
- EC2 Security Group only needs to allow **INBOUND** traffic
- Your application connects **OUTBOUND** automatically - no firewall rule needed
- The external mail server (Gmail, SendGrid, etc.) is listening on port 587 for your connection

### EC2 Security Group - What You NEED:
```
Inbound Rules:
- Port 80 (HTTP)   ✅ Already configured
- Port 443 (HTTPS) ⚠️ Recommended to add
- Port 22 (SSH)    ✅ For EC2 management

Outbound Rules:
- All traffic allowed by default ✅
```

---

## 504 Gateway Timeout - ROOT CAUSE & FIX

### What Was Happening:
1. Register API calls `sendVerificationEmail()`
2. `sendVerificationEmail()` tries to connect to SMTP server
3. Nodemailer waits for SMTP response (default timeout: 30+ seconds)
4. Since `EMAIL_PASS=your-email-password` (placeholder), connection fails
5. Request blocks and waits... and waits... → **504 timeout**

### Solution Implemented:
✅ **Email timeout added**: 5 second connection timeout + 10 second send timeout
✅ **Non-blocking email**: Email now sends in background, API responds immediately
✅ **Graceful error handling**: Email errors logged, don't break registration

**Result**: Register API responds in <100ms, email attempts in background

---

## Step 1: Choose Your Email Provider

### Option A: Gmail (Easiest for Testing)
**Best for**: Development, quick testing
**Pros**: Free, easy setup, works everywhere
**Cons**: Limited to 100 emails/day, not recommended for production
**Setup Time**: 5 minutes

**Steps**:
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Windows Computer"
3. Copy the 16-character app password
4. Update `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
```

### Option B: SendGrid (Recommended for Production)
**Best for**: Production, reliable delivery
**Pros**: 100 emails/day free tier, excellent docs, great deliverability
**Cons**: Requires account setup
**Setup Time**: 10 minutes

**Steps**:
1. Sign up at [sendgrid.com](https://sendgrid.com) (free account)
2. Go to Settings → API Keys
3. Create new API key (copy it - you'll only see it once!)
4. Update `.env`:
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=SG.your_api_key_here_
```

### Option C: Mailgun (Developer-Friendly)
**Best for**: Scale beyond free tier
**Setup Time**: 15 minutes

**Steps**:
1. Sign up at [mailgun.com](https://mailgun.com)
2. Verify your domain (cixio.com)
3. Go to Sending → Domain Settings → SMTP Credentials
4. Update `.env`:
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@cixio.com
EMAIL_PASS=your-mailgun-password
```

### Option D: Your cPanel Hosting
**Best for**: Using your existing hosting
**Setup Time**: 5 minutes

**Steps**:
1. Log in to your cPanel
2. Go to Email Accounts
3. Create account: `noreply@cixio.com` with password
4. Find SMTP details in cPanel (usually `mail.cixio.com`)
5. Update `.env`:
```env
EMAIL_HOST=mail.cixio.com
EMAIL_PORT=587
EMAIL_USER=noreply@cixio.com
EMAIL_PASS=your-cpanel-email-password
```

### Option E: AWS SES (If Using AWS)
**Best for**: AWS infrastructure
**Setup Time**: 20 minutes

**Steps**:
1. Go to AWS SES Console
2. Request production access (if needed)
3. Create SMTP credentials
4. Update `.env`:
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-aws-smtp-username
EMAIL_PASS=your-aws-smtp-password
```

---

## Step 2: Update Your .env File

### Current Placeholder (CAUSES 504):
```env
EMAIL_HOST=mail.cixio.com
EMAIL_PORT=587
EMAIL_USER=noreply@cixio.com
EMAIL_PASS=your-email-password  # ❌ This is a placeholder!
```

### After Setup (Example with Gmail):
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  # 16-char app password from Gmail
EMAIL_FROM=CIXIO <noreply@cixio.com>
EMAIL_FROM_NAME=CIXIO
```

---

## Step 3: Deploy to EC2

### 1. SSH into EC2:
```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### 2. Update .env with new SMTP credentials:
```bash
cd /home/ec2-user/landing1
nano .env
```

**IMPORTANT**: Update these 4 lines:
- `EMAIL_HOST=` → Your provider's SMTP host
- `EMAIL_PORT=` → Usually 587 or 465
- `EMAIL_USER=` → Your email/API username
- `EMAIL_PASS=` → Your password/API key

Press `Ctrl+X`, then `Y` to save.

### 3. Rebuild and restart containers:
```bash
docker-compose down
docker build --no-cache -t cixio-app:latest .
docker-compose up -d
```

### 4. Check logs:
```bash
docker logs -f cixio-app
```

Look for: `✅ Email sent successfully:` (if email works)
Or: `❌ Error sending email:` (shows what went wrong)

---

## Step 4: Test Email Functionality

### Test via API (Using curl):
```bash
curl -X POST http://your-ec2-ip/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

**Expected response** (should be FAST <100ms):
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "userId": "...",
    "email": "test@example.com"
  }
}
```

### Check EC2 logs for email status:
```bash
docker logs cixio-app | tail -20
```

Should see either:
- ✅ `✅ Email sent successfully: <message-id>`
- 📧 `📧 Email not configured. Would send to:` (if SMTP not configured)
- ❌ `❌ Error sending email: Connection refused` (if credentials wrong)

---

## Troubleshooting

### 504 Gateway Timeout When Registering?

**Cause**: Email SMTP hanging

**Fix**:
1. Check `.env` - verify EMAIL_PASS is NOT a placeholder
2. Check SMTP credentials are correct for your provider
3. Run: `docker logs cixio-app` - look for SMTP error messages
4. If shows timeout, credentials are wrong - fix `.env`

### "Email not configured" Message Appearing?

**This is NORMAL** 👍

It means:
- SMTP settings are missing or incomplete
- Email logs to console instead of failing
- API still works fine, registration succeeds
- When you add SMTP credentials, emails will send

### Gmail: "Invalid credentials"

**Solutions**:
1. Use "App Passwords" (NOT your regular Gmail password)
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Copy 16-character code (spaces included)
3. Update `.env` with exact password including spaces

### SendGrid: "Unauthorized"

**Solution**:
- Make sure EMAIL_USER is exactly: `apikey` (lowercase)
- EMAIL_PASS is your full API key starting with `SG.`

### Email Sends But User Doesn't Receive?

**Possible causes**:
1. Check spam folder
2. Test with different email (test@gmail.com first)
3. Verify EMAIL_FROM matches your domain/account

---

## Security Best Practices

### ✅ DO:
- Store sensitive credentials in `.env` (never in code)
- Use app-specific passwords (Gmail) or API keys (SendGrid)
- Keep `.env` out of git (add to `.gitignore`)
- Use TLS/SSL (port 587) instead of plain (port 25)
- Rotate credentials periodically

### ❌ DON'T:
- Store real passwords in `.env.example`
- Expose `.env` file in git repository
- Use development credentials in production
- Use port 25 (deprecated, often blocked)
- Share API keys in Slack/email/etc.

---

## Current Implementation Details

### Email Flow (Non-Blocking):
```
User Registration Request
    ↓
Validate Input + Create User
    ↓
Start Email Send (Background) ← Non-blocking!
    ↓
Return Success Response (100ms)
    ↓
Email Sends in Background (Async)
    ↓
Email logs result
```

### Timeouts Added:
- Connection timeout: 5 seconds
- Socket timeout: 5 seconds
- Total email timeout: 10 seconds max

### Email Status Logging:
```
✅ Email sent successfully: <1234567890@...>
📧 Email not configured. Would send to: user@example.com
❌ Error sending email: SMTP authentication failed
```

---

## Quick Reference: .env Template

```env
# SMTP Configuration
EMAIL_HOST=smtp.gmail.com           # Change to your provider
EMAIL_PORT=587                      # 587 for TLS, 465 for SSL
EMAIL_USER=your-email@gmail.com     # Your email/username
EMAIL_PASS=xxxx xxxx xxxx xxxx      # Your password/API key
EMAIL_FROM=CIXIO <noreply@cixio.com>
EMAIL_FROM_NAME=CIXIO
SUPPORT_EMAIL=support@cixio.com
```

**Save file, rebuild container, restart service.**

---

## Next Steps

1. **Choose a provider** (Gmail easiest for now)
2. **Update `.env`** with credentials
3. **Deploy to EC2**
4. **Test registration** → should see email in inbox
5. **Monitor logs** → `docker logs cixio-app`

**Need help?** Check `/docker logs cixio-app` for detailed error messages.
