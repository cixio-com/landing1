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

# Check if required files exist
if [ ! -f "docker-compose.yml" ]; then
    echo "ERROR: docker-compose.yml not found in current directory!"
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
docker stop cixio-com-mongodb 2>/dev/null || echo "cixio-com-mongodb container not running"

echo ""
echo "Step 2: Removing CIXIO Docker containers (if exist)..."
echo "----------------------------------------"
docker rm cixio-com-app 2>/dev/null || echo "cixio-com-app container does not exist"
docker rm cixio-com-mongodb 2>/dev/null || echo "cixio-com-mongodb container does not exist"

echo ""
echo "Step 3: Removing CIXIO Docker images (if exist)..."
echo "----------------------------------------"
docker rmi cixio-com-app:latest 2>/dev/null || echo "cixio-com-app:latest image does not exist"
docker rmi cixio-com-mongo:7.0 2>/dev/null || echo "cixio-com-mongo:7.0 image does not exist"

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

echo "[1/2] Loading cixio-com-app:latest..."
docker load -i cixio-com-app.tar

echo ""
echo "[2/2] Loading cixio-com-mongo:7.0..."
docker load -i cixio-com-mongo-7.0.tar

echo ""
echo "All Docker images loaded successfully!"

echo ""
echo "Docker images after loading:"
docker images | grep cixio-com

echo ""
echo "Step 5: Starting Docker containers with docker-compose..."
echo "----------------------------------------"
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to start Docker containers!"
    exit 1
fi

echo ""
echo "Step 6: Verifying deployment..."
echo "----------------------------------------"
echo "Running CIXIO containers:"
docker ps | grep cixio-com

echo ""
echo "Container logs (last 20 lines):"
docker-compose logs --tail=20

echo ""
echo "=========================================="
echo "Deployment on Server COMPLETED!"
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Check status: docker-compose ps"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
echo "  Check CIXIO containers: docker ps | grep cixio-com"
echo "  Check CIXIO images: docker images | grep cixio-com"
echo ""
