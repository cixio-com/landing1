# Deployment Setup Checklist

Use this checklist to ensure your deployment environment is properly configured.

---

## ☑️ Initial Setup (One-Time)

### 1. Environment Configuration
- [ ] Copy `.env.example` to `.env`
  ```bash
  cp .env.example .env
  ```
- [ ] Edit `.env` and configure deployment settings
- [ ] Set `DEPLOY_TARGET=stage` (or `production`)
- [ ] Verify stage server IP: `STAGE_SERVER_IP=172.31.45.88`
- [ ] Verify production server IP: `PRODUCTION_SERVER_IP=172.31.36.168`
- [ ] Set correct SSH key path
- [ ] Configure all other required environment variables (JWT_SECRET, MongoDB, Email, etc.)

### 2. SSH Configuration
- [ ] SSH key exists at `~/.ssh/id_ed25519`
  ```bash
  ls -la ~/.ssh/id_ed25519
  ```
- [ ] SSH key has correct permissions
  ```bash
  chmod 600 ~/.ssh/id_ed25519
  ```
- [ ] SSH key copied to STAGE server
  ```bash
  ssh-copy-id -i ~/.ssh/id_ed25519 ec2-user@172.31.45.88
  ```
- [ ] SSH key copied to PRODUCTION server
  ```bash
  ssh-copy-id -i ~/.ssh/id_ed25519 ec2-user@172.31.36.168
  ```
- [ ] Test SSH connection to STAGE
  ```bash
  ssh -i ~/.ssh/id_ed25519 ec2-user@172.31.45.88 "echo 'Stage OK'"
  ```
- [ ] Test SSH connection to PRODUCTION
  ```bash
  ssh -i ~/.ssh/id_ed25519 ec2-user@172.31.36.168 "echo 'Production OK'"
  ```

### 3. Script Permissions
- [ ] Make deployment scripts executable
  ```bash
  chmod +x deploy-to-stage.sh
  chmod +x deploy-stage.sh
  chmod +x deploy-production.sh
  chmod +x build-and-export-images.sh
  chmod +x deploy-on-stage.sh
  ```

### 4. Git Configuration
- [ ] Git repository is up to date
  ```bash
  git fetch
  git pull
  ```
- [ ] `.env` file is in `.gitignore` (should already be)
  ```bash
  grep "^\.env$" .gitignore
  ```

---

## ☑️ Pre-Deployment Checklist

### Before Each Deployment

- [ ] Code changes committed to git
- [ ] `.env` file is properly configured
- [ ] `DEPLOY_TARGET` is set correctly (stage or production)
- [ ] Docker is running on jump server
  ```bash
  docker --version
  docker ps
  ```
- [ ] Sufficient disk space on jump server
  ```bash
  df -h
  ```
- [ ] Sufficient disk space on target server
  ```bash
  ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP "df -h"
  ```

### For STAGE Deployment
- [ ] `DEPLOY_TARGET=stage` in `.env` (or using `deploy-stage.sh`)
- [ ] Stage server is accessible
- [ ] Testing plan is ready

### For PRODUCTION Deployment
- [ ] Tested successfully in STAGE environment
- [ ] `DEPLOY_TARGET=production` in `.env` (or using `deploy-production.sh`)
- [ ] Production server is accessible
- [ ] Backup plan is ready
- [ ] Rollback plan is documented
- [ ] Stakeholders are notified
- [ ] Maintenance window scheduled (if needed)

---

## ☑️ Deployment Process

### 1. Run Deployment Script
- [ ] Navigate to project directory
  ```bash
  cd /home/ec2-user/cixio.com/landing1
  ```
- [ ] Run appropriate deployment script:
  - **Stage**: `./deploy-stage.sh`
  - **Production**: `./deploy-production.sh`
- [ ] Monitor script output for errors
- [ ] Note the deployment timestamp directory

### 2. Complete Deployment on Target Server
- [ ] Copy the one-line command from script output
- [ ] Run the command to deploy on target server
  ```bash
  ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP 'cd /path/to/deployment && ./deploy-on-stage.sh'
  ```
- [ ] Monitor deployment logs for errors

### 3. Verify Deployment
- [ ] Check Docker containers are running
  ```bash
  ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP "docker ps"
  ```
- [ ] Verify app container is healthy
  ```bash
  ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP "docker ps | grep cixio-com-app"
  ```
- [ ] Verify MongoDB container is healthy
  ```bash
  ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP "docker ps | grep cixio-com-mongodb"
  ```

---

## ☑️ Post-Deployment Verification

### API Health Check
- [ ] Test health endpoint from external
  ```bash
  # Stage
  curl http://172.31.45.88:5001/api/health
  
  # Production
  curl http://172.31.36.168:5001/api/health
  ```
- [ ] Expected response: `{"status":"ok","message":"CIXIO API is running"}`

### Container Logs
- [ ] Check app logs for errors
  ```bash
  ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP "docker logs cixio-com-app | tail -50"
  ```
- [ ] Check MongoDB logs for errors
  ```bash
  ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP "docker logs cixio-com-mongodb | tail -50"
  ```

### Database Connection
- [ ] Verify MongoDB connection is working
- [ ] Check that database has correct data

### Email Configuration
- [ ] Test email sending functionality (if applicable)
- [ ] Verify email templates are loading correctly

### API Endpoints
- [ ] Test registration endpoint
- [ ] Test login endpoint
- [ ] Test authenticated endpoints
- [ ] Test newsletter subscription

---

## ☑️ Rollback Procedure (If Needed)

If deployment fails or issues are found:

- [ ] SSH to target server
  ```bash
  ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP
  ```
- [ ] Navigate to base directory
  ```bash
  cd /home/ec2-user/cixio.com/landing1
  ```
- [ ] List previous deployments
  ```bash
  ls -lt
  ```
- [ ] Navigate to previous deployment
  ```bash
  cd PREVIOUS_TIMESTAMP/docker-images-export
  ```
- [ ] Run deployment
  ```bash
  ./deploy-on-stage.sh
  ```
- [ ] Verify rollback was successful

---

## ☑️ Troubleshooting

### Common Issues

#### Cannot connect to server
- [ ] Verify SSH key path is correct
- [ ] Check SSH key permissions (should be 600)
- [ ] Verify server IP address is correct
- [ ] Check if server is running
- [ ] Verify security group allows SSH

#### Docker images not building
- [ ] Check Docker is running
- [ ] Verify Dockerfile exists
- [ ] Check for sufficient disk space
- [ ] Review build logs for errors

#### Deployment script fails
- [ ] Check `.env` file exists
- [ ] Verify `DEPLOY_TARGET` is set correctly
- [ ] Check all required files exist
- [ ] Review script output for specific errors

#### Containers not starting
- [ ] Check Docker logs for errors
- [ ] Verify `.env` file is present in deployment directory
- [ ] Check port conflicts
- [ ] Verify MongoDB credentials

---

## 📝 Deployment Log Template

Use this template to document each deployment:

```
Date: _______________
Time: _______________
Target: [ ] Stage  [ ] Production
Deployed By: _______________
Deployment Directory: _______________
Git Commit: _______________

Pre-Deployment:
- Code changes: _______________
- Tests passed: [ ] Yes [ ] No
- Backup taken: [ ] Yes [ ] No

Deployment:
- Script used: _______________
- Start time: _______________
- End time: _______________
- Issues encountered: _______________

Verification:
- Health check: [ ] Pass [ ] Fail
- API tests: [ ] Pass [ ] Fail
- Database connection: [ ] Pass [ ] Fail
- Logs reviewed: [ ] Yes [ ] No

Post-Deployment:
- Stakeholders notified: [ ] Yes [ ] No
- Documentation updated: [ ] Yes [ ] No
- Monitoring active: [ ] Yes [ ] No

Notes:
_______________________________________________
_______________________________________________
_______________________________________________
```

---

## 🔍 Quick Command Reference

```bash
# Deploy to Stage
./deploy-stage.sh

# Deploy to Production
./deploy-production.sh

# Check .env configuration
grep DEPLOY_TARGET .env

# Test SSH
ssh -i ~/.ssh/id_ed25519 ec2-user@172.31.45.88 "echo OK"  # Stage
ssh -i ~/.ssh/id_ed25519 ec2-user@172.31.36.168 "echo OK" # Production

# Check Docker status on server
ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP "docker ps"

# View app logs
ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP "docker logs -f cixio-com-app"

# Test API
curl http://SERVER_IP:5001/api/health
```

---

## 📚 Documentation References

- `QUICK_DEPLOY.md` - Quick deployment guide
- `DEPLOYMENT_SERVERS.md` - Comprehensive deployment documentation
- `PORT_CONFIGURATION.md` - Port configuration details
- `DEPLOYMENT_UPDATE_SUMMARY.md` - Summary of deployment changes
- `DEPLOYMENT.md` - General deployment guide

---

**Tip**: Print this checklist and check off items as you complete them for each deployment!
