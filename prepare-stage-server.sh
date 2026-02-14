#!/bin/bash

# Prepare Stage Server for Deployment
# This script ensures the base directory exists and backs up any existing deployment

set -e  # Exit on any error

echo "=========================================="
echo "Preparing Stage Server for Deployment"
echo "=========================================="

# Load environment variables from .env file
if [ -f .env ]; then
    echo "Loading configuration from .env file..."
    set -o allexport
    . .env
    set +o allexport
else
    echo "ERROR: .env file not found!"
    exit 1
fi

# Configuration for Stage Server
SERVER_USER="${STAGE_SERVER_USER}"
SERVER_IP="${STAGE_SERVER_IP}"
SSH_KEY="${STAGE_SERVER_SSH_KEY}"
REMOTE_BASE_DIR="${STAGE_SERVER_BASE_DIR}"

# Validate required configuration
if [ -z "$SERVER_USER" ] || [ -z "$SERVER_IP" ] || [ -z "$SSH_KEY" ] || [ -z "$REMOTE_BASE_DIR" ]; then
    echo ""
    echo "ERROR: Missing required Stage server configuration!"
    echo "Please ensure the following variables are set in your .env file:"
    echo "  STAGE_SERVER_USER"
    echo "  STAGE_SERVER_IP"
    echo "  STAGE_SERVER_SSH_KEY"
    echo "  STAGE_SERVER_BASE_DIR"
    exit 1
fi

TARGET_SERVER="${SERVER_USER}@${SERVER_IP}"

echo ""
echo "Target Server: STAGE"
echo "Server Address: ${TARGET_SERVER}"
echo "SSH Key: ${SSH_KEY}"
echo "Base Directory: ${REMOTE_BASE_DIR}"
echo ""

# Check if SSH connection works
echo "Step 1: Testing SSH connection..."
echo "----------------------------------------"
if ssh -i ${SSH_KEY} -o ConnectTimeout=5 ${TARGET_SERVER} "echo 'SSH connection successful'"; then
    echo "✅ SSH connection working"
else
    echo "❌ ERROR: Cannot connect to Stage server!"
    exit 1
fi

# Check if base directory exists
echo ""
echo "Step 2: Checking base directory..."
echo "----------------------------------------"
if ssh -i ${SSH_KEY} ${TARGET_SERVER} "[ -d ${REMOTE_BASE_DIR} ]"; then
    echo "Base directory exists: ${REMOTE_BASE_DIR}"
    
    # Check if directory has content
    FILE_COUNT=$(ssh -i ${SSH_KEY} ${TARGET_SERVER} "ls -A ${REMOTE_BASE_DIR} 2>/dev/null | wc -l")
    
    if [ "$FILE_COUNT" -gt 0 ]; then
        echo "Directory has ${FILE_COUNT} items"
        
        # Ask user what to do
        echo ""
        echo "⚠️  Base directory is not empty!"
        echo ""
        echo "Options:"
        echo "  1) Backup existing directory and continue (recommended)"
        echo "  2) Delete existing directory and start fresh"
        echo "  3) Keep existing and create new timestamped deployment (default behavior)"
        echo "  4) Exit"
        echo ""
        read -p "Select option (1-4) [3]: " OPTION
        OPTION=${OPTION:-3}
        
        case $OPTION in
            1)
                echo ""
                echo "Creating backup of existing directory..."
                BACKUP_NAME="${REMOTE_BASE_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
                ssh -i ${SSH_KEY} ${TARGET_SERVER} "mv ${REMOTE_BASE_DIR} ${BACKUP_NAME}"
                echo "✅ Backed up to: ${BACKUP_NAME}"
                
                echo "Creating fresh base directory..."
                ssh -i ${SSH_KEY} ${TARGET_SERVER} "mkdir -p ${REMOTE_BASE_DIR}"
                echo "✅ Fresh directory created"
                ;;
            2)
                echo ""
                echo "⚠️  WARNING: This will DELETE all existing deployments!"
                read -p "Are you sure? Type 'yes' to confirm: " CONFIRM
                if [ "$CONFIRM" = "yes" ]; then
                    echo "Deleting existing directory..."
                    ssh -i ${SSH_KEY} ${TARGET_SERVER} "rm -rf ${REMOTE_BASE_DIR}"
                    echo "Creating fresh base directory..."
                    ssh -i ${SSH_KEY} ${TARGET_SERVER} "mkdir -p ${REMOTE_BASE_DIR}"
                    echo "✅ Fresh directory created"
                else
                    echo "Deletion cancelled"
                    exit 1
                fi
                ;;
            3)
                echo ""
                echo "✅ Keeping existing directory, new deployment will be timestamped"
                echo "Old deployments will be cleaned up (keeping last 3)"
                ;;
            4)
                echo ""
                echo "Exiting..."
                exit 0
                ;;
            *)
                echo ""
                echo "Invalid option, keeping existing directory (option 3)"
                ;;
        esac
    else
        echo "Directory is empty - ready for first deployment"
    fi
else
    echo "Base directory does not exist"
    echo "Creating base directory..."
    ssh -i ${SSH_KEY} ${TARGET_SERVER} "mkdir -p ${REMOTE_BASE_DIR}"
    echo "✅ Base directory created"
fi

# Verify Docker is installed and running
echo ""
echo "Step 3: Checking Docker installation..."
echo "----------------------------------------"
if ssh -i ${SSH_KEY} ${TARGET_SERVER} "docker --version" &>/dev/null; then
    DOCKER_VERSION=$(ssh -i ${SSH_KEY} ${TARGET_SERVER} "docker --version")
    echo "✅ Docker installed: ${DOCKER_VERSION}"
    
    if ssh -i ${SSH_KEY} ${TARGET_SERVER} "docker ps" &>/dev/null; then
        echo "✅ Docker is running"
    else
        echo "❌ Docker is not running or user doesn't have permissions"
        echo "Run on Stage server: sudo usermod -aG docker ec2-user"
    fi
else
    echo "❌ Docker not installed!"
    echo "Run on Stage server:"
    echo "  sudo dnf install -y docker"
    echo "  sudo systemctl start docker"
    echo "  sudo systemctl enable docker"
    echo "  sudo usermod -aG docker ec2-user"
    exit 1
fi

# Check disk space
echo ""
echo "Step 4: Checking disk space..."
echo "----------------------------------------"
ssh -i ${SSH_KEY} ${TARGET_SERVER} "df -h /"

DISK_USAGE=$(ssh -i ${SSH_KEY} ${TARGET_SERVER} "df / | tail -1 | awk '{print \$5}' | sed 's/%//'")
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "⚠️  WARNING: Disk usage is ${DISK_USAGE}% - Consider cleaning up!"
else
    echo "✅ Disk space OK (${DISK_USAGE}% used)"
fi

# List existing deployments
echo ""
echo "Step 5: Listing existing deployments..."
echo "----------------------------------------"
if ssh -i ${SSH_KEY} ${TARGET_SERVER} "[ -d ${REMOTE_BASE_DIR} ]"; then
    DEPLOYMENT_COUNT=$(ssh -i ${SSH_KEY} ${TARGET_SERVER} "ls -1 ${REMOTE_BASE_DIR} 2>/dev/null | wc -l")
    
    if [ "$DEPLOYMENT_COUNT" -gt 0 ]; then
        echo "Found ${DEPLOYMENT_COUNT} existing deployment(s):"
        ssh -i ${SSH_KEY} ${TARGET_SERVER} "cd ${REMOTE_BASE_DIR} && ls -lht"
    else
        echo "No existing deployments found"
    fi
else
    echo "Base directory does not exist yet"
fi

echo ""
echo "=========================================="
echo "Stage Server Preparation Complete!"
echo "=========================================="
echo ""
echo "✅ Stage server is ready for deployment"
echo ""
echo "Next step: Run ./deploy-stage.sh to deploy"
echo ""
