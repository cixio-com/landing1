#!/bin/bash

# Convenience script to deploy to STAGE server
# This sets DEPLOY_TARGET=stage and runs the main deployment script

export DEPLOY_TARGET=stage

echo "=========================================="
echo "Deploying to STAGE Server"
echo "=========================================="
echo ""

# Run the main deployment script
./deploy.sh
