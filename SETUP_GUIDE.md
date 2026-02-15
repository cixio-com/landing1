# CIXIO.COM - Complete Setup & Deployment Guide

## 🎯 Project Overview

**CIXIO.COM** is a full-stack web application with user authentication, email verification, subscription management, and more.

### Architecture
- **Frontend**: React/HTML serving from Express
- **Backend**: Node.js + Express API
- **Database**: MongoDB 7.0 Replica Set (3 nodes)
- **Email**: AWS SES SMTP (Mumbai region)
- **Deployment**: Docker containers on AWS EC2

### Servers
| Server | IP | Role | Port |
|--------|-----|------|------|
| MongoDB | 172.31.33.96 | Database (3-node RS) | 27017, 27018, 27019 |
| Stage | 172.31.45.88 | Testing environment | 5001→80 |
| Production | 172.31.36.168 | Live environment | 5001→80 |
| Build | 172.31.38.202 | CI/CD & deployment | - |

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Development](#development)
4. [Deployment](#deployment)
5. [MongoDB Operations](#mongodb-operations)
6. [Troubleshooting](#troubleshooting)
7. [API Documentation](#api-documentation)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MongoDB Compass (optional, for local dev)
- SSH access to servers

### Clone Repository
```bash
git clone <repository-url>
cd landing1
```

### Setup Environment
```bash
# Copy template
cp .env.example .env

# Edit with your values
nano .env

# Install dependencies
npm install
```

### Run Locally
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Access Application
- Local: http://localhost:3000
- Stage: https://www.cixio.com (port 5001→80)
- Production: https://www.cixio.com (port 5001→80)

---

## ⚙️ Environment Setup

### 1. Create Environment Files

#### Development (.env)
```bash
cp .env.example .env
```

Edit `.env` with local development settings:
- `NODE_ENV=development`
- `PORT=3000`
- `MONGODB_URI=mongodb://localhost:27017/cixio_dev`

#### Stage (.env.stage) - **Already configured with actual values**
```bash
NODE_ENV=staging
PORT=80
MONGODB_URI=mongodb://cixio_com_user:PASSWORD@172.31.33.96:27017,172.31.33.96:27018,172.31.33.96:27019/cixio?replicaSet=rs0&authSource=cixio
```

#### Production (.env.production) - **Already configured with actual values**
```bash
NODE_ENV=production
PORT=80
MONGODB_URI=mongodb://cixio_com_user:PASSWORD@172.31.33.96:27017,172.31.33.96:27018,172.31.33.96:27019/cixio?replicaSet=rs0&authSource=cixio
```

### 2. Configure SSH Access

Edit `~/.ssh/config`:
```
Host cixio-stage-server
    HostName 172.31.45.88
    User ec2-user
    IdentityFile ~/.ssh/your-key.pem

Host cixio-production-server
    HostName 172.31.36.168
    User ec2-user
    IdentityFile ~/.ssh/your-key.pem

Host cixio-mongodb-server
    HostName 172.31.33.96
    User ec2-user
    IdentityFile ~/.ssh/your-key.pem
```

### 3. Generate Secrets (if needed)

#### JWT Secret (128 characters)
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### MongoDB Password (64 characters)
```bash
openssl rand -hex 32
```

---

## 💻 Development

### Project Structure
```
landing1/
├── src/
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic
│   ├── models/          # Database models
│   ├── utils/           # Helper functions
│   └── emails/          # Email templates
├── public/              # Static files
├── uploads/             # User uploads
├── .env                 # Local config (gitignored)
├── .env.stage           # Stage config (gitignored)
├── .env.production      # Production config (gitignored)
├── .env.example         # Template (tracked in git)
├── docker-compose.yml   # Universal Docker config
├── Dockerfile           # App container
├── package.json         # Dependencies
└── server.js            # Entry point
```

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Production mode
npm start

# Run tests
npm test

# Lint code
npm run lint

# Build Docker image
npm run build
```

### Add New Features

1. **Create Route**: `src/routes/feature.routes.js`
2. **Create Controller**: `src/controllers/feature.controller.js`
3. **Create Model**: `src/models/Feature.js`
4. **Register Route**: In `server.js`

### Email Templates

Templates in `src/emails/`:
- `welcome.html` - New user welcome
- `email-verification.html` - Email verification link
- `password-reset.html` - Password reset link
- `contact-acknowledgment.html` - Contact form reply

---

## 🚢 Deployment

### Stage Deployment

```bash
# From build server (172.31.38.202)
cd /path/to/landing1

# Deploy to Stage
./deploy-stage.sh
```

**What it does:**
1. Resets git repository
2. Pulls latest code
3. Builds Docker image
4. Exports as tar file
5. Copies `.env.stage` (with actual values)
6. Copies `docker-compose.yml`
7. Transfers to Stage server via SCP
8. Loads Docker image
9. Starts containers
10. Shows logs

### Production Deployment

```bash
# From build server
./deploy-production.sh
```

Same process as Stage, but uses `.env.production` and deploys to Production server.

### Manual Deployment

If scripts don't work:

```bash
# 1. Build image
docker build -t cixio-com-app:latest .

# 2. Export image
docker save -o cixio-com-app.tar cixio-com-app:latest

# 3. Copy to server
scp cixio-com-app.tar cixio-stage-server:/home/ec2-user/

# 4. On server: Load image
ssh cixio-stage-server
docker load -i cixio-com-app.tar

# 5. Start containers
docker-compose up -d

# 6. Check logs
docker logs -f cixio-com-app
```

### Verify Deployment

```bash
# SSH to server
ssh cixio-stage-server

# Check containers
docker ps

# Check logs
docker logs cixio-com-app

# Test health endpoint
curl http://localhost:5001/api/health
```

Expected log output:
```
============================================================
🚀 CIXIO API Server Started Successfully
============================================================
   Environment: staging
   Port: 80
   URL: http://localhost:80
   API Base: http://localhost:80/api
   Health Check: http://localhost:80/api/health
============================================================

✅ Connected to MongoDB successfully
   Database: cixio
✅ SMTP connection verified successfully
📧 Email service ready: email-smtp.ap-south-1.amazonaws.com:587
📤 Sending from: Cixio Team <noreply@cixio.com>
```

---

## 🗄️ MongoDB Operations

### Connect to MongoDB

```bash
# From MongoDB server
ssh cixio-mongodb-server

# Connect via mongosh
docker exec -it cixio-mongo1 mongosh "mongodb://cixio_com_user:PASSWORD@172.31.33.96:27017,172.31.33.96:27018,172.31.33.96:27019/cixio?replicaSet=rs0&authSource=cixio"
```

### Get Password
```bash
ssh cixio-mongodb-server "grep ^CIXIO_COM_DB_PASSWORD= /home/ec2-user/cixio-database/mvp_10_cixio-database/.env | cut -d= -f2"
```

### Common Commands

```javascript
// Show databases
show dbs

// Use cixio database
use cixio

// Show collections
show collections

// View all users
db.users.find().pretty()

// Count users
db.users.countDocuments()

// Create test user
db.users.insertOne({
  firstName: "Test",
  lastName: "User",
  email: "test@cixio.com",
  password: "$2b$10$hashedpassword",
  isEmailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Find user by email
db.users.findOne({ email: "test@cixio.com" })

// Update user
db.users.updateOne(
  { email: "test@cixio.com" },
  { $set: { isEmailVerified: true } }
)

// Delete user
db.users.deleteOne({ email: "test@cixio.com" })

// Exit
exit
```

**Full MongoDB commands**: See [MONGODB_COMMANDS.md](../CIXIO-DATABASE/mvp_10_cixio-database/MONGODB_COMMANDS.md)

### Understanding Replica Set Operations

**How Your MongoDB Replica Set Works:**

```
Your Application
      ↓
   Connection String (lists all 3 nodes)
      ↓
MongoDB Driver (automatically routes traffic)
      ↓
├─ WRITES → PRIMARY (mongo1)
│             ↓
│       [Automatic Replication]
│             ↓
│       ├→ SECONDARY (mongo2)
│       └→ SECONDARY (mongo3)
│
└─ READS → PRIMARY (default)
           or SECONDARY (if configured)
```

**Key Points:**
- ✅ **All writes go to PRIMARY only** - MongoDB routes automatically
- ✅ **Replication is automatic** - no manual steps needed
- ✅ **Failover is automatic** - if PRIMARY fails, new PRIMARY elected in 10-30 seconds
- ✅ **Your app doesn't change** - just use one connection string

**Example: User Registration Flow**
```javascript
// 1. User submits registration
POST /api/auth/register { email: "john@example.com" }

// 2. Your app writes to MongoDB
await user.save()

// 3. MongoDB automatically:
//    a. Routes write to PRIMARY (mongo1)
//    b. mongo1 writes data and returns success
//    c. mongo1 logs operation to oplog
//    d. mongo2 & mongo3 pull oplog and replicate data

// Result: All 3 nodes have identical data! ✅
```

**Read Preferences:**
- `primary` (default) - Read from PRIMARY only (current setup)
- `secondaryPreferred` - Read from SECONDARY when possible
- `nearest` - Read from lowest latency node

To change read preference, add to connection string:
```
MONGODB_URI=mongodb://...?replicaSet=rs0&readPreference=secondaryPreferred
```

**Check Replica Set Status:**
```bash
# Which node is PRIMARY?
docker exec -it cixio-mongo1 mongosh -u cixio_root_admin -p PASSWORD --eval "
  rs.status().members.forEach(m => print(m.name + ' - ' + m.stateStr))
"

# Expected output:
# 172.31.33.96:27017 - PRIMARY
# 172.31.33.96:27018 - SECONDARY
# 172.31.33.96:27019 - SECONDARY
```

**Connect to Individual Nodes:**
```bash
# Root admin password: fbe885abf81eb6491d4b6f3c5fc5d9bdbdbbba28cc3e6da9ddc91f7d7b1fcbc1

# mongo1 (PRIMARY)
docker exec -it cixio-mongo1 mongosh -u cixio_root_admin -p PASSWORD

# mongo2 (SECONDARY)
docker exec -it cixio-mongo2 mongosh -u cixio_root_admin -p PASSWORD

# mongo3 (SECONDARY)
docker exec -it cixio-mongo3 mongosh -u cixio_root_admin -p PASSWORD
```

**For detailed replica set documentation**, see [MONGODB_COMMANDS.md - Replica Set Architecture](../CIXIO-DATABASE/mvp_10_cixio-database/MONGODB_COMMANDS.md#replica-set-architecture--operations)

---

## 🔧 Troubleshooting

### Application Won't Start

**Check logs:**
```bash
docker logs cixio-com-app
```

**Common issues:**
- MongoDB connection failed → Check MONGODB_URI in `.env`
- Port already in use → Check `docker ps`, stop conflicting container
- Email not configured → Check EMAIL_* variables

### MongoDB Connection Failed

**Check MongoDB is running:**
```bash
ssh cixio-mongodb-server
docker ps | grep mongo
```

**Check replica set status:**
```bash
docker exec -it cixio-mongo1 mongosh --eval "rs.status()"
```

**Restart MongoDB:**
```bash
cd /home/ec2-user/cixio-database/mvp_10_cixio-database
docker-compose restart
```

### Email Not Sending

**Verify SMTP settings:**
```bash
# Check .env has correct values
grep EMAIL_ .env

# Test email from app
curl -X POST http://localhost:5001/api/test-email/send \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com"}'
```

**Check AWS SES:**
- Verify sender email in AWS Console
- Check if still in sandbox mode
- Verify SMTP credentials

### Docker Issues

**Container keeps restarting:**
```bash
docker logs cixio-com-app --tail 100

# Check health status
docker inspect cixio-com-app | grep Health -A 10
```

**Out of disk space:**
```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -af
```

### Deployment Failed

**Check SSH access:**
```bash
ssh cixio-stage-server "echo 'SSH OK'"
```

**Check deploy script logs:**
```bash
# Deployment creates timestamped directories
ssh cixio-stage-server "ls -lt /home/ec2-user/cixio.com/landing1/"
```

**Manual cleanup:**
```bash
# Remove old deployments (keep last 3)
ssh cixio-stage-server "cd /home/ec2-user/cixio.com/landing1 && ls -t | tail -n +4 | xargs rm -rf"
```

---

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:3000/api`
- **Stage**: `https://www.cixio.com/api` (via port 5001)
- **Production**: `https://www.cixio.com/api` (via port 5001)

### Health Check
```bash
GET /api/health

Response:
{
  "status": "ok",
  "timestamp": "2026-02-15T10:00:00.000Z",
  "mongodb": "connected",
  "uptime": 3600
}
```

### Authentication

#### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 201
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "...",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 200
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isEmailVerified": true
  }
}
```

#### Verify Email
```bash
GET /api/auth/verify-email/:token

Response: 200
{
  "success": true,
  "message": "Email verified successfully. You can now log in."
}
```

### Contact Form
```bash
POST /api/contact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question about services",
  "message": "I would like to know more about..."
}

Response: 200
{
  "success": true,
  "message": "Thank you for contacting us. We will get back to you soon."
}
```

### Newsletter
```bash
POST /api/newsletter/subscribe
Content-Type: application/json

{
  "email": "john@example.com"
}

Response: 200
{
  "success": true,
  "message": "Subscription successful. Please check your email to confirm."
}
```

---

## 🔐 Security Notes

### Secrets Management
- ✅ All secrets in `.env` files (gitignored)
- ✅ Only `.env.example` tracked in git (dummy values)
- ✅ Passwords are hex-encoded (URL-safe)
- ✅ JWT secrets are 128 characters

### MongoDB Security
- ✅ Authentication enabled
- ✅ Separate user for each app (`cixio_com_user`)
- ✅ Keyfile for replica set communication
- ✅ Network isolation (VPC)

### Application Security
- Rate limiting enabled
- CORS configured
- Helmet security headers
- Password hashing (bcrypt)
- JWT token expiration (7 days)
- Email verification required

---

## 📊 Monitoring

### Check Application Status
```bash
# Container status
docker ps

# Resource usage
docker stats cixio-com-app

# Logs (last 100 lines)
docker logs --tail 100 cixio-com-app

# Follow logs
docker logs -f cixio-com-app
```

### Check MongoDB Status
```bash
ssh cixio-mongodb-server

# Container health
docker ps

# Replica set status
docker exec -it cixio-mongo1 mongosh --eval "rs.status()"

# Database stats
docker exec -it cixio-mongo1 mongosh mongodb://cixio_com_user:PASSWORD@localhost:27017/cixio?authSource=cixio --eval "db.stats()"
```

---

## 🎓 Next Steps

1. **Test Registration Flow**
   - Register new user
   - Check email verification
   - Verify email link works
   - Login with verified account

2. **Test Contact Form**
   - Submit contact form
   - Check admin notification email
   - Check user acknowledgment email

3. **Monitor Logs**
   - Watch application logs
   - Check for errors
   - Monitor MongoDB connections

4. **Performance Testing**
   - Load testing
   - Response time monitoring
   - Database query optimization

5. **Backup Setup**
   - Configure automated MongoDB backups
   - Test restore procedures
   - Document backup locations

---

## 📞 Support

### Quick Links
- MongoDB Commands: [MONGODB_COMMANDS.md](../CIXIO-DATABASE/mvp_10_cixio-database/MONGODB_COMMANDS.md)
- Docker Compose Guide: [DOCKER_COMPOSE_SIMPLIFICATION.md](./DOCKER_COMPOSE_SIMPLIFICATION.md)
- Deployment Changes: [DEPLOYMENT_CHANGES.md](./DEPLOYMENT_CHANGES.md)

### Server Access
```bash
# MongoDB Server
ssh cixio-mongodb-server

# Stage Server
ssh cixio-stage-server

# Production Server
ssh cixio-production-server
```

---

## ✅ Current Status

### ✅ MongoDB
- 3-node replica set running
- Authentication working
- `cixio_com_user` created
- Password: Available in MongoDB server `.env`

### ✅ Stage Application
- Container running (healthy)
- Environment: `staging`
- MongoDB connected
- SMTP verified
- Accessible on port 5001

### ✅ Configuration
- `.env.stage`: Complete with actual values
- `.env.production`: Complete with actual values
- `.env.example`: Template with dummy values
- `docker-compose.yml`: Universal config

---

**Last Updated:** February 15, 2026  
**Status:** ✅ Production Ready
