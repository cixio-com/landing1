#!/bin/bash

###############################################################################
# CIXIO Installation Script for Linux/Mac
# This script installs and configures the CIXIO application
###############################################################################

set -e

echo ""
echo "================================================================"
echo "       CIXIO - Installation Script (Linux/Mac)"
echo "================================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root"
    exit 1
fi

echo "Step 1: Checking Prerequisites..."
echo "------------------------------------------------------------"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    echo "Please install Node.js 14.x or higher from https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node -v)
    print_success "Node.js $NODE_VERSION detected"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
else
    NPM_VERSION=$(npm -v)
    print_success "npm $NPM_VERSION detected"
fi

# Check MongoDB (optional for local development)
if command -v mongod &> /dev/null; then
    MONGO_VERSION=$(mongod --version | head -n 1)
    print_success "MongoDB detected: $MONGO_VERSION"
else
    print_info "MongoDB not detected locally (you can use MongoDB Atlas)"
fi

echo ""
echo "Step 2: Installing Dependencies..."
echo "------------------------------------------------------------"

if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo ""
echo "Step 3: Setting Up Environment Configuration..."
echo "------------------------------------------------------------"

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_info "Please edit .env file with your configuration"
    else
        print_error ".env.example file not found"
        exit 1
    fi
else
    print_info ".env file already exists (skipping)"
fi

echo ""
echo "Step 4: Configuration Requirements..."
echo "------------------------------------------------------------"
print_info "Before running the application, please configure:"
echo "  1. MongoDB connection string (MONGODB_URI in .env)"
echo "  2. JWT secret key (JWT_SECRET in .env)"
echo "  3. Email service credentials (EMAIL_* variables in .env)"
echo "  4. Frontend URL (FRONTEND_URL in .env)"
echo ""
print_info "Generate a secure JWT secret with:"
echo "  node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
echo ""

echo "Step 5: Verifying Installation..."
echo "------------------------------------------------------------"

# Check if all required directories exist
REQUIRED_DIRS=("src/models" "src/routes" "src/controllers" "src/middleware" "src/utils" "src/emails/templates" "public")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_success "Directory $dir exists"
    else
        print_error "Directory $dir is missing"
        exit 1
    fi
done

echo ""
echo "================================================================"
echo "                   Installation Complete!"
echo "================================================================"
echo ""
echo "Next Steps:"
echo "------------------------------------------------------------"
echo "1. Edit .env file with your configuration:"
echo "   nano .env  (or use your preferred editor)"
echo ""
echo "2. Start MongoDB (if running locally):"
echo "   mongod  (or use your system's service manager)"
echo ""
echo "3. Start the application:"
echo "   npm start         # Production mode"
echo "   npm run dev       # Development mode with auto-reload"
echo ""
echo "4. The API will be available at:"
echo "   http://localhost:3000"
echo ""
echo "5. Access the frontend at:"
echo "   http://localhost:3000  (served by Express)"
echo ""
echo "For more information:"
echo "   - Read START_HERE.txt for quick start"
echo "   - Read GET_STARTED.md for detailed guide"
echo "   - Read DEPLOYMENT.md for production deployment"
echo ""
echo "================================================================"
echo ""
