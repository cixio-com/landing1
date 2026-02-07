#!/bin/bash

# Deploy to Stage Server Script
# This script runs on the JUMP SERVER
# It builds Docker images, exports them, and transfers to stage server

set -e  # Exit on any error

echo "=========================================="
echo "Starting Deployment to Stage Server"
echo "=========================================="

# Configuration
STAGE_SERVER="ec2-user@172.31.45.88"
SSH_KEY="~/.ssh/id_ed25519"
REMOTE_BASE_DIR="/home/ec2-user/cixio.com/landing1"
DATE_TIME_DIR=$(date +"%Y-%m-%d_%H-%M-%S")
REMOTE_DIR="${REMOTE_BASE_DIR}/${DATE_TIME_DIR}"
LOCAL_PROJECT_DIR="/home/ec2-user/cixio.com/landing1"
EXPORT_DIR="docker-images-export"

echo "Deployment directory: ${DATE_TIME_DIR}"

echo ""
echo "Step 1: Cleaning up existing Docker containers and images..."
echo "----------------------------------------"
docker stop $(docker ps -aq) 2>/dev/null || echo "No running containers to stop"
docker rm $(docker ps -aq) 2>/dev/null || echo "No containers to remove"
docker rmi -f $(docker images -aq) 2>/dev/null || echo "No images to remove"

echo ""
echo "Docker status after cleanup:"
docker images -a
docker ps -a

echo ""
echo "Step 2: Resetting git repository and updating code..."
echo "----------------------------------------"
git checkout .
rm -rf ${EXPORT_DIR}/
git fetch
git pull

echo ""
echo "Step 3: Building and exporting Docker images..."
echo "----------------------------------------"
chmod +x build-and-export-images.sh
./build-and-export-images.sh

if [ ! -d "${EXPORT_DIR}" ]; then
    echo "ERROR: ${EXPORT_DIR} directory was not created!"
    exit 1
fi

echo ""
echo "Step 3.1: Copying additional files to export directory..."
echo "----------------------------------------"
echo "Copying .env file..."
cp .env ${EXPORT_DIR}/.env

echo "Copying docker-compose.yml..."
cp docker-compose.yml ${EXPORT_DIR}/docker-compose.yml

echo "Copying deploy-on-stage.sh..."
cp deploy-on-stage.sh ${EXPORT_DIR}/deploy-on-stage.sh
chmod +x ${EXPORT_DIR}/deploy-on-stage.sh

echo "All required files are now in ${EXPORT_DIR}/"
ls -lh ${EXPORT_DIR}/

echo ""
echo "Step 4: Checking disk space on stage server..."
echo "----------------------------------------"
ssh -i ${SSH_KEY} ${STAGE_SERVER} "df -h ${REMOTE_BASE_DIR}"

echo ""
echo "Step 5: Cleaning up old deployments on stage server (keeping last 3)..."
echo "----------------------------------------"
ssh -i ${SSH_KEY} ${STAGE_SERVER} "cd ${REMOTE_BASE_DIR} && ls -t | tail -n +4 | xargs -r rm -rf"

echo ""
echo "Step 6: Creating remote directory on stage server..."
echo "----------------------------------------"
ssh -i ${SSH_KEY} ${STAGE_SERVER} "mkdir -p ${REMOTE_DIR}"

echo ""
echo "Step 7: Transferring all files to stage server (single command)..."
echo "----------------------------------------"
echo "Copying docker-images-export directory with all files..."
scp -i ${SSH_KEY} -r ${LOCAL_PROJECT_DIR}/${EXPORT_DIR} ${STAGE_SERVER}:${REMOTE_DIR}/

echo ""
echo "Verifying transferred files on stage server..."
ssh -i ${SSH_KEY} ${STAGE_SERVER} "ls -lh ${REMOTE_DIR}/${EXPORT_DIR}/"

echo ""
echo "Step 8: Cleaning up local Docker environment..."
echo "----------------------------------------"
docker stop $(docker ps -aq) 2>/dev/null || echo "No running containers to stop"
docker rm $(docker ps -aq) 2>/dev/null || echo "No containers to remove"
docker rmi -f $(docker images -aq) 2>/dev/null || echo "No images to remove"

echo ""
echo "Step 9: Removing local export directory..."
echo "----------------------------------------"
rm -rf ${EXPORT_DIR}/
echo "Cleanup completed"

echo ""
echo "=========================================="
echo "Deployment to Stage Server COMPLETED!"
echo "=========================================="
echo ""
echo "Deployment Directory: ${DATE_TIME_DIR}"
echo ""
echo "Next steps:"
echo "1. SSH to stage server: ssh -i ${SSH_KEY} ${STAGE_SERVER}"
echo "2. Navigate to: cd ${REMOTE_DIR}/${EXPORT_DIR}"
echo "3. Run deployment: ./deploy-on-stage.sh"
echo ""
echo "Or run directly from jump server:"
echo "ssh -i ${SSH_KEY} ${STAGE_SERVER} 'cd ${REMOTE_DIR}/${EXPORT_DIR} && chmod +x deploy-on-stage.sh && ./deploy-on-stage.sh'"
echo ""
