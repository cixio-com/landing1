#!/bin/bash

# Deploy on Server Script (Stage or Production)
# This script runs on the TARGET SERVER (Stage or Production)
# It stops existing CIXIO containers, loads new Docker images, and starts services

set -e  # Exit on any error

echo "=========================================="
echo "Starting Deployment on Server"
echo "=========================================="

# Get the current directory (should be inside docker-images-export)
DEPLOY_DIR=$(pwd)

echo ""
echo "Current directory: ${DEPLOY_DIR}"
echo ""

# Detect environment from .env file or default to production
DEPLOY_ENV="production"
if [ -f ".env" ]; then
    # Try to read NODE_ENV from .env
    NODE_ENV_VALUE=$(grep -E "^NODE_ENV=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "production")
    if [ ! -z "$NODE_ENV_VALUE" ]; then
        DEPLOY_ENV="$NODE_ENV_VALUE"
    fi
fi

echo "Detected environment: ${DEPLOY_ENV}"

# Determine which docker-compose file to use
COMPOSE_FILE="docker-compose.yml"

if [ "$DEPLOY_ENV" = "staging" ] || [ "$DEPLOY_ENV" = "stage" ]; then
    if [ -f "docker-compose.stage.yml" ]; then
        COMPOSE_FILE="docker-compose.stage.yml"
        echo "Using Stage configuration: ${COMPOSE_FILE}"
    else
        echo "WARNING: docker-compose.stage.yml not found, falling back to docker-compose.yml"
    fi
elif [ "$DEPLOY_ENV" = "production" ] || [ "$DEPLOY_ENV" = "prod" ]; then
    if [ -f "docker-compose.production.yml" ]; then
        COMPOSE_FILE="docker-compose.production.yml"
        echo "Using Production configuration: ${COMPOSE_FILE}"
    else
        echo "WARNING: docker-compose.production.yml not found, falling back to docker-compose.yml"
    fi
fi

# Check if docker-compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "ERROR: ${COMPOSE_FILE} not found in current directory!"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "WARNING: .env file not found in current directory!"
    echo "Make sure environment variables are properly configured."
fi

# Check if tar files exist
TAR_FILES=$(ls *.tar 2>/dev/null | wc -l)
if [ ${TAR_FILES} -eq 0 ]; then
    echo "ERROR: No Docker image tar files found in current directory!"
    exit 1
fi

echo "Found ${TAR_FILES} Docker image tar file(s)"

echo "Step 1: Stopping CIXIO Docker containers (if running)..."
echo "----------------------------------------"
docker stop cixio-com-app 2>/dev/null || echo "cixio-com-app container not running"
if [ "$DEPLOY_ENV" = "production" ] || [ "$DEPLOY_ENV" = "prod" ]; then
    docker stop cixio-com-mongodb 2>/dev/null || echo "cixio-com-mongodb container not running"
fi

echo ""
echo "Step 2: Removing CIXIO Docker containers (if exist)..."
echo "----------------------------------------"
docker rm cixio-com-app 2>/dev/null || echo "cixio-com-app container does not exist"
if [ "$DEPLOY_ENV" = "production" ] || [ "$DEPLOY_ENV" = "prod" ]; then
    docker rm cixio-com-mongodb 2>/dev/null || echo "cixio-com-mongodb container does not exist"
fi

echo ""
echo "Step 3: Removing CIXIO Docker images (if exist)..."
echo "----------------------------------------"
docker rmi cixio-com-app:latest 2>/dev/null || echo "cixio-com-app:latest image does not exist"
if [ "$DEPLOY_ENV" = "production" ] || [ "$DEPLOY_ENV" = "prod" ]; then
    docker rmi cixio-com-mongo:7.0 2>/dev/null || echo "cixio-com-mongo:7.0 image does not exist"
fi

echo ""
echo "Docker status after cleanup:"
echo "CIXIO containers:"
docker ps -a | grep cixio-com || echo "No CIXIO containers found"
echo ""
echo "CIXIO images:"
docker images | grep cixio-com || echo "No CIXIO images found"

echo ""
echo "Step 4: Loading Docker images from tar files..."
echo "----------------------------------------"

if [ ! -f "cixio-com-app.tar" ]; then
    echo "ERROR: cixio-com-app.tar not found in current directory!"
    exit 1
fi

# Count total images to load
TOTAL_IMAGES=1
if [ -f "cixio-com-mongo-7.0.tar" ]; then
    TOTAL_IMAGES=2
fi

echo "[1/${TOTAL_IMAGES}] Loading cixio-com-app:latest..."
docker load -i cixio-com-app.tar

if [ -f "cixio-com-mongo-7.0.tar" ]; then
    echo ""
    echo "[2/${TOTAL_IMAGES}] Loading cixio-com-mongo:7.0..."
    docker load -i cixio-com-mongo-7.0.tar
else
    echo ""
    echo "INFO: MongoDB image not found (Stage uses remote MongoDB at 172.31.33.96)"
fi

echo ""
echo "All Docker images loaded successfully!"

echo ""
echo "Docker images after loading:"
docker images | grep cixio-com

echo ""
echo "Step 5: Starting Docker containers with docker-compose..."
echo "----------------------------------------"
echo "Using compose file: ${COMPOSE_FILE}"
# Use explicit project name to prevent conflicts with other services
docker-compose -f ${COMPOSE_FILE} -p cixio-com up -d

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to start Docker containers!"
    echo "Checking for common issues..."
    echo ""
    
    # Check if external network is missing (common issue)
    if grep -q "external: true" ${COMPOSE_FILE}; then
        echo "WARNING: Compose file uses external network."
        echo "If you see 'network not found' error, the external network may not exist."
        echo ""
        echo "For Stage/Dev servers connecting to remote MongoDB:"
        echo "  - Use docker-compose.stage.yml (no external network)"
        echo "  - Set NODE_ENV=staging in .env"
        echo ""
        echo "For Production servers with local MongoDB:"
        echo "  - Use docker-compose.production.yml"
        echo "  - Ensure 'cixio-shared-db' network exists"
        echo "  - Create network: docker network create cixio-shared-db"
    fi
    
    exit 1
fi

echo ""
echo "Step 6: Verifying deployment..."
echo "----------------------------------------"
echo "Running CIXIO containers:"
docker ps | grep cixio-com

echo ""
echo "Container logs (last 20 lines):"
docker-compose -f ${COMPOSE_FILE} logs --tail=20

echo ""
echo "=========================================="
echo "Deployment on Server COMPLETED!"
echo "=========================================="
echo ""
echo "Environment: ${DEPLOY_ENV}"
echo "Compose file: ${COMPOSE_FILE}"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose -f ${COMPOSE_FILE} logs -f"
echo "  Check status: docker-compose -f ${COMPOSE_FILE} ps"
echo "  Stop services: docker-compose -f ${COMPOSE_FILE} down"
echo "  Restart services: docker-compose -f ${COMPOSE_FILE} restart"
echo "  Check CIXIO containers: docker ps | grep cixio-com"
echo "  Check CIXIO images: docker images | grep cixio-com"
echo ""
