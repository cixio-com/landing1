#!/bin/bash

# Deploy on Stage Server Script
# This script runs on the STAGE SERVER
# It stops existing containers, loads new Docker images, and starts services

set -e  # Exit on any error

echo "=========================================="
echo "Starting Deployment on Stage Server"
echo "=========================================="

# Get the current directory (should be the deployment directory)
DEPLOY_DIR=$(pwd)
EXPORT_DIR="docker-images-export"

echo ""
echo "Current directory: ${DEPLOY_DIR}"
echo ""

# Check if required files exist
if [ ! -f "load-images.sh" ]; then
    echo "ERROR: load-images.sh not found in current directory!"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "ERROR: docker-compose.yml not found in current directory!"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "WARNING: .env file not found in current directory!"
    echo "Make sure environment variables are properly configured."
fi

if [ ! -d "${EXPORT_DIR}" ]; then
    echo "ERROR: ${EXPORT_DIR} directory not found!"
    exit 1
fi

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
echo "Step 4: Loading Docker images from tar.gz files..."
echo "----------------------------------------"
chmod +x load-images.sh
./load-images.sh

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to load Docker images!"
    exit 1
fi

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
