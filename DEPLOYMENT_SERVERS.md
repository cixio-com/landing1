# Deployment Servers Configuration

## Overview

This document explains how to configure and deploy to different server environments (Stage and Production).

---

## Server Information

### Stage Server
- **IP Address**: `172.31.45.88`
- **User**: `ec2-user`
- **Path**: `/home/ec2-user/cixio.com/landing1`
- **Purpose**: Testing and staging environment

### Production Server
- **IP Address**: `172.31.36.168`
- **User**: `ec2-user`
- **Path**: `/home/ec2-user/cixio.com/landing1`
- **Purpose**: Live production environment

---

## Configuration

### Environment Variables (.env)

Add the following to your `.env` file. **All deployment variables are REQUIRED** - there are no default values.

```bash
# Deployment Configuration
DEPLOY_TARGET=stage  # or 'production'

# Stage Server Configuration (REQUIRED)
STAGE_SERVER_USER=ec2-user
STAGE_SERVER_IP=172.31.45.88
STAGE_SERVER_SSH_KEY=~/.ssh/id_ed25519
STAGE_SERVER_BASE_DIR=/home/ec2-user/cixio.com/landing1

# Production Server Configuration (REQUIRED)
PRODUCTION_SERVER_USER=ec2-user
PRODUCTION_SERVER_IP=172.31.36.168
PRODUCTION_SERVER_SSH_KEY=~/.ssh/id_ed25519
PRODUCTION_SERVER_BASE_DIR=/home/ec2-user/cixio.com/landing1

# Local Project Directory (Optional - defaults to current directory)
# LOCAL_PROJECT_DIR=/home/ec2-user/cixio.com/landing1
```

**Important Notes:**
- All server configuration variables are **REQUIRED**
- The script will fail with a clear error message if any are missing
- This ensures explicit configuration and prevents accidental deployments to wrong servers
- No hardcoded defaults exist in the deployment scripts

---

## Deployment Methods

### Method 1: Using Environment Variable (Recommended)

The `deploy-to-stage.sh` script now reads the `DEPLOY_TARGET` from your `.env` file.

#### Deploy to Stage:
```bash
# Set in .env file
DEPLOY_TARGET=stage

# Run deployment
./deploy-to-stage.sh
```

#### Deploy to Production:
```bash
# Set in .env file
DEPLOY_TARGET=production

# Run deployment
./deploy-to-stage.sh
```

### Method 2: Using Command Line Override

You can override the .env setting by exporting the variable before running the script:

#### Deploy to Stage:
```bash
DEPLOY_TARGET=stage ./deploy-to-stage.sh
```

#### Deploy to Production:
```bash
DEPLOY_TARGET=production ./deploy-to-stage.sh
```

### Method 3: Using Convenience Scripts

Use the provided wrapper scripts for quick deployment:

#### Deploy to Stage:
```bash
./deploy-stage.sh
```

#### Deploy to Production:
```bash
./deploy-production.sh
```

---

## Deployment Process

The deployment script performs these steps:

1. **Loads Configuration** from `.env` file
2. **Validates Target** (stage or production)
3. **Cleans Local Docker** environment
4. **Updates Code** from git repository
5. **Builds Docker Images** using `build-and-export-images.sh`
6. **Exports Images** to tar files
7. **Copies Required Files** (.env, docker-compose.yml, deploy-on-stage.sh)
8. **Checks Disk Space** on target server
9. **Cleans Old Deployments** (keeps last 3)
10. **Transfers Files** to target server
11. **Verifies Transfer** and displays next steps
12. **Cleans Up** local environment

---

## SSH Configuration

Ensure your SSH key is properly configured:

```bash
# Check if SSH key exists
ls -la ~/.ssh/id_ed25519

# If not, create one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy to servers
ssh-copy-id -i ~/.ssh/id_ed25519 ec2-user@172.31.45.88
ssh-copy-id -i ~/.ssh/id_ed25519 ec2-user@172.31.36.168
```

---

## Post-Deployment Steps

After the deployment script completes, you need to SSH to the target server and run the deployment:

### Option 1: Manual Steps

```bash
# SSH to the server
ssh -i ~/.ssh/id_ed25519 ec2-user@172.31.45.88  # Stage
# or
ssh -i ~/.ssh/id_ed25519 ec2-user@172.31.36.168  # Production

# Navigate to the deployment directory (use timestamp from script output)
cd /home/ec2-user/cixio.com/landing1/2026-02-08_10-30-45/docker-images-export

# Run the deployment
./deploy-on-stage.sh
```

### Option 2: One-Line Command

The deployment script provides a one-line command at the end. Example:

```bash
# Stage
ssh -i ~/.ssh/id_ed25519 ec2-user@172.31.45.88 'cd /home/ec2-user/cixio.com/landing1/2026-02-08_10-30-45/docker-images-export && chmod +x deploy-on-stage.sh && ./deploy-on-stage.sh'

# Production
ssh -i ~/.ssh/id_ed25519 ec2-user@172.31.36.168 'cd /home/ec2-user/cixio.com/landing1/2026-02-08_10-30-45/docker-images-export && chmod +x deploy-on-stage.sh && ./deploy-on-stage.sh'
```

---

## Verification

After deployment, verify the services are running:

### Check Docker Containers

```bash
# SSH to the server
ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP

# Check running containers
docker ps

# Check container logs
docker logs cixio-com-app
docker logs cixio-com-mongodb
```

### Test API Endpoint

```bash
# From your local machine or jump server
curl http://SERVER_IP:5001/api/health

# Or from the server itself
curl http://localhost:5001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "CIXIO API is running",
  "timestamp": "2026-02-08T10:30:45.123Z"
}
```

---

## Rollback Procedure

If a deployment fails, you can quickly rollback to a previous version:

```bash
# SSH to the server
ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP

# Go to the base directory
cd /home/ec2-user/cixio.com/landing1

# List previous deployments
ls -lt

# Navigate to a previous deployment
cd 2026-02-08_09-15-30/docker-images-export

# Run the deployment
./deploy-on-stage.sh
```

---

## Troubleshooting

### Issue: Cannot connect to server

```bash
# Test SSH connectivity
ssh -i ~/.ssh/id_ed25519 ec2-user@172.31.45.88 "echo 'Connection successful'"

# Check if SSH key has correct permissions
chmod 600 ~/.ssh/id_ed25519
```

### Issue: Disk space full

```bash
# Check disk space on server
ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP "df -h"

# Clean up old deployments manually
ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP "cd /home/ec2-user/cixio.com/landing1 && ls -lt"
ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP "rm -rf /home/ec2-user/cixio.com/landing1/OLD_TIMESTAMP"
```

### Issue: Docker images not loading

```bash
# SSH to the server
ssh -i ~/.ssh/id_ed25519 ec2-user@SERVER_IP

# Check if tar files exist
ls -lh /path/to/deployment/docker-images-export/*.tar

# Manually load images
docker load -i cixio-com-app.tar
docker load -i cixio-com-mongo.tar

# Check loaded images
docker images
```

---

## Security Considerations

1. **Never commit `.env` file** - Contains sensitive credentials
2. **Restrict SSH key permissions** - `chmod 600 ~/.ssh/id_ed25519`
3. **Use different credentials** for stage and production
4. **Limit SSH access** - Only allow necessary IP addresses
5. **Regular security updates** - Keep Docker and system packages updated
6. **Monitor deployments** - Set up alerts for failed deployments

---

## Quick Reference

| Action | Command |
|--------|---------|
| Deploy to Stage | `DEPLOY_TARGET=stage ./deploy-to-stage.sh` |
| Deploy to Production | `DEPLOY_TARGET=production ./deploy-to-stage.sh` |
| SSH to Stage | `ssh -i ~/.ssh/id_ed25519 ec2-user@172.31.45.88` |
| SSH to Production | `ssh -i ~/.ssh/id_ed25519 ec2-user@172.31.36.168` |
| Check Docker Status | `docker ps` |
| View App Logs | `docker logs -f cixio-com-app` |
| Test API | `curl http://localhost:5001/api/health` |

---

## Related Files

- `deploy-to-stage.sh` - Main deployment script (reads from .env)
- `deploy-stage.sh` - Convenience script for stage deployment
- `deploy-production.sh` - Convenience script for production deployment
- `deploy-on-stage.sh` - Script that runs ON the target server
- `build-and-export-images.sh` - Docker image build and export
- `.env` - Environment configuration (not in git)
- `.env.example` - Example configuration file

---

**Last Updated**: February 8, 2026  
**Branch**: dev_20260208_MultiApplicationPortAllocation
