#!/bin/zsh
# Mac/Linux equivalent of setup-local.ps1
# Sets up CIXIO.COM local development environment

echo "================================"
echo " CIXIO.COM - Local Setup"
echo "================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Check prerequisites
echo "Checking prerequisites..."
echo ""

# Check Node.js
if command -v node &>/dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js not found! Install: brew install node"
    exit 1
fi

# Check npm
if command -v npm &>/dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm not found!"
    exit 1
fi

echo ""

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""

# MongoDB setup
echo "=== MongoDB Configuration ==="
echo ""
echo "Choose MongoDB option:"
echo "  1) MongoDB Atlas (cloud - recommended)"
echo "  2) Local MongoDB"
echo "  3) Docker MongoDB"
echo ""
read "CHOICE?Select (1/2/3): "

case "$CHOICE" in
    1)
        echo ""
        read "ATLAS_URI?Enter your MongoDB Atlas URI: "
        MONGO_URI="$ATLAS_URI"
        ;;
    2)
        MONGO_URI="mongodb://localhost:27017/cixio_com"
        if nc -z localhost 27017 2>/dev/null; then
            echo "✅ Local MongoDB is running"
        else
            echo "⚠️  MongoDB not running on port 27017"
            echo "   Start: brew services start mongodb-community"
        fi
        ;;
    3)
        MONGO_URI="mongodb://localhost:27017/cixio_com"
        echo "Starting MongoDB via Docker..."
        docker run -d --name cixio-mongo -p 27017:27017 mongo:7 2>/dev/null || echo "Container may already exist"
        ;;
    *)
        MONGO_URI="mongodb://localhost:27017/cixio_com"
        ;;
esac

# Create/update .env file
if [ ! -f ".env" ]; then
    cat > .env << EOF
MONGODB_URI=$MONGO_URI
NODE_ENV=development
PORT=3000
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "================================"
echo " Setup Complete!"
echo "================================"
echo ""
echo "To start the app:"
echo "  npm run dev"
echo ""
echo "App URL: http://localhost:3000"
