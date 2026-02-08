#!/bin/bash

# Deploy to Server Script (Stage or Production)
# This script runs on the JUMP SERVER
# It builds Docker images, exports them, and transfers to target server

set -e  # Exit on any error

echo "=========================================="
echo "Starting Deployment to Target Server"
echo "=========================================="

# Load environment variables from .env file
if [ -f .env ]; then
    echo "Loading configuration from .env file..."
    # Use a robust method to load .env file that handles special characters
    set -o allexport
    # shellcheck disable=SC1091
    . .env
    set +o allexport
else
    echo "WARNING: .env file not found. Using default values."
fi

# Configuration - Read from environment or use defaults
DEPLOY_TARGET="${DEPLOY_TARGET:-stage}"

# Convert to lowercase for comparison
DEPLOY_TARGET=$(echo "$DEPLOY_TARGET" | tr '[:upper:]' '[:lower:]')

echo ""
echo "Deployment Target: ${DEPLOY_TARGET^^}"
echo "----------------------------------------"

# Set server configuration based on target
if [ "$DEPLOY_TARGET" == "production" ]; then
    SERVER_USER="${PRODUCTION_SERVER_USER}"
    SERVER_IP="${PRODUCTION_SERVER_IP}"
    SSH_KEY="${PRODUCTION_SERVER_SSH_KEY}"
    REMOTE_BASE_DIR="${PRODUCTION_SERVER_BASE_DIR}"
    SERVER_NAME="PRODUCTION"
elif [ "$DEPLOY_TARGET" == "stage" ]; then
    SERVER_USER="${STAGE_SERVER_USER}"
    SERVER_IP="${STAGE_SERVER_IP}"
    SSH_KEY="${STAGE_SERVER_SSH_KEY}"
    REMOTE_BASE_DIR="${STAGE_SERVER_BASE_DIR}"
    SERVER_NAME="STAGE"
else
    echo "ERROR: Invalid DEPLOY_TARGET '${DEPLOY_TARGET}'. Must be 'stage' or 'production'."
    exit 1
fi

# Validate required configuration
if [ -z "$SERVER_USER" ] || [ -z "$SERVER_IP" ] || [ -z "$SSH_KEY" ] || [ -z "$REMOTE_BASE_DIR" ]; then
    echo ""
    echo "ERROR: Missing required ${SERVER_NAME} server configuration!"
    echo "Please ensure the following variables are set in your .env file:"
    echo ""
    if [ "$DEPLOY_TARGET" == "production" ]; then
        echo "  PRODUCTION_SERVER_USER"
        echo "  PRODUCTION_SERVER_IP"
        echo "  PRODUCTION_SERVER_SSH_KEY"
        echo "  PRODUCTION_SERVER_BASE_DIR"
    else
        echo "  STAGE_SERVER_USER"
        echo "  STAGE_SERVER_IP"
        echo "  STAGE_SERVER_SSH_KEY"
        echo "  STAGE_SERVER_BASE_DIR"
    fi
    echo ""
    echo "Example .env configuration:"
    if [ "$DEPLOY_TARGET" == "production" ]; then
        echo "  PRODUCTION_SERVER_USER=ec2-user"
        echo "  PRODUCTION_SERVER_IP=172.31.36.168"
        echo "  PRODUCTION_SERVER_SSH_KEY=~/.ssh/id_ed25519"
        echo "  PRODUCTION_SERVER_BASE_DIR=/home/ec2-user/cixio.com/landing1"
    else
        echo "  STAGE_SERVER_USER=ec2-user"
        echo "  STAGE_SERVER_IP=172.31.45.88"
        echo "  STAGE_SERVER_SSH_KEY=~/.ssh/id_ed25519"
        echo "  STAGE_SERVER_BASE_DIR=/home/ec2-user/cixio.com/landing1"
    fi
    echo ""
    exit 1
fi

TARGET_SERVER="${SERVER_USER}@${SERVER_IP}"

echo "Target Server: ${SERVER_NAME}"
echo "Server Address: ${TARGET_SERVER}"
echo "SSH Key: ${SSH_KEY}"
echo "Remote Directory: ${REMOTE_BASE_DIR}"
echo ""

DATE_TIME_DIR=$(date +"%Y-%m-%d_%H-%M-%S")
REMOTE_DIR="${REMOTE_BASE_DIR}/${DATE_TIME_DIR}"
LOCAL_PROJECT_DIR="${LOCAL_PROJECT_DIR:-$(pwd)}"
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

echo "Copying deploy-on-server.sh..."
cp deploy-on-server.sh ${EXPORT_DIR}/deploy-on-server.sh

echo "All required files are now in ${EXPORT_DIR}/"
ls -lh ${EXPORT_DIR}/

echo ""
echo "Step 4: Checking disk space on ${SERVER_NAME} server..."
echo "----------------------------------------"
ssh -i ${SSH_KEY} ${TARGET_SERVER} "df -h ${REMOTE_BASE_DIR}"

echo ""
echo "Step 5: Cleaning up old deployments on ${SERVER_NAME} server (keeping last 3)..."
echo "----------------------------------------"
ssh -i ${SSH_KEY} ${TARGET_SERVER} "cd ${REMOTE_BASE_DIR} && ls -t | tail -n +4 | xargs -r rm -rf"

echo ""
echo "Step 6: Creating remote directory on ${SERVER_NAME} server..."
echo "----------------------------------------"
ssh -i ${SSH_KEY} ${TARGET_SERVER} "mkdir -p ${REMOTE_DIR}"

echo ""
echo "Step 7: Transferring all files to ${SERVER_NAME} server (single command)..."
echo "----------------------------------------"
echo "Copying docker-images-export directory with all files..."
scp -i ${SSH_KEY} -r ${LOCAL_PROJECT_DIR}/${EXPORT_DIR} ${TARGET_SERVER}:${REMOTE_DIR}/

echo ""
echo "Verifying transferred files on ${SERVER_NAME} server..."
ssh -i ${SSH_KEY} ${TARGET_SERVER} "ls -lh ${REMOTE_DIR}/${EXPORT_DIR}/"

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
echo "Deployment to ${SERVER_NAME} Server COMPLETED!"
echo "=========================================="
echo ""
echo "Deployment Target: ${SERVER_NAME}"
echo "Deployment Directory: ${DATE_TIME_DIR}"
echo ""
echo "Next steps:"
echo "1. SSH to ${SERVER_NAME} server: ssh -i ${SSH_KEY} ${TARGET_SERVER}"
echo "2. Navigate to: cd ${REMOTE_DIR}/${EXPORT_DIR}"
echo "3. Run deployment: ./deploy-on-server.sh"
echo ""
echo "Or run directly from jump server:"
echo "ssh -i ${SSH_KEY} ${TARGET_SERVER} 'cd ${REMOTE_DIR}/${EXPORT_DIR} && ./deploy-on-server.sh'"
echo ""
