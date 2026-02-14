# CIXIO.COM Deployment Guide - Stage and Production

## Overview

This guide explains how to deploy CIXIO.COM to either Stage or Production servers with proper MongoDB configuration.

---

## Architecture

### **Stage Server** (Multi-EC2 Setup)
```
Build Server (172.31.38.202)
    ↓ Build & Export
Stage Server (172.31.45.88)
    ↓ Connect via VPC IP
MongoDB Server (172.31.33.96) - Production Data
```

- Stage connects to **remote** Production MongoDB
- Uses `docker-compose.stage.yml`
- No `cixio-shared-db` network needed

### **Production Server** (Single-EC2 Setup)
```
Build Server (172.31.38.202)
    ↓ Build & Export
Production Server (172.31.36.168)
    ↓ Connect via Docker Network
MongoDB Containers (same server) - Local
```

- Production connects to **local** MongoDB containers
- Uses `docker-compose.production.yml`
- Requires `cixio-shared-db` network

---

## Files Overview

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Default/development configuration |
| `docker-compose.stage.yml` | Stage server (remote MongoDB via VPC IP) |
| `docker-compose.production.yml` | Production server (local MongoDB via Docker network) |
| `.env.stage.example` | Stage environment template |
| `.env.production.example` | Production environment template |
| `deploy.sh` | Runs on Build Server - builds and transfers to target |
| `deploy-on-server.sh` | Runs on target server - loads images and starts containers |

---

## Stage Deployment

### **Step 1: Configure .env for Stage (on Build Server)**

```bash
# Navigate to project
cd ~/CIXIO/CIXIO.COM/landing1

# Copy stage template
cp .env.stage.example .env

# Edit configuration
nano .env
```

**Required settings for Stage:**
```env
DEPLOY_TARGET=stage
NODE_ENV=staging

# Stage Server
STAGE_SERVER_USER=ec2-user
STAGE_SERVER_IP=172.31.45.88
STAGE_SERVER_SSH_KEY=~/.ssh/id_rsa
STAGE_SERVER_BASE_DIR=/home/ec2-user/cixio.com/landing1

# MongoDB - Production Server (Remote)
MONGODB_URI=mongodb://172.31.33.96:27017,172.31.33.96:27018,172.31.33.96:27019/cixio_com_production?replicaSet=rs0
```

### **Step 2: Deploy from Build Server**

```bash
# Run deployment
./deploy.sh
```

**What happens:**
1. Cleans local Docker environment
2. Pulls latest code from git
3. Builds Docker images
4. Exports to tar files
5. Copies `docker-compose.stage.yml` as `docker-compose.yml`
6. Creates directory on Stage Server: `/home/ec2-user/cixio.com/landing1/<timestamp>/`
7. Transfers all files via SCP
8. Cleans up local environment

### **Step 3: Run deployment on Stage Server**

**Option A: Remote execution from Build Server**
```bash
ssh ec2-user@172.31.45.88 'cd /home/ec2-user/cixio.com/landing1/$(ls -t | head -1)/docker-images-export && ./deploy-on-server.sh'
```

**Option B: Manual execution on Stage Server**
```bash
# SSH to Stage
./ssh-from-build.sh  # Select option 1

# Navigate to deployment
cd ~/cixio.com/landing1/$(ls -t | head -1)/docker-images-export

# Deploy
./deploy-on-server.sh
```

### **Step 4: Verify Stage Deployment**

```bash
# Check containers
docker ps

# Check logs
docker logs -f cixio-com-app

# Test application
curl http://localhost:5001
curl http://localhost:5001/api/health

# Test MongoDB connection
docker exec cixio-com-app node -e "
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
console.log('Testing:', uri);
MongoClient.connect(uri)
  .then(() => console.log('✓ MongoDB connected'))
  .then(() => process.exit(0))
  .catch(err => { console.error('✗ Error:', err.message); process.exit(1); });
"
```

---

## Production Deployment

### **Step 1: Ensure MongoDB Network Exists (on Production Server)**

```bash
# SSH to Production Server
ssh ec2-user@172.31.36.168

# Check if network exists
docker network ls | grep cixio-shared-db

# If not exists, create it
docker network create cixio-shared-db

# Verify MongoDB containers are on this network
docker network inspect cixio-shared-db
```

### **Step 2: Configure .env for Production (on Build Server)**

```bash
# Navigate to project
cd ~/CIXIO/CIXIO.COM/landing1

# Copy production template
cp .env.production.example .env

# Edit configuration
nano .env
```

**Required settings for Production:**
```env
DEPLOY_TARGET=production
NODE_ENV=production

# Production Server
PRODUCTION_SERVER_USER=ec2-user
PRODUCTION_SERVER_IP=172.31.36.168
PRODUCTION_SERVER_SSH_KEY=~/.ssh/id_rsa
PRODUCTION_SERVER_BASE_DIR=/home/ec2-user/cixio.com/landing1

# MongoDB - Local (Docker Network)
CIXIO_COM_DB_USER=cixio_com_user
CIXIO_COM_DB_PASSWORD=your_secure_password

# Uses container names
MONGODB_URI=mongodb://${CIXIO_COM_DB_USER}:${CIXIO_COM_DB_PASSWORD}@cixio-mongo1:27017,cixio-mongo2:27017,cixio-mongo3:27017/cixio_com_production?replicaSet=rs0&authSource=cixio_com_production
```

### **Step 3: Deploy from Build Server**

```bash
# Run deployment
./deploy.sh
```

**What happens:**
1. Copies `docker-compose.production.yml` as `docker-compose.yml`
2. Transfers to Production Server
3. Uses `cixio-shared-db` network to connect to local MongoDB

### **Step 4: Run deployment on Production Server**

```bash
# SSH to Production
ssh ec2-user@172.31.36.168

# Navigate to deployment
cd ~/cixio.com/landing1/$(ls -t | head -1)/docker-images-export

# Deploy
./deploy-on-server.sh
```

### **Step 5: Verify Production Deployment**

```bash
# Check containers (should be on cixio-shared-db network)
docker ps
docker network inspect cixio-shared-db

# Check logs
docker logs -f cixio-com-app

# Test application
curl http://localhost:5001
```

---

## Troubleshooting

### **Stage: "network cixio-shared-db declared as external, but could not be found"**

**Problem:** Wrong docker-compose file used (production instead of stage)

**Solution:**
```bash
# On Build Server, verify .env
cat .env | grep DEPLOY_TARGET
# Should show: DEPLOY_TARGET=stage

# Redeploy
./deploy.sh

# Or manually fix on Stage Server
cd ~/cixio.com/landing1/<timestamp>/docker-images-export
cp docker-compose.stage.yml docker-compose.yml 2>/dev/null || \
cat > docker-compose.yml << 'EOF'
services:
  app:
    image: cixio-com-app:latest
    container_name: cixio-com-app
    restart: unless-stopped
    env_file:
      - .env
    environment:
      NODE_ENV: staging
      MONGODB_URI: mongodb://172.31.33.96:27017,172.31.33.96:27018,172.31.33.96:27019/cixio_com_production?replicaSet=rs0
    ports:
      - "5001:80"
    networks:
      - cixio-com-network

networks:
  cixio-com-network:
    driver: bridge
EOF

docker-compose up -d
```

### **Production: Cannot connect to MongoDB**

**Problem:** `cixio-shared-db` network doesn't exist or MongoDB not on network

**Solution:**
```bash
# On Production Server
# Create network
docker network create cixio-shared-db

# Check MongoDB containers
docker ps | grep mongo

# Connect MongoDB containers to network (if needed)
docker network connect cixio-shared-db cixio-mongo1
docker network connect cixio-shared-db cixio-mongo2
docker network connect cixio-shared-db cixio-mongo3

# Restart app
docker-compose restart
```

### **MongoDB containers unhealthy**

```bash
# On MongoDB Server (172.31.33.96)
# Check logs
docker logs cixio-mongo1 | tail -30

# Test connectivity
docker exec cixio-mongo1 mongosh --eval "db.adminCommand('ping')"

# Check replica set
docker exec cixio-mongo1 mongosh --eval "rs.status()"

# Restart if needed
docker restart cixio-mongo1 cixio-mongo2 cixio-mongo3
sleep 30
docker ps | grep mongo
```

---

## Quick Reference

### **Stage Deployment Commands**

```bash
# On Build Server
cd ~/CIXIO/CIXIO.COM/landing1
cp .env.stage.example .env
nano .env  # Set DEPLOY_TARGET=stage
./deploy.sh

# Remote deploy on Stage
ssh ec2-user@172.31.45.88 'cd ~/cixio.com/landing1/$(ls -t | head -1)/docker-images-export && ./deploy-on-server.sh'
```

### **Production Deployment Commands**

```bash
# On Build Server
cd ~/CIXIO/CIXIO.COM/landing1
cp .env.production.example .env
nano .env  # Set DEPLOY_TARGET=production
./deploy.sh

# Remote deploy on Production
ssh ec2-user@172.31.36.168 'cd ~/cixio.com/landing1/$(ls -t | head -1)/docker-images-export && ./deploy-on-server.sh'
```

### **Verification Commands**

```bash
# Check deployment
docker ps
docker logs -f cixio-com-app
curl http://localhost:5001

# Test MongoDB
docker exec cixio-com-app env | grep MONGO
docker run --rm mongo:6.0 mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')"
```

---

## Summary

✅ **Stage** uses `docker-compose.stage.yml` - remote MongoDB via VPC IP  
✅ **Production** uses `docker-compose.production.yml` - local MongoDB via Docker network  
✅ `deploy.sh` automatically copies correct file based on `DEPLOY_TARGET`  
✅ `deploy-on-server.sh` detects environment from `NODE_ENV` in `.env`  

---

**Ready for proper deployment workflow! 🚀**
