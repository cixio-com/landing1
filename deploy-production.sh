#!/bin/bash

# Convenience script to deploy to PRODUCTION server
# This sets DEPLOY_TARGET=production and runs the main deployment script

export DEPLOY_TARGET=production

echo "=========================================="
echo "Deploying to PRODUCTION Server"
echo "=========================================="
echo ""
echo "⚠️  WARNING: You are deploying to PRODUCTION!"
echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
echo ""

# 5 second delay for safety
for i in 5 4 3 2 1; do
    echo "Continuing in $i..."
    sleep 1
done

echo ""
echo "Proceeding with PRODUCTION deployment..."
echo ""

# Run the main deployment script
./deploy-to-stage.sh
