#!/bin/bash

# Build and Export Docker Images Script
# This script builds the custom app image and exports all required images for transfer

set -e  # Exit on any error

echo "================================================"
echo "Building and Exporting CIXIO Docker Images"
echo "================================================"

# Step 1: Build the custom app image from docker-compose
echo ""
echo "[1/5] Building custom app image from docker-compose..."
docker-compose build

# Step 2: Pull required base images
echo ""
echo "[2/5] Pulling MongoDB 7.0 image..."
docker pull mongo:7.0

echo ""
echo "[3/5] Pulling Mongo Express image..."
docker pull mongo-express:latest

# Step 3: Create exports directory
echo ""
echo "[4/5] Creating exports directory..."
mkdir -p docker-images-export

# Step 4: Save all images to tar files
echo ""
echo "[5/5] Saving all images to tar files..."
echo "  - Saving cixio-com-app:latest..."
docker save -o docker-images-export/cixio-com-app.tar cixio-com-app:latest

echo "  - Saving mongo:7.0..."
docker save -o docker-images-export/mongo-7.0.tar mongo:7.0

echo "  - Saving mongo-express:latest..."
docker save -o docker-images-export/mongo-express.tar mongo-express:latest

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
