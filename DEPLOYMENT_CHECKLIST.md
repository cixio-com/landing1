# Deployment Fix Checklist - CIXIO.COM

## 📋 Pre-Commit Checklist

- [ ] Review all file changes
- [ ] Verify docker-compose files are correct
- [ ] Verify .env templates have correct values
- [ ] Read DEPLOYMENT_GUIDE.md
- [ ] Read CHANGELOG.md updates

## 🔧 Files to Commit

### New Files (8):
- [ ] `docker-compose.stage.yml`
- [ ] `docker-compose.production.yml`
- [ ] `.env.stage.example`
- [ ] `.env.production.example`
- [ ] `DEPLOYMENT_GUIDE.md`
- [ ] `REPOSITORY_CHANGES_SUMMARY.md`

### Modified Files (4):
- [ ] `docker-compose.yml`
- [ ] `deploy.sh`
- [ ] `deploy-on-server.sh`
- [ ] `CHANGELOG.md`

## 📝 Git Commands

```bash
# 1. Navigate to repository
cd ~/CIXIO/CIXIO.COM/landing1

# 2. Check current status
git status

# 3. Add all new and modified files
git add docker-compose.stage.yml \
        docker-compose.production.yml \
        .env.stage.example \
        .env.production.example \
        DEPLOYMENT_GUIDE.md \
        REPOSITORY_CHANGES_SUMMARY.md \
        docker-compose.yml \
        deploy.sh \
        deploy-on-server.sh \
        CHANGELOG.md

# 4. Verify staged files
git status

# 5. Commit with descriptive message
git commit -m "feat: Add multi-environment deployment support (Stage/Production)

- Add docker-compose.stage.yml for Stage server (remote MongoDB)
- Add docker-compose.production.yml for Production server (local MongoDB)
- Add environment-specific .env templates
- Update deploy.sh to auto-select compose file based on DEPLOY_TARGET
- Update deploy-on-server.sh to detect environment from NODE_ENV
- Fix Stage deployment external network not found error
- Add comprehensive DEPLOYMENT_GUIDE.md
- Update CHANGELOG.md with version 2.1.0

Version: 2.1.0
Fixes: Stage Server deployment failing with network error"

# 6. Push to remote repository
git push origin main
```

## 🚀 Post-Commit Testing

### Step 1: Pull Latest Code on Build Server
```bash
cd ~/CIXIO/CIXIO.COM/landing1
git pull origin main
```

### Step 2: Configure for Stage Deployment
```bash
# Copy Stage template
cp .env.stage.example .env

# Verify configuration
cat .env | grep -E "DEPLOY_TARGET|NODE_ENV|STAGE_SERVER|MONGODB"

# Expected output:
# DEPLOY_TARGET=stage
# NODE_ENV=staging
# STAGE_SERVER_IP=172.31.45.88
# MONGODB_URI=mongodb://172.31.33.96:27017,...
```

### Step 3: Clean Stage Server
```bash
# SSH to Stage Server
./ssh-from-build.sh  # Select option 1

# Clean everything
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker rmi -f $(docker images -aq) 2>/dev/null || true
docker system prune -a -f --volumes
rm -rf ~/cixio.com
mkdir -p ~/cixio.com/landing1

# Verify clean
docker ps -a
docker images -a
exit
```

### Step 4: Deploy from Build Server
```bash
# On Build Server
cd ~/CIXIO/CIXIO.COM/landing1
./deploy.sh

# Expected output should show:
# - "Using Stage configuration: docker-compose.stage.yml"
# - "✓ Copied docker-compose.stage.yml (for Stage deployment)"
# - Files transferred to 172.31.45.88
```

### Step 5: Run Deployment on Stage Server
```bash
# Option A: Remote execution
ssh ec2-user@172.31.45.88 'cd ~/cixio.com/landing1/$(ls -t | head -1)/docker-images-export && ./deploy-on-server.sh'

# Option B: Manual execution
./ssh-from-build.sh  # Select option 1
cd ~/cixio.com/landing1/$(ls -t | head -1)/docker-images-export
ls -lh
# Should see: docker-compose.yml, docker-compose.stage.yml, .env, deploy-on-server.sh, *.tar files

./deploy-on-server.sh
```

### Step 6: Verify Deployment Success
```bash
# Check containers
docker ps
# Expected: cixio-com-app container running on port 5001

# Check logs
docker logs cixio-com-app | tail -30
# Expected: "MongoDB connected", "Server listening on port 80"

# Test application
curl http://localhost:5001
curl http://localhost:5001/api/health

# Test MongoDB connection
docker exec cixio-com-app node -e "
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
console.log('Testing MongoDB:', uri);
MongoClient.connect(uri)
  .then(() => console.log('✓ MongoDB connected successfully'))
  .then(() => process.exit(0))
  .catch(err => { console.error('✗ Error:', err.message); process.exit(1); });
"
# Expected: ✓ MongoDB connected successfully
```

### Step 7: Check MongoDB Server (if containers were unhealthy)
```bash
# SSH to MongoDB Server
ssh ec2-user@172.31.33.96

# Check status
docker ps | grep mongo
# Expected: All 3 containers showing (healthy) status

# If unhealthy, check logs
docker logs cixio-mongo1 | tail -30

# Test replica set
docker exec cixio-mongo1 mongosh --eval "rs.status()"

# If needed, restart
docker restart cixio-mongo1 cixio-mongo2 cixio-mongo3
sleep 30
docker ps | grep mongo
```

## ✅ Success Criteria

- [ ] Git commit successful
- [ ] Git push successful
- [ ] Code pulled on Build Server
- [ ] Stage Server cleaned
- [ ] Deployment script runs without errors
- [ ] Docker container starts successfully
- [ ] Application responds on port 5001
- [ ] MongoDB connection successful
- [ ] No "external network not found" error
- [ ] Logs show proper MongoDB connection to 172.31.33.96

## 🐛 Troubleshooting

### If "external network not found" error still appears:
```bash
# On Stage Server
cd ~/cixio.com/landing1/$(ls -t | head -1)/docker-images-export
cat docker-compose.yml | grep "external"
# Should NOT show "external: true"
# If it does, wrong file was copied

# Fix:
cp docker-compose.stage.yml docker-compose.yml
docker-compose down
docker-compose up -d
```

### If MongoDB connection fails:
```bash
# Test network connectivity
ping 172.31.33.96

# Test MongoDB ports
nc -zv 172.31.33.96 27017
nc -zv 172.31.33.96 27018
nc -zv 172.31.33.96 27019

# Check security groups (ensure Stage can connect to MongoDB ports)
```

### If container won't start:
```bash
# Check logs
docker logs cixio-com-app

# Check environment variables
docker exec cixio-com-app env | grep MONGO

# Restart
docker-compose restart
```

## 📊 Expected Results

### Build Server - deploy.sh output:
```
Detected environment: stage
Using Stage configuration: docker-compose.stage.yml
✓ Copied docker-compose.stage.yml (for Stage deployment)
Step 4: Creating base directory on STAGE server if it doesn't exist...
Base directory created (new installation)
```

### Stage Server - deploy-on-server.sh output:
```
Detected environment: staging
Using compose file: docker-compose.stage.yml
Step 5: Starting Docker containers with docker-compose...
[+] Running 2/2
 ✔ Network cixio-com_cixio-com-network Created
 ✔ Container cixio-com-app              Started
Deployment on Server COMPLETED!
```

### Application logs should show:
```
MongoDB connected successfully
Server listening on port 80
Application started in staging mode
```

---

## 🎯 Final Steps

1. ✅ Commit all changes to git
2. ✅ Push to remote repository
3. ✅ Pull on Build Server
4. ✅ Configure .env for Stage
5. ✅ Deploy to Stage Server
6. ✅ Verify deployment works
7. ✅ Document any issues found
8. ✅ Test Production deployment (optional)

---

**Ready to commit and deploy! Follow this checklist step by step. 🚀**
