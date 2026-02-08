# Quick Deployment Guide

## 🚀 Fast Deployment Commands

### Deploy to STAGE Server
```bash
# Method 1: Using convenience script (Easiest)
./deploy-stage.sh

# Method 2: Using environment variable
DEPLOY_TARGET=stage ./deploy-to-stage.sh

# Method 3: Edit .env file and set DEPLOY_TARGET=stage, then:
./deploy-to-stage.sh
```

### Deploy to PRODUCTION Server
```bash
# Method 1: Using convenience script (Easiest, includes safety delay)
./deploy-production.sh

# Method 2: Using environment variable
DEPLOY_TARGET=production ./deploy-to-stage.sh

# Method 3: Edit .env file and set DEPLOY_TARGET=production, then:
./deploy-to-stage.sh
```

---

## 📋 Setup (First Time Only)

1. **Make scripts executable:**
```bash
chmod +x deploy-to-stage.sh
chmod +x deploy-stage.sh
chmod +x deploy-production.sh
chmod +x build-and-export-images.sh
```

2. **Configure .env file:**
```bash
# Copy example file if not exists
cp .env.example .env

# Edit .env and set ALL REQUIRED deployment variables:
# (No defaults - you must configure all of these)

DEPLOY_TARGET=stage  # or 'production'

# Stage Server (REQUIRED)
STAGE_SERVER_USER=ec2-user
STAGE_SERVER_IP=172.31.45.88
STAGE_SERVER_SSH_KEY=~/.ssh/id_ed25519
STAGE_SERVER_BASE_DIR=/home/ec2-user/cixio.com/landing1

# Production Server (REQUIRED)
PRODUCTION_SERVER_USER=ec2-user
PRODUCTION_SERVER_IP=172.31.36.168
PRODUCTION_SERVER_SSH_KEY=~/.ssh/id_ed25519
PRODUCTION_SERVER_BASE_DIR=/home/ec2-user/cixio.com/landing1
```

**Important:** All deployment variables are REQUIRED. The script will fail with a helpful error message if any are missing.

3. **Verify SSH access:**
```bash
# Test Stage
ssh -i ~/.ssh/id_ed25519 ec2-user@172.31.45.88 "echo 'Stage OK'"

# Test Production
ssh -i ~/.ssh/id_ed25519 ec2-user@172.31.36.168 "echo 'Production OK'"
```

---

## 🎯 Complete Workflow

### For STAGE Deployment:

```bash
# On Jump Server
cd /home/ec2-user/cixio.com/landing1

# 1. Deploy to stage
./deploy-stage.sh

# The script will output a one-line command like:
# ssh -i ~/.ssh/id_ed25519 ec2-user@172.31.45.88 'cd /home/ec2-user/cixio.com/landing1/2026-02-08_10-30-45/docker-images-export && chmod +x deploy-on-stage.sh && ./deploy-on-stage.sh'

# 2. Copy and run that command to complete deployment
```

### For PRODUCTION Deployment:

```bash
# On Jump Server
cd /home/ec2-user/cixio.com/landing1

# 1. Deploy to production (includes 5-second safety delay)
./deploy-production.sh

# The script will output a one-line command like:
# ssh -i ~/.ssh/id_ed25519 ec2-user@172.31.36.168 'cd /home/ec2-user/cixio.com/landing1/2026-02-08_10-30-45/docker-images-export && chmod +x deploy-on-stage.sh && ./deploy-on-stage.sh'

# 2. Copy and run that command to complete deployment
```

---

## ✅ Verification

```bash
# Test Stage API
curl http://172.31.45.88:5001/api/health

# Test Production API
curl http://172.31.36.168:5001/api/health

# Expected response:
# {"status":"ok","message":"CIXIO API is running"}
```

---

## 📊 Server Information

| Environment | IP Address | Port | Access |
|------------|------------|------|--------|
| **Stage** | 172.31.45.88 | 5001 | http://172.31.45.88:5001 |
| **Production** | 172.31.36.168 | 5001 | http://172.31.36.168:5001 |

---

## 🔧 Troubleshooting

### Script not executable
```bash
chmod +x deploy-stage.sh deploy-production.sh deploy-to-stage.sh
```

### Cannot connect to server
```bash
# Check SSH key permissions
chmod 600 ~/.ssh/id_ed25519

# Test connectivity
ssh -i ~/.ssh/id_ed25519 ec2-user@172.31.45.88 "echo OK"
```

### Wrong server targeted
```bash
# Check current .env setting
grep DEPLOY_TARGET .env

# Override with environment variable
DEPLOY_TARGET=stage ./deploy-to-stage.sh
```

---

## 🔄 Rollback

If deployment fails, rollback to previous version:

```bash
# SSH to server
ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP

# List deployments
cd /home/ec2-user/cixio.com/landing1
ls -lt

# Go to previous version
cd PREVIOUS_TIMESTAMP/docker-images-export

# Deploy
./deploy-on-stage.sh
```

---

## 📚 Additional Resources

- **Full Documentation**: See `DEPLOYMENT_SERVERS.md`
- **Port Configuration**: See `PORT_CONFIGURATION.md`
- **General Deployment**: See `DEPLOYMENT.md`
- **Development Setup**: See `DEVELOPMENT.md`

---

**Quick Help:**
```bash
# Show this guide
cat QUICK_DEPLOY.md

# Check deployment status
docker ps

# View logs
docker logs -f cixio-com-app
```
