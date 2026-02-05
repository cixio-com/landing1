# Support Email Notification - Troubleshooting Guide

## Issue Summary
Users are receiving "Welcome to Cixio!" emails when registering, but `support@cixio.com` is not receiving notification emails.

## Changes Made

### 1. Added Detailed Logging
Added console logging to all three controllers to track email sending:

**Files Updated:**
- `src/controllers/auth.controller.js`
- `src/controllers/contact.controller.js`
- `src/controllers/newsletter.controller.js`

**Log Messages:**
- ✅ Success: `"✅ Support notification email sent successfully to: support@cixio.com"`
- ❌ Error: `"❌ Background support notification error (non-blocking): [error message]"`

### 2. Verification Steps

#### Step 1: Restart the Server
The code changes require a server restart:

```powershell
# If using PM2
pm2 restart all

# If running directly
# Stop server (Ctrl+C), then:
node server.js

# If using npm
npm start
```

#### Step 2: Check Server Logs
After restarting, watch the console output when:
- A user registers
- Someone fills the contact form
- Someone subscribes to newsletter

You should see:
```
✅ Email sent successfully: <message-id>
✅ Support notification email sent successfully to: support@cixio.com
```

#### Step 3: Test Registration
Try registering a new user:

```bash
POST https://www.cixio.com/api/auth/register
Content-Type: application/json

{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "mobile": "1234567890",
  "password": "Test@123"
}
```

**Expected Logs:**
```
✅ Email sent successfully: <verification-email-message-id>
✅ Support notification email sent successfully to: support@cixio.com
```

## Troubleshooting Checklist

### ✅ Verify Environment Variables
Check that these are set in your `.env` file:

```bash
SUPPORT_EMAIL=support@cixio.com
EMAIL_HOST=email-smtp.ap-south-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=AKIA6EU5Z54GZ4ALLIXV
EMAIL_PASS=BPOfycQtt30c46LPpOw1cY1QKG/tWOtMfgqPo+4NE/U9
EMAIL_FROM=CIXIO <noreply@cixio.com>
```

### ✅ Test Email Sending Manually
Run this command to test email sending:

```powershell
cd c:\Users\Administrator\Desktop\work\mvp\landing1
node -e "require('dotenv').config(); const { sendEmail } = require('./src/utils/email.utils'); sendEmail({ to: process.env.SUPPORT_EMAIL, subject: 'Test Email', html: '<h1>Test</h1>' }).then(() => console.log('SUCCESS')).catch(err => console.error('ERROR:', err));"
```

**Expected Output:**
```
✅ Email sent successfully: <message-id>
SUCCESS
```

### ✅ Check AWS SES Email Verification
Ensure `support@cixio.com` is verified in AWS SES:

1. Go to AWS SES Console
2. Navigate to "Verified identities"
3. Check if `support@cixio.com` is verified
4. If in sandbox mode, both sender and recipient must be verified

### ✅ Check Email Delivery
If logs show "Email sent successfully" but you don't receive the email:

1. **Check Spam/Junk folder** for support@cixio.com
2. **Check AWS SES Sending Statistics** in AWS Console
   - Go to SES > Account dashboard
   - Check bounce and complaint rates
3. **Check AWS CloudWatch logs** for delivery issues
4. **Verify email quota** - Ensure you haven't hit AWS SES sending limits

### ✅ Common Issues

#### Issue 1: Email shows as sent but not received
**Likely Causes:**
- Email is in spam/junk folder
- AWS SES sandbox mode - recipient not verified
- Email filtering/firewall blocking

**Solution:**
1. Check spam folder
2. Verify recipient email in AWS SES
3. Move to production mode if in sandbox

#### Issue 2: `process.env.SUPPORT_EMAIL` is undefined
**Likely Causes:**
- `.env` file not loaded
- Server not restarted after `.env` changes

**Solution:**
1. Ensure `.env` file exists in project root
2. Restart the server completely
3. Check `SUPPORT_EMAIL` is correctly spelled in `.env`

#### Issue 3: AWS SES Authentication Error
**Error:** `Invalid login: 535 Authentication Credentials Invalid`

**Solution:**
1. Verify AWS SES SMTP credentials are correct
2. Ensure credentials haven't expired
3. Check region matches (ap-south-1)

## Monitoring Commands

### Check if Server is Running
```powershell
# If using PM2
pm2 status

# Check Node processes
Get-Process -Name node
```

### View Real-Time Logs
```powershell
# If using PM2
pm2 logs

# If running directly, logs appear in console
```

### Test Email Configuration
```powershell
cd c:\Users\Administrator\Desktop\work\mvp\landing1
node -e "require('dotenv').config(); console.log('SUPPORT_EMAIL:', process.env.SUPPORT_EMAIL); console.log('EMAIL_HOST:', process.env.EMAIL_HOST);"
```

## Next Steps

1. ✅ **Restart the server** to apply the new logging
2. ✅ **Register a test user** and check server logs
3. ✅ **Check both user email and support@cixio.com** inbox
4. ✅ **Review server console logs** for success/error messages
5. ✅ **Check AWS SES console** for sending statistics

## Expected Behavior After Fix

### User Registration:
- **User receives**: "Verify Your Email Address" from noreply@cixio.com
- **Support receives**: "New User Registration" notification with user details
- **Console logs**: Both email sending confirmations

### Contact Form:
- **User receives**: "Thank You for Contacting Us!" acknowledgment
- **Support receives**: "New Contact Form Submission" with message details
- **Console logs**: Both email sending confirmations

### Newsletter Subscription:
- **User receives**: "Verify Your Newsletter Subscription" email
- **Support receives**: "New Newsletter Subscription" notification
- **Console logs**: Both email sending confirmations

---

## Status: ✅ CODE UPDATED - RESTART REQUIRED

**Action Required:** 
1. Restart your server
2. Test registration
3. Check server logs for email confirmation messages
4. Check support@cixio.com inbox (including spam folder)

**Last Updated:** February 5, 2026  
**Files Modified:** 
- `src/controllers/auth.controller.js` - Added detailed logging
- `src/controllers/contact.controller.js` - Added detailed logging
- `src/controllers/newsletter.controller.js` - Added detailed logging
