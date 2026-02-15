# Docker Compose Simplification Summary

## What We Did

Removed all environment-specific docker-compose files and consolidated into a single universal `docker-compose.yml`.

## Before vs After

### Before (Confusing):
```
docker-compose.yml              # Default
docker-compose.stage.yml        # Stage-specific
docker-compose.production.yml   # Production-specific (didn't exist)
```

**Problem:** 
- Which file to use?
- Code duplication
- Easy to update one and forget the other
- Deployment scripts had complex logic

### After (Simple):
```
docker-compose.yml  # Universal - works for all environments
```

**Solution:**
- One file to maintain
- Environment controlled by `.env` file
- `NODE_ENV=staging` or `NODE_ENV=production` in `.env`
- `MONGODB_URI` in `.env` points to correct database

## How It Works

### docker-compose.yml
```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    image: cixio-com-app:latest
    env_file:
      - .env  # ← Environment-specific config
    environment:
      NODE_ENV: ${NODE_ENV:-production}     # ← From .env
      MONGODB_URI: ${MONGODB_URI}           # ← From .env
    ports:
      - "5001:80"
```

### .env.stage
```bash
NODE_ENV=staging
MONGODB_URI=mongodb://cixio_com_user:password@172.31.33.96:27017,172.31.33.96:27018,172.31.33.96:27019/cixio?replicaSet=rs0&authSource=cixio
```

### .env.production
```bash
NODE_ENV=production
MONGODB_URI=mongodb://cixio_com_user:password@172.31.33.96:27017,172.31.33.96:27018,172.31.33.96:27019/cixio?replicaSet=rs0&authSource=cixio
```

## Deployment Flow

### Stage Deployment:
```bash
./deploy-stage.sh
  ↓
Copies .env.stage → export/.env
Copies docker-compose.yml → export/docker-compose.yml
  ↓
SCP to Stage server
  ↓
docker-compose up -d
  ↓
Reads NODE_ENV=staging from .env
```

### Production Deployment:
```bash
./deploy-production.sh
  ↓
Copies .env.production → export/.env
Copies docker-compose.yml → export/docker-compose.yml
  ↓
SCP to Production server
  ↓
docker-compose up -d
  ↓
Reads NODE_ENV=production from .env
```

## Benefits

1. ✅ **One Source of Truth** - Single docker-compose.yml
2. ✅ **No Duplication** - Don't repeat yourself
3. ✅ **Easy Maintenance** - Update once, works everywhere
4. ✅ **Standard Practice** - Docker Compose recommended pattern
5. ✅ **Less Confusion** - No "which compose file?" questions
6. ✅ **Cleaner Code** - Simpler deployment scripts

## Build Context Note

The `build:` section in `docker-compose.yml` is ignored on Stage/Production because:

1. **Development**: Builds from source (no pre-built image)
2. **Stage/Production**: Uses pre-built image loaded from tar file

Docker Compose automatically uses existing image if available, otherwise builds.

---

**Status:** ✅ Simplified and Ready
**Date:** February 15, 2026
