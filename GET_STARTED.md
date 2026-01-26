# GET STARTED - CIXIO Full-Stack Application

Complete installation and setup guide for the CIXIO application.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Database Setup](#database-setup)
5. [Email Configuration](#email-configuration)
6. [Running the Application](#running-the-application)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher)
- **MongoDB** (v4.4 or higher)
- **Git** (for version control)

### Check Your Versions

```bash
node --version   # Should be >= v14.0.0
npm --version    # Should be >= v6.0.0
mongod --version # Should be >= v4.4
```

### Installation Links

- Node.js: https://nodejs.org/
- MongoDB: https://www.mongodb.com/try/download/community
- Git: https://git-scm.com/downloads

---

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/admin-cixio/landing1.git
cd landing1
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **nodemailer** - Email service
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting
- **dotenv** - Environment variables
- **validator** - Input validation

---

## Configuration

### Step 1: Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### Step 2: Edit Configuration

Open `.env` file and configure the following:

```bash
nano .env
# or
code .env
# or
vim .env
```

### Step 3: Required Configuration

#### Server Settings

```env
NODE_ENV=development        # or 'production'
PORT=3000                   # Server port
```

#### Database Configuration

Choose one of the following:

**Option 1: Local MongoDB**
```env
MONGODB_URI=mongodb://localhost:27017/cixio
```

**Option 2: MongoDB Atlas (Cloud)**
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cixio?retryWrites=true&w=majority
```

**Option 3: Docker**
```env
MONGODB_URI=mongodb://mongo:27017/cixio
```

#### Security Configuration (CRITICAL!)

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add to `.env`:

```env
JWT_SECRET=<paste-generated-secret-here>
JWT_EXPIRE=7d
```

#### Email Configuration for www.cixio.com

```env
# SMTP Settings
EMAIL_HOST=mail.cixio.com
EMAIL_PORT=587
EMAIL_USER=noreply@cixio.com
EMAIL_PASS=your-secure-email-password

# Sender Information
EMAIL_FROM=CIXIO <noreply@cixio.com>
EMAIL_FROM_NAME=CIXIO
EMAIL_FROM_ADDRESS=noreply@cixio.com

# Support Emails
SUPPORT_EMAIL=support@cixio.com
INFO_EMAIL=info@cixio.com
```

#### Frontend URL Configuration

```env
# Development
FRONTEND_URL=http://localhost:8000
API_URL=http://localhost:3000/api

# Production
FRONTEND_URL=https://www.cixio.com
API_URL=https://www.cixio.com/api
```

#### CORS Configuration

```env
ALLOWED_ORIGINS=https://www.cixio.com,https://cixio.com,http://localhost:8000,http://localhost:3000
```

---

## Database Setup

### Option 1: Local MongoDB

#### Install MongoDB

**macOS (Homebrew)**
```bash
brew tap mongodb/brew
brew install mongodb-community
```

**Ubuntu/Debian**
```bash
sudo apt-get install mongodb
```

**Windows**
Download from: https://www.mongodb.com/try/download/community

#### Start MongoDB

**macOS**
```bash
brew services start mongodb-community
```

**Linux**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Windows**
```bash
net start MongoDB
```

#### Verify MongoDB is Running

```bash
mongo --eval "db.version()"
```

### Option 2: MongoDB Atlas (Cloud)

1. **Create Account**: Visit https://www.mongodb.com/cloud/atlas
2. **Create Cluster**: Follow the setup wizard
3. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Add to `.env` as `MONGODB_URI`

4. **Whitelist IP**: Add your IP address or use `0.0.0.0/0` (development only)

### Create Database User (Local MongoDB)

```bash
mongo
```

```javascript
use admin
db.createUser({
  user: "cixio_admin",
  pwd: "secure_password",
  roles: [ { role: "readWrite", db: "cixio" } ]
})
```

Update `.env`:
```env
MONGODB_URI=mongodb://cixio_admin:secure_password@localhost:27017/cixio
```

---

## Email Configuration

### Setting Up Email for www.cixio.com Domain

#### Option 1: cPanel Email Account

1. **Create Email Account**:
   - Login to your cPanel
   - Go to "Email Accounts"
   - Create: `noreply@cixio.com`
   - Set a strong password

2. **Get SMTP Settings**:
   - Host: `mail.cixio.com` (or check cPanel)
   - Port: `587` (TLS) or `465` (SSL)
   - Username: `noreply@cixio.com`
   - Password: Your email password

3. **Update .env**:
```env
EMAIL_HOST=mail.cixio.com
EMAIL_PORT=587
EMAIL_USER=noreply@cixio.com
EMAIL_PASS=your-email-password
```

#### Option 2: Gmail (Development Only)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account → Security
   - Select "App passwords"
   - Generate password for "Mail"

3. **Update .env**:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=generated-app-password
```

#### Option 3: SendGrid (Recommended for Production)

1. **Create Account**: https://sendgrid.com
2. **Generate API Key**:
   - Settings → API Keys → Create API Key
   - Full Access permissions

3. **Update .env**:
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

#### Option 4: AWS SES

```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-aws-smtp-username
EMAIL_PASS=your-aws-smtp-password
```

### Test Email Configuration

Create a test file `test-email.js`:

```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: 'your-test-email@example.com',
    subject: 'Test Email from CIXIO',
    text: 'If you receive this, email is configured correctly!'
}, (error, info) => {
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Email sent:', info.messageId);
    }
});
```

Run the test:
```bash
node test-email.js
```

---

## Running the Application

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Run Frontend and Backend Separately

**Terminal 1 - Backend API:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

### Access the Application

- **Frontend**: http://localhost:8000
- **API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health

### Expected Output

```
============================================================
🚀 CIXIO API Server Started Successfully
============================================================
   Environment: development
   Port: 3000
   URL: http://localhost:3000
   API Base: http://localhost:3000/api
   Health Check: http://localhost:3000/api/health
============================================================

✅ Connected to MongoDB successfully
   Database: cixio
```

---

## Testing

### Test 1: Health Check

```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "CIXIO API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

### Test 2: User Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "mobile": "1234567890"
  }'
```

### Test 3: User Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'
```

Save the `token` from the response for authenticated requests.

### Test 4: Get Profile (Authenticated)

```bash
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test 5: Subscribe to Newsletter

```bash
curl -X POST http://localhost:3000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscriber@example.com"
  }'
```

### Test 6: Submit Contact Form

```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "subject": "Inquiry",
    "message": "I would like to know more about your services."
  }'
```

---

## Troubleshooting

### Issue: Cannot Connect to MongoDB

**Symptoms:**
```
❌ MongoDB connection error: connect ECONNREFUSED
```

**Solutions:**

1. **Check if MongoDB is running:**
```bash
# macOS
brew services list | grep mongodb

# Linux
sudo systemctl status mongod

# Windows
net start | findstr MongoDB
```

2. **Start MongoDB:**
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

3. **Verify connection string** in `.env`

4. **Check MongoDB logs:**
```bash
# macOS
tail -f /usr/local/var/log/mongodb/mongo.log

# Linux
tail -f /var/log/mongodb/mongod.log
```

### Issue: Email Not Sending

**Symptoms:**
- Email verification not received
- Password reset email not delivered

**Solutions:**

1. **Test email configuration:**
```bash
node test-email.js
```

2. **Check credentials** in `.env`

3. **Verify SMTP settings:**
   - Correct host and port
   - Valid username and password
   - Firewall not blocking port 587/465

4. **Check spam folder**

5. **Enable "Less secure apps"** (Gmail only):
   - Account → Security → Less secure app access

6. **Check email service logs:**
```bash
# Check application logs for email errors
```

### Issue: Port Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

1. **Find process using port:**
```bash
# macOS/Linux
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

2. **Kill the process:**
```bash
# macOS/Linux
kill -9 <PID>

# Windows
taskkill /PID <PID> /F
```

3. **Use different port:**
```env
PORT=3001
```

### Issue: JWT Token Invalid

**Symptoms:**
```json
{"success": false, "message": "Invalid token"}
```

**Solutions:**

1. **Verify JWT_SECRET** is set in `.env`
2. **Check token expiration** (JWT_EXPIRE setting)
3. **Use fresh token** (login again)
4. **Verify token format**: `Bearer <token>`

### Issue: CORS Error

**Symptoms:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solutions:**

1. **Update ALLOWED_ORIGINS** in `.env`:
```env
ALLOWED_ORIGINS=http://localhost:8000,http://localhost:3000
```

2. **Restart the server** after changing `.env`

### Issue: Dependencies Won't Install

**Solutions:**

1. **Clear npm cache:**
```bash
npm cache clean --force
```

2. **Delete node_modules and reinstall:**
```bash
rm -rf node_modules package-lock.json
npm install
```

3. **Update npm:**
```bash
npm install -g npm@latest
```

4. **Check Node.js version:**
```bash
node --version  # Should be >= v14.0.0
```

### Issue: Database Connection Timeout (MongoDB Atlas)

**Solutions:**

1. **Whitelist IP address** in MongoDB Atlas
2. **Check internet connection**
3. **Verify connection string** format
4. **Check firewall settings**

### Get Help

If you continue to experience issues:

1. **Check logs** for detailed error messages
2. **Review documentation** files
3. **Contact support**: support@cixio.com
4. **GitHub Issues**: https://github.com/admin-cixio/landing1/issues

---

## Next Steps

✅ Application is running successfully!

Now you can:

1. **Explore API Endpoints**: See `QUICK_REFERENCE.md`
2. **Deploy to Production**: See `DEPLOYMENT.md`
3. **Learn Architecture**: See `DEVELOPMENT.md`
4. **Review Features**: See `SUMMARY.md`
5. **Verify Implementation**: See `IMPLEMENTATION_CHECKLIST.txt`

---

## Additional Resources

- **README.md** - Complete project documentation
- **QUICK_REFERENCE.md** - API endpoint reference
- **DEPLOYMENT.md** - Deployment guides
- **DEVELOPMENT.md** - Development guidelines
- **.env.example** - Configuration template

---

**Support**: support@cixio.com  
**Website**: https://www.cixio.com  
**Repository**: https://github.com/admin-cixio/landing1

© 2024 CIXIO. All rights reserved.
