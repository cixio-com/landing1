#!/bin/bash

# Simple Redeployment Script for CIXIO Application
# Performs 4 steps: stop containers, fetch, pull, rebuild and start

set -e

echo "========================================"
echo "   CIXIO Application Redeployment"
echo "========================================"
echo ""

# Step 1: Stop containers
echo "Step 1/4: Stopping Docker containers..."
docker-compose down
echo "✓ Containers stopped"
echo ""

# Step 2: Fetch from Git
echo "Step 2/4: Fetching from Git..."
git fetch
echo "✓ Fetch completed"
echo ""

# Step 3: Pull latest code
echo "Step 3/4: Pulling latest code..."
git pull
echo "✓ Pull completed"
echo ""

# Step 4: Build and start containers
echo "Step 4/4: Building and starting containers..."
docker-compose up -d --build
echo "✓ Containers started"
echo ""

echo "========================================"
echo "✅ Redeployment completed successfully!"
echo "========================================"
echo ""

# Show container status
echo "Container Status:"
docker-compose ps
