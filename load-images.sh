#!/bin/bash

# Load Docker Images Script
# This script loads all exported Docker images on the destination machine

set -e  # Exit on any error

echo "================================================"
echo "Loading CIXIO Docker Images"
echo "================================================"

# Check if docker-images-export directory exists
if [ ! -d "docker-images-export" ]; then
    echo "Error: docker-images-export directory not found!"
    echo "Please make sure you copied the exported images folder to this location."
    exit 1
fi

# Load all images
echo ""
echo "[1/3] Loading cixio-com-app:latest..."
docker load -i docker-images-export/cixio-com-app.tar

echo ""
echo "[2/3] Loading mongo:7.0..."
docker load -i docker-images-export/mongo-7.0.tar

echo ""
echo "[3/3] Loading mongo-express:latest..."
docker load -i docker-images-export/mongo-express.tar

# Verify loaded images
echo ""
echo "================================================"
echo "Images Loaded Successfully!"
echo "================================================"
echo ""
echo "Loaded images:"
docker images | grep -E "cixio-com-app|mongo.*7.0|mongo-express"

echo ""
echo "================================================"
echo "Next Steps:"
echo "================================================"
echo "1. Make sure you have the .env file in the current directory"
echo "2. Run: docker-compose up -d"
echo "3. Check status: docker-compose ps"
echo "4. View logs: docker-compose logs -f"
echo ""
