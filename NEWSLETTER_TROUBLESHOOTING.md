# Newsletter Subscription Error - Troubleshooting Steps

## Error Message
"Failed to process subscription. Please try again later"

## Quick Diagnostic Steps

### Step 1: Check Browser Console (F12)
1. Open DevTools (Press F12)
2. Go to **Console** tab
3. Try submitting the newsletter form
4. Look for these log messages:
   - `Newsletter Subscription: {...}` - Should show the data being sent
   - `API Response: {...}` - Should show server response
   - Any red error messages

### Step 2: Check Network Tab
1. Open DevTools (Press F12)
2. Go to **Network** tab
3. Submit the form
4. Look for `/api/newsletter/subscribe` request
5. Click on it to see:
   - **Status Code**: Should be 201 (success) or see error code
   - **Response**: Click to see detailed error message
   - **Request Payload**: Verify data is correct

### Step 3: Check Server Console/Logs
Look for error messages in your server terminal or PM2 logs:

```powershell
# If using PM2
pm2 logs

# If running Node directly
# Check the terminal where server is running
```

## Common Issues & Solutions

### Issue 1: CORS Error
**Error in Console:** 
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solution:**
Check `server.js` CORS configuration. The `ALLOWED_ORIGINS` should include your domain.

### Issue 2: MongoDB Not Connected
**Error in Server Logs:**
```
MongooseError: ...
```

**Solution:**
1. Check if MongoDB is running: `mongod --version`
2. Verify `MONGODB_URI` in `.env` file
3. Restart server

### Issue 3: Email Configuration Error
**Error in Server Logs:**
```
❌ Error sending notification email to support: ...
```

**Solution:**
This shouldn't prevent subscription, but check:
1. `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` in `.env`
2. AWS SES credentials are valid

### Issue 4: Validation Error
**Server Response:**
```json
{
  "success": false,
  "message": "Either email or mobile number is required"
}
```

**Solution:**
Check the payload being sent. Both `email` and `mobile` might be null.

### Issue 5: Duplicate Subscription
**Server Response:**
```json
{
  "success": false,
  "message": "You are already subscribed to our newsletter"
}
```

**Solution:**
This means the email is already in the database. This is expected behavior.

### Issue 6: 404 Not Found
**Status Code:** 404

**Possible Causes:**
1. Server route not registered
2. Server not running
3. Wrong API URL

**Solution:**
1. Verify server is running: `pm2 status` or check console
2. Check `server.js` has: `app.use('/api/newsletter', newsletterRoutes);`
3. Restart server

### Issue 7: 500 Internal Server Error
**Status Code:** 500

**Causes:**
1. Database connection issue
2. Missing required model fields
3. Code error in controller

**Solution:**
Check server logs for detailed error stack trace.

## Testing Commands

### Test API Directly with cURL
```powershell
# Test newsletter subscription
curl -X POST http://localhost:3000/api/newsletter/subscribe `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","source":"website"}'
```

### Test with PowerShell
```powershell
$body = @{
    email = "test@example.com"
    source = "website"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/newsletter/subscribe" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

## Debug Mode

### Enable Detailed Logging in Frontend
The updated `main.js` now includes:
- `console.log('Newsletter Subscription:', subscriptionData)` - Shows data being sent
- `console.log('API Response:', data)` - Shows server response
- `console.error('Subscription error:', errorMessage, data)` - Shows errors

### Steps to Debug:
1. **Clear cache** (Ctrl + Shift + R)
2. **Open DevTools** (F12)
3. **Go to Console tab**
4. **Submit newsletter form**
5. **Read the logs** - They will show exactly what's happening

## What to Share for Help

If the issue persists, please share:

1. **Browser Console logs** (from DevTools Console tab)
2. **Network response** (from DevTools Network tab)
3. **Server logs** (from terminal or PM2 logs)
4. **Environment details**:
   - Is MongoDB running?
   - Is server running?
   - What's in the `.env` file (without passwords)?

## Expected Flow

### Successful Subscription:

**Browser Console:**
```
Newsletter Subscription: {email: "test@example.com", mobile: null, source: "website", ...}
API Response: {success: true, message: "Subscription successful! Please check your email..."}
```

**Network Tab:**
- Status: 201 Created
- Response: Success message

**Server Console:**
```
✅ Email sent successfully: <message-id>
✅ Support notification email sent successfully to: support@cixio.com
```

**Emails:**
1. User receives: "Verify Your Newsletter Subscription"
2. Support receives: "New Newsletter Subscription"

---

## Quick Fix Checklist

- [ ] Server is running
- [ ] MongoDB is connected
- [ ] Browser cache cleared (Ctrl + Shift + R)
- [ ] DevTools Console open to see logs
- [ ] DevTools Network tab open to see requests
- [ ] Check for red errors in console
- [ ] Check server terminal for errors
- [ ] Verify `.env` file has correct settings

---

**Last Updated:** February 5, 2026  
**File Modified:** `public/js/main.js` - Added better error logging
