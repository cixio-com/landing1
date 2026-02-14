#!/bin/bash

# Build and Export Docker Images Script
# This script builds the custom app image and exports all required images for transfer

set -e  # Exit on any error

echo "================================================"
echo "Building and Exporting CIXIO Docker Images"
echo "================================================"

# Step 1: Build the custom app image from docker-compose
echo ""
echo "[1/4] Building custom app image from docker-compose..."
docker-compose build

# Step 2: Check if MongoDB image is needed (only for Production)
DEPLOY_TARGET="${DEPLOY_TARGET:-production}"
if [ "$DEPLOY_TARGET" = "production" ]; then
    echo ""
    echo "[2/4] Pulling MongoDB 7.0 image (Production deployment)..."
    docker pull mongo:7.0
    docker tag mongo:7.0 cixio-com-mongo:7.0
else
    echo ""
    echo "[2/4] Skipping MongoDB image (Stage uses remote MongoDB at 172.31.33.96)..."
fi

# Step 3: Create exports directory
echo ""
echo "[3/4] Creating exports directory..."
mkdir -p docker-images-export

# Step 4: Save all images to tar files
echo ""
echo "[4/4] Saving images to tar files..."
echo "  - Saving cixio-com-app:latest..."
docker save -o docker-images-export/cixio-com-app.tar cixio-com-app:latest

if [ "$DEPLOY_TARGET" = "production" ]; then
    echo "  - Saving cixio-com-mongo:7.0 (Production only)..."
    docker save -o docker-images-export/cixio-com-mongo-7.0.tar cixio-com-mongo:7.0
else
    echo "  - Skipping MongoDB export (Stage uses remote MongoDB)"
fi

# Display file sizes
echo ""
echo "================================================"
echo "Build and Export Complete!"
echo "================================================"
echo ""
echo "Exported images:"
ls -lh docker-images-export/

echo ""
echo "Total size:"
du -sh docker-images-export/

echo ""
echo "================================================"
echo "Next Steps:"
echo "================================================"
echo "1. Copy the entire 'docker-images-export' folder to your destination machine"
echo "2. Also copy: docker-compose.yml, .env file, and uploads folder (if needed)"
echo "3. On the destination machine, run: ./load-images.sh"
echo "4. Then run: docker-compose up -d"
echo ""
