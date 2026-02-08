# Simple Deployment Guide

## Files You Need to Know

### On Jump Server (3 files only):
1. **`deploy-stage.sh`** - Deploy to stage server
2. **`deploy-production.sh`** - Deploy to production server  
3. **`deploy.sh`** - Main deployment script (called by above)

### On Target Server (1 file only):
1. **`deploy-on-server.sh`** - Runs on stage/production server to start containers

## Quick Usage

### Deploy to Stage:
```bash
./deploy-stage.sh
```

### Deploy to Production:
```bash
./deploy-production.sh
```

That's it! The scripts handle everything automatically.

## What Happens Behind the Scenes

### Jump Server (`deploy.sh`):
1. Builds Docker images
2. Exports images to files
3. Copies everything to target server
4. Cleans up local files

### Target Server (`deploy-on-server.sh`):
1. Stops old CIXIO containers (only)
2. Removes old CIXIO images (only)
3. Loads new images
4. Starts new containers

## Configuration

All settings are in `.env` file:
- `STAGE_SERVER_IP` - Stage server address
- `PRODUCTION_SERVER_IP` - Production server address
- `STAGE_SERVER_USER` - Stage SSH user
- `PRODUCTION_SERVER_USER` - Production SSH user
- `STAGE_SERVER_SSH_KEY` - Stage SSH key path
- `PRODUCTION_SERVER_SSH_KEY` - Production SSH key path

## That's All!

No need to maintain multiple files or remember complex commands.
Just run `./deploy-stage.sh` or `./deploy-production.sh` and you're done.
