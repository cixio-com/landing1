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
chmod +x build-and-export-images.sh load-images.sh
./build-and-export-images.sh

if [ ! -d "${EXPORT_DIR}" ]; then
    echo "ERROR: ${EXPORT_DIR} directory was not created!"
    exit 1
fi

echo ""
echo "Step 4: Creating remote directory on stage server..."
echo "----------------------------------------"
ssh -i ${SSH_KEY} ${STAGE_SERVER} "mkdir -p ${REMOTE_DIR}"

echo ""
echo "Step 5: Transferring files to stage server..."
echo "----------------------------------------"
echo "Copying docker-images-export directory..."
scp -i ${SSH_KEY} -r ${LOCAL_PROJECT_DIR}/${EXPORT_DIR} ${STAGE_SERVER}:${REMOTE_DIR}/

echo "Copying docker-compose.yml..."
scp -i ${SSH_KEY} ${LOCAL_PROJECT_DIR}/docker-compose.yml ${STAGE_SERVER}:${REMOTE_DIR}/docker-compose.yml

echo "Copying .env file..."
scp -i ${SSH_KEY} ${LOCAL_PROJECT_DIR}/.env ${STAGE_SERVER}:${REMOTE_DIR}/.env

echo "Copying deploy-on-stage.sh script..."
scp -i ${SSH_KEY} ${LOCAL_PROJECT_DIR}/deploy-on-stage.sh ${STAGE_SERVER}:${REMOTE_DIR}/deploy-on-stage.sh

echo ""
echo "Step 6: Cleaning up local Docker environment..."
echo "----------------------------------------"
docker stop $(docker ps -aq) 2>/dev/null || echo "No running containers to stop"
docker rm $(docker ps -aq) 2>/dev/null || echo "No containers to remove"
docker rmi -f $(docker images -aq) 2>/dev/null || echo "No images to remove"

echo ""
echo "Step 7: Removing local export directory..."
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
echo "2. Navigate to: cd ${REMOTE_DIR}"
echo "3. Run deployment: ./deploy-on-stage.sh"
echo ""
echo "Or run directly from jump server:"
echo "ssh -i ${SSH_KEY} ${STAGE_SERVER} 'cd ${REMOTE_DIR} && chmod +x deploy-on-stage.sh && ./deploy-on-stage.sh'"
echo ""
