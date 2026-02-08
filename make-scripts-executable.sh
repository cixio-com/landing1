#!/bin/bash

# Make Deployment Scripts Executable
# Run this script once to set executable permissions on all deployment scripts

echo "Setting executable permissions on deployment scripts..."
echo ""

chmod +x deploy-to-stage.sh
echo "✓ deploy-to-stage.sh"

chmod +x deploy-stage.sh
echo "✓ deploy-stage.sh"

chmod +x deploy-production.sh
echo "✓ deploy-production.sh"

chmod +x build-and-export-images.sh
echo "✓ build-and-export-images.sh"

chmod +x deploy-on-stage.sh
echo "✓ deploy-on-stage.sh"

# Optional: Other shell scripts if they exist
if [ -f "install.sh" ]; then
    chmod +x install.sh
    echo "✓ install.sh"
fi

if [ -f "redeploy.sh" ]; then
    chmod +x redeploy.sh
    echo "✓ redeploy.sh"
fi

if [ -f "deploy-to-stage.sh" ]; then
    chmod +x deploy-to-stage.sh
    echo "✓ deploy-to-stage.sh"
fi

echo ""
echo "All deployment scripts are now executable!"
echo ""
echo "You can now run:"
echo "  ./deploy-stage.sh       - Deploy to stage server"
echo "  ./deploy-production.sh  - Deploy to production server"
echo ""
