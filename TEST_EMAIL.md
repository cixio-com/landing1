# 📧 Quick Email Test Guide

## Test Email Configuration - 3 Simple Steps

### Step 1: Start the Application

```powershell
# Navigate to project directory
cd c:\Users\Administrator\Desktop\work\mvp\landing1

# Start with Docker Compose
docker-compose up -d

# Check logs for email verification
docker logs cixio-com-app
```

**Look for these messages:**
```
✅ Connected to MongoDB successfully
✅ SMTP connection verified successfully
📧 Email service ready: email-smtp.ap-south-1.amazonaws.com:587
📤 Sending from: CIXIO <noreply@cixio.com>
```

### Step 2: Test Email Configuration

```powershell
# Check if email is configured
Invoke-RestMethod -Uri "http://localhost/api/test-email/config" -Method GET
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "configured": true,
    "verified": true,
    "config": {
      "host": "email-smtp.ap-south-1.amazonaws.com",
      "port": "587",
      "user": "***4ALLIXV",
      "from": "CIXIO <noreply@cixio.com>"
    }
  }
}
```

### Step 3: Send Test Email

```powershell
# Send test email to yourself
$body = @{
    to = "your-email@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost/api/test-email/send" -Method POST -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully!",
  "data": {
    "recipient": "your-email@example.com",
    "sentAt": "2026-02-05T...",
    "messageId": "<...@email.amazonses.com>"
  }
}
```

---

## 🎯 Test All Email Features

### 1. User Registration Email
```powershell
$body = @{
    firstName = "Test"
    lastName = "User"
    email = "test@example.com"
    password = "TestPass123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```
**Check:** Verification email should be sent to `test@example.com`

### 2. Password Reset Email
```powershell
$body = @{
    email = "test@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost/api/auth/forgot-password" -Method POST -Body $body -ContentType "application/json"
```
**Check:** Password reset email should be sent

### 3. Contact Form Email
```powershell
$body = @{
    name = "Test User"
    email = "test@example.com"
    subject = "Test Inquiry"
    message = "This is a test message"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost/api/contacts" -Method POST -Body $body -ContentType "application/json"
```
**Check:** Two emails should be sent:
- Acknowledgment to user
- Notification to admin

### 4. Newsletter Subscription
```powershell
$body = @{
    email = "test@example.com"
    name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost/api/newsletter/subscribe" -Method POST -Body $body -ContentType "application/json"
```
**Check:** Subscription verification email should be sent

---

## ⚠️ Important: AWS SES Sandbox Mode

If your AWS SES is in **sandbox mode**, you can only send emails to **verified email addresses**.

### Verify Your Test Email:
1. Go to https://console.aws.amazon.com/ses/
2. Click "Verified identities" in the left menu
3. Click "Create identity"
4. Select "Email address"
5. Enter your test email address
6. Click "Create identity"
7. Check your email inbox and click the verification link

### Verify These Emails:
- ✅ `noreply@cixio.com` (sender)
- ✅ Your test email address (recipient)
- ✅ `admin@cixio.com` (for contact form notifications)

---

## 🔍 Troubleshooting

### "Email service is not configured"
**Solution:** Check `.env` file has all EMAIL_* variables set correctly

### "SMTP connection failed"
**Solution:** 
1. Verify AWS SES credentials are correct
2. Check if sender email is verified in AWS SES Console
3. Ensure port 587 is not blocked by firewall

### "Email sent but not received"
**Solution:**
1. Check spam/junk folder
2. Verify recipient email in AWS SES Console (if in sandbox mode)
3. Check AWS SES sending statistics in console

### "Too many requests"
**Solution:** Rate limiting is active. Wait a few minutes and try again.

---

## 📊 Monitor Email Delivery

### Check Application Logs
```powershell
docker logs cixio-com-app -f | Select-String "email"
```

### Check AWS SES Dashboard
https://console.aws.amazon.com/ses/home?region=ap-south-1#/account

Monitor:
- Sending rate
- Bounce rate (should be < 5%)
- Complaint rate (should be < 0.1%)
- Delivery rate (should be > 95%)

---

## ✅ Success Checklist

- [ ] Application started successfully
- [ ] SMTP connection verified in logs
- [ ] Test email configuration returns `verified: true`
- [ ] Test email sent successfully
- [ ] Test email received in inbox
- [ ] User registration email works
- [ ] Password reset email works
- [ ] Contact form emails work
- [ ] Newsletter subscription emails work

---

## 📞 Need Help?

- Check `EMAIL_SETUP_GUIDE.md` for detailed setup instructions
- Check `EMAIL_STATUS.md` for configuration summary
- Review application logs for error messages
- Verify AWS SES configuration in AWS Console

**Status**: Ready to test! 🚀
