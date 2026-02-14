# Quick Test Guide - MongoDB Optimization

**Version**: 2.1.1  
**Date**: February 14, 2026

---

## 🎯 What Was Fixed

**Problem**: Stage Server was unnecessarily loading MongoDB image (844MB) even though it connects to remote MongoDB at 172.31.33.96.

**Solution**: Stage deployments now skip MongoDB build/export entirely.

**Result**: 
- Stage deployment size: **1.3GB → 465MB (65% reduction)**
- Deployment time: **~10-15 minutes faster**
- Cleaner architecture: Only images that are actually used

---

## ✅ Testing Steps

### On Build Server (172.31.38.202)

```bash
# 1. SSH to Build Server
ssh ec2-user@172.31.5.25
ssh cixio-build-server  # Or from Jump Server

# 2. Navigate to project
cd ~/CIXIO/CIXIO.COM/landing1

# 3. Pull latest changes
git pull origin main

# 4. Verify files are updated
cat build-and-export-images.sh | grep "DEPLOY_TARGET"
# Should see: DEPLOY_TARGET="${DEPLOY_TARGET:-production}"

# 5. Configure for Stage deployment
cp .env.stage.example .env

# 6. Edit .env to set Stage target
nano .env
# Ensure these are set:
#   DEPLOY_TARGET=stage
#   NODE_ENV=staging
#   STAGE_SERVER_SSH_HOST=cixio-stage-server

# 7. Run deployment
./deploy.sh
```

### Expected Output

**Stage Deployment (New Optimized):**
```
[2/4] Skipping MongoDB image (Stage uses remote MongoDB at 172.31.33.96)...
[3/4] Creating exports directory...
[4/4] Saving images to tar files...
  - Saving cixio-com-app:latest...
  - Skipping MongoDB export (Stage uses remote MongoDB)

Exported images:
-rw-r--r-- 1 ec2-user ec2-user 465M Feb 14 06:30 cixio-com-app.tar

Total size:
465M    docker-images-export/
```

**Note**: No `cixio-com-mongo-7.0.tar` file should be created!

### On Stage Server (172.31.45.88)

```bash
# After deployment completes, check Stage Server

# 1. SSH to Stage Server
ssh cixio-stage-server

# 2. Navigate to deployment directory
cd ~/cixio.com/landing1/
ls -lt  # Find latest deployment folder

# 3. Check Docker images
docker images | grep cixio-com

# Expected output (ONLY app image):
# cixio-com-app     latest    f9977e011b89   2 minutes ago   465MB

# 4. Verify no MongoDB image
docker images | grep mongo
# Should return nothing or only mongo images from other projects

# 5. Check running containers
docker ps | grep cixio-com

# Expected output (ONLY app container):
# cixio-com-app   cixio-com-app:latest   Up X seconds   0.0.0.0:5001->80/tcp

# 6. Check application logs
docker logs -f cixio-com-app

# Should see:
# - Server started on port 80
# - MongoDB connected to 172.31.33.96:27017,27018,27019
# - No MongoDB container startup logs

# 7. Test application
curl http://localhost:5001/api/health
# Should return: {"status":"ok","mongodb":"connected",...}

# 8. Check disk space saved
df -h /
# Should have ~840MB more free space than before
```

### Verification Checklist

- [ ] Build script shows "Skipping MongoDB image" for Stage
- [ ] Only `cixio-com-app.tar` created (no mongo tar)
- [ ] Export directory is ~465MB (not 1.3GB)
- [ ] Transfer time is faster (~5-10 min saved)
- [ ] Stage Server only has `cixio-com-app` image
- [ ] Stage Server has NO `cixio-com-mongo` image
- [ ] Application connects to remote MongoDB (172.31.33.96)
- [ ] Application health check passes
- [ ] No MongoDB containers running on Stage

---

## 🔄 Production Deployment (Should Be Unchanged)

To verify Production still works correctly:

```bash
# On Build Server
cd ~/CIXIO/CIXIO.COM/landing1
cp .env.production.example .env

# Edit .env
nano .env
# Ensure: DEPLOY_TARGET=production

# Run deployment
./deploy.sh
```

**Expected for Production:**
```
[2/4] Pulling MongoDB 7.0 image (Production deployment)...
[4/4] Saving images to tar files...
  - Saving cixio-com-app:latest...
  - Saving cixio-com-mongo:7.0 (Production only)...

Total size:
1.3G    docker-images-export/
```

**Production Server should have BOTH images:**
- `cixio-com-app:latest` (465MB)
- `cixio-com-mongo:7.0` (844MB)

---

## 📊 Comparison

### Before Optimization

| Environment | Images Built | Export Size | Transfer Time | Server Images |
|-------------|--------------|-------------|---------------|---------------|
| Stage       | app + mongo  | 1.3 GB      | ~15-20 min    | app + mongo   |
| Production  | app + mongo  | 1.3 GB      | ~15-20 min    | app + mongo   |

### After Optimization

| Environment | Images Built | Export Size | Transfer Time | Server Images |
|-------------|--------------|-------------|---------------|---------------|
| Stage       | **app only** | **465 MB**  | **~5-10 min** | **app only**  |
| Production  | app + mongo  | 1.3 GB      | ~15-20 min    | app + mongo   |

**Stage Improvement:**
- ✅ 65% smaller deployment package
- ✅ 50-66% faster deployment time
- ✅ 840MB storage saved on Build Server
- ✅ 840MB storage saved on Stage Server
- ✅ Cleaner, more accurate architecture

---

## 🐛 Troubleshooting

### Issue: MongoDB image still being built for Stage

**Check:**
```bash
cat .env | grep DEPLOY_TARGET
# Should show: DEPLOY_TARGET=stage
```

**Fix:**
```bash
nano .env
# Change: DEPLOY_TARGET=stage
```

### Issue: MongoDB connection failed on Stage

**Check MongoDB Server:**
```bash
ssh cixio-mongodb-server  # Or: ssh ec2-user@172.31.33.96
docker ps | grep mongo

# All 3 MongoDB containers should be running
# If unhealthy, check logs:
docker logs cixio-mongo1
docker logs cixio-mongo2
docker logs cixio-mongo3
```

**Check Stage .env:**
```bash
cat .env | grep MONGODB_URI
# Should show: mongodb://172.31.33.96:27017,27018,27019/...?replicaSet=rs0
```

### Issue: Old MongoDB image still on Stage Server

**Clean up old images:**
```bash
# On Stage Server
docker rmi cixio-com-mongo:7.0 2>/dev/null || echo "Image already removed"
docker images | grep mongo  # Verify it's gone
```

---

## 📝 Summary

**Changes Implemented:**
1. ✅ `build-and-export-images.sh` - Skip MongoDB for Stage
2. ✅ `deploy-on-server.sh` - Conditional MongoDB handling
3. ✅ `CHANGELOG.md` - Version 2.1.1 release notes
4. ✅ `MONGODB_IMAGE_OPTIMIZATION.md` - Complete documentation

**Benefits:**
- Stage deployments: 65% smaller, 10-15 min faster
- Stage Server: 840MB storage saved
- Clearer architecture alignment
- No impact on Production deployments

**Next Steps:**
1. Pull latest changes on Build Server
2. Deploy to Stage with `DEPLOY_TARGET=stage`
3. Verify Stage has only app image
4. Test application connectivity to MongoDB
5. Monitor for any issues

---

**Questions or issues?** Check `MONGODB_IMAGE_OPTIMIZATION.md` for detailed explanations.
