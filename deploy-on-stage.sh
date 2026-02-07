#!/bin/bash

# Deploy on Stage Server Script
# This script runs on the STAGE SERVER
# It stops existing containers, loads new Docker images, and starts services

set -e  # Exit on any error

echo "=========================================="
echo "Starting Deployment on Stage Server"
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

echo "Step 1: Stopping existing Docker containers..."
echo "----------------------------------------"
docker stop $(docker ps -aq) 2>/dev/null || echo "No running containers to stop"

echo ""
echo "Step 2: Removing existing Docker containers..."
echo "----------------------------------------"
docker rm $(docker ps -aq) 2>/dev/null || echo "No containers to remove"

echo ""
echo "Step 3: Removing existing Docker images..."
echo "----------------------------------------"
docker rmi -f $(docker images -aq) 2>/dev/null || echo "No images to remove"

echo ""
echo "Docker status after cleanup:"
docker images -a
docker ps -a

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
docker images -a

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
echo "Running containers:"
docker ps

echo ""
echo "Container logs (last 20 lines):"
docker-compose logs --tail=20

echo ""
echo "=========================================="
echo "Deployment on Stage Server COMPLETED!"
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Check status: docker-compose ps"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
echo ""
