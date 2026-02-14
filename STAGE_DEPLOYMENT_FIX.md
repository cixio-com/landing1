# Stage Server Deployment Fix - Summary

## Problem
When running `./deploy-stage.sh`, the script failed at Step 4 with error:
```
df: /home/ec2-user/cixio.com/landing1: No such file or directory
```

**Root Cause:** The script was checking disk space on a directory that didn't exist yet. The directory creation happened in Step 6, but disk space check was in Step 4.

---

## Solution Implemented

### 1. Fixed `deploy.sh` Script

**Changes Made:**
- **Reordered Steps:** Created base directory BEFORE checking disk space
- **Added Safety Checks:** Directory creation now happens with proper error handling
- **Better Error Messages:** Added fallback for cleaning up old deployments

**New Step Order:**
```bash
Step 1: Cleaning up local Docker environment
Step 2: Resetting git repository
Step 3: Building and exporting Docker images
Step 3.1: Copying additional files to export directory
Step 4: Creating base directory on server (NEW)
Step 5: Checking disk space on server (moved from Step 4)
Step 6: Cleaning up old deployments (moved from Step 5)
Step 7: Creating deployment directory (moved from Step 6)
Step 8: Transferring files (moved from Step 7)
Step 9: Cleaning up local Docker environment (moved from Step 8)
Step 10: Removing local export directory (moved from Step 9)
```

**Key Changes in Step 4 (NEW):**
```bash
echo "Step 4: Creating base directory on ${SERVER_NAME} server if it doesn't exist..."
ssh -i ${SSH_KEY} ${TARGET_SERVER} "mkdir -p ${REMOTE_BASE_DIR}"

# Check if directory already exists and has deployments
if ssh -i ${SSH_KEY} ${TARGET_SERVER} "[ -d ${REMOTE_BASE_DIR} ] && [ \$(ls -A ${REMOTE_BASE_DIR} 2>/dev/null | wc -l) -gt 0 ]"; then
    echo "Base directory exists with previous deployments"
else
    echo "Base directory created (new installation)"
fi
```

**Updated Step 6 (Cleanup):**
```bash
echo "Step 6: Cleaning up old deployments on ${SERVER_NAME} server (keeping last 3)..."
ssh -i ${SSH_KEY} ${TARGET_SERVER} "cd ${REMOTE_BASE_DIR} && ls -t 2>/dev/null | tail -n +4 | xargs -r rm -rf" || echo "No old deployments to clean"
```

### 2. Created `prepare-stage-server.sh` (NEW Script)

**Purpose:** Pre-deployment preparation and validation for Stage Server

**Features:**
1. **SSH Connection Test:** Verifies connectivity to Stage Server
2. **Base Directory Management:**
   - Creates directory if it doesn't exist
   - Handles existing directories with 4 options:
     - ✅ Backup existing directory (recommended)
     - ❌ Delete existing directory
     - ⏭️ Keep existing and create timestamped deployment (default)
     - 🚪 Exit
3. **Docker Validation:**
   - Checks if Docker is installed
   - Verifies Docker service is running
   - Validates user permissions
4. **Disk Space Check:** Warns if disk usage > 80%
5. **Deployment Listing:** Shows existing deployments

**Usage:**
```bash
# Run before first deployment or to prepare server
./prepare-stage-server.sh
```

---

## Files Modified

### 1. `deploy.sh`
**Location:** `CIXIO.COM/landing1/deploy.sh`

**Changes:**
- Line ~153: Added Step 4 - Create base directory first
- Line ~160: Moved disk space check to Step 5
- Line ~165: Added error handling to old deployment cleanup
- Updated all subsequent step numbers (6-10)

### 2. `prepare-stage-server.sh` (NEW)
**Location:** `CIXIO.COM/landing1/prepare-stage-server.sh`

**Purpose:** Pre-deployment preparation script

---

## How to Use

### First-Time Deployment to Stage

```bash
# On Build Server

# Step 1: Prepare the Stage Server (optional but recommended)
cd ~/CIXIO/landing1
./prepare-stage-server.sh

# Step 2: Deploy to Stage
./deploy-stage.sh

# Step 3: SSH to Stage and run deployment
ssh ec2-user@172.31.45.88
cd /home/ec2-user/cixio.com/landing1/<timestamp>/docker-images-export
./deploy-on-server.sh
```

### Subsequent Deployments

```bash
# On Build Server
cd ~/CIXIO/landing1
./deploy-stage.sh

# The script will now automatically:
# 1. Create base directory if missing
# 2. Check disk space
# 3. Clean up old deployments (keep last 3)
# 4. Create new timestamped deployment
# 5. Transfer files
```

---

## Configuration Required

Ensure your `.env` file has Stage Server configuration:

```bash
# Stage Server Configuration
STAGE_SERVER_USER=ec2-user
STAGE_SERVER_IP=172.31.45.88
STAGE_SERVER_SSH_KEY=~/.ssh/id_ed25519
STAGE_SERVER_BASE_DIR=/home/ec2-user/cixio.com/landing1
```

---

## Testing Checklist

- [x] **Step 4 Fix:** Base directory created before disk space check
- [x] **Error Handling:** Script handles missing directories gracefully
- [x] **Backup Option:** prepare-stage-server.sh can backup existing deployments
- [x] **Cleanup Safety:** Old deployment cleanup handles empty directories
- [ ] **Test First Deployment:** Verify fresh deployment to empty server
- [ ] **Test Subsequent Deployment:** Verify deployment with existing deployments
- [ ] **Test Backup Feature:** Verify prepare-stage-server.sh backup option

---

## Deployment Directory Structure

After deployment, Stage Server will have:

```
/home/ec2-user/cixio.com/landing1/
├── 2026-02-14_04-24-00/          # Timestamped deployment 1
│   └── docker-images-export/
│       ├── cixio-com-app.tar
│       ├── cixio-com-mongo-7.0.tar
│       ├── docker-compose.yml
│       ├── .env
│       └── deploy-on-server.sh
├── 2026-02-14_05-30-00/          # Timestamped deployment 2
│   └── docker-images-export/
│       └── ...
└── 2026-02-14_06-45-00/          # Latest deployment (keeps last 3)
    └── docker-images-export/
        └── ...
```

---

## Troubleshooting

### Problem: Directory permission denied
**Solution:**
```bash
ssh ec2-user@172.31.45.88
mkdir -p /home/ec2-user/cixio.com/landing1
chmod 755 /home/ec2-user/cixio.com/landing1
```

### Problem: Old deployments not being cleaned up
**Solution:** The script now handles this gracefully with `|| echo "No old deployments to clean"`

### Problem: Disk space warning
**Solution:**
```bash
# On Stage Server
cd /home/ec2-user/cixio.com/landing1
# Remove old deployments manually
rm -rf 2026-02-10_*
# Or use Docker cleanup
docker system prune -a -f
```

---

## Next Steps

1. **Test the Fix:**
   ```bash
   cd ~/CIXIO/landing1
   ./deploy-stage.sh
   ```

2. **Verify on Stage Server:**
   ```bash
   ssh ec2-user@172.31.45.88
   ls -lh /home/ec2-user/cixio.com/landing1/
   ```

3. **Deploy Application:**
   ```bash
   cd /home/ec2-user/cixio.com/landing1/<latest-timestamp>/docker-images-export
   ./deploy-on-server.sh
   ```

4. **Apply Same Fix to Other Projects:**
   - CIXIO.IN (mvp2)
   - CIXIO.ONLINE (mvp3)
   - CIXIO.AI (mvp4)
   - CIXIO.CHAT (mvp5)
   - CIXIO.IO (mvp6)
   - CIXIO.TRAVEL (mvp7)

---

## Summary of Benefits

✅ **Fixed:** Directory creation happens before disk space check  
✅ **Safe:** Handles missing directories without errors  
✅ **Smart:** Cleans up old deployments automatically (keeps last 3)  
✅ **Backup:** Optional backup of existing deployments  
✅ **Validated:** Checks Docker installation and disk space  
✅ **Informative:** Shows existing deployments and their sizes  

---

**Status:** ✅ Ready to deploy to Stage Server!
