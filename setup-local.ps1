# Setup Local Development Environment
# This script helps you run the application locally without Docker

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   CIXIO - Local Development Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ npm installed: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm is not installed!" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
Write-Host "`nChecking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Dependencies not installed. Installing now..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

# Check MongoDB options
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Database Configuration" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Choose your MongoDB option:" -ForegroundColor Yellow
Write-Host "1. Use MongoDB Atlas (Cloud - Recommended)" -ForegroundColor White
Write-Host "2. Install MongoDB locally" -ForegroundColor White
Write-Host "3. Use existing Docker MongoDB" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`n📋 MongoDB Atlas Setup:" -ForegroundColor Cyan
        Write-Host "1. Go to https://www.mongodb.com/cloud/atlas" -ForegroundColor White
        Write-Host "2. Sign up for a free account" -ForegroundColor White
        Write-Host "3. Create a free cluster (M0)" -ForegroundColor White
        Write-Host "4. Get your connection string" -ForegroundColor White
        Write-Host "5. Update .env file with your connection string" -ForegroundColor White
        Write-Host ""
        Write-Host "Example:" -ForegroundColor Yellow
        Write-Host "MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cixio?retryWrites=true&w=majority" -ForegroundColor DarkGray
        Write-Host ""
        $mongoUri = Read-Host "Enter your MongoDB Atlas connection string (or press Enter to skip)"
        if ($mongoUri) {
            # Update .env file
            $envContent = Get-Content .env
            $envContent = $envContent -replace 'MONGODB_URI=.*', "MONGODB_URI=$mongoUri"
            $envContent | Set-Content .env
            Write-Host "✅ .env file updated with MongoDB Atlas connection" -ForegroundColor Green
        }
    }
    "2" {
        Write-Host "`n📋 Install MongoDB Community Edition:" -ForegroundColor Cyan
        Write-Host "1. Download: https://www.mongodb.com/try/download/community" -ForegroundColor White
        Write-Host "2. Run the installer" -ForegroundColor White
        Write-Host "3. MongoDB will run on: mongodb://localhost:27017" -ForegroundColor White
        Write-Host ""
        Write-Host "After installation, update .env file:" -ForegroundColor Yellow
        Write-Host "MONGODB_URI=mongodb://localhost:27017/cixio" -ForegroundColor DarkGray
        Write-Host ""
        $continue = Read-Host "Press Enter to continue after installing MongoDB..."
        
        # Update .env file for local MongoDB
        $envContent = Get-Content .env
        $envContent = $envContent -replace 'MONGODB_URI=.*', "MONGODB_URI=mongodb://localhost:27017/cixio"
        $envContent | Set-Content .env
        Write-Host "✅ .env file updated for local MongoDB" -ForegroundColor Green
    }
    "3" {
        Write-Host "`n📋 Using Docker MongoDB:" -ForegroundColor Cyan
        Write-Host "Make sure Docker containers are running:" -ForegroundColor White
        Write-Host "docker-compose up -d mongo" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "Current .env uses Docker connection string" -ForegroundColor Yellow
        Write-Host "MONGODB_URI=mongodb://admin:changeme123@localhost:27017/cixio?authSource=admin" -ForegroundColor DarkGray
        Write-Host ""
        
        # Update .env file for Docker MongoDB accessible from localhost
        $envContent = Get-Content .env
        $envContent = $envContent -replace 'MONGODB_URI=.*', "MONGODB_URI=mongodb://admin:changeme123@localhost:27017/cixio?authSource=admin"
        $envContent | Set-Content .env
        Write-Host "✅ .env file updated for Docker MongoDB" -ForegroundColor Green
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

# Check .env file
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Environment Configuration" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    
    # Show current configuration
    $envContent = Get-Content .env
    $port = ($envContent | Select-String "^PORT=").ToString() -replace "PORT=", ""
    $nodeEnv = ($envContent | Select-String "^NODE_ENV=").ToString() -replace "NODE_ENV=", ""
    $mongoUri = ($envContent | Select-String "^MONGODB_URI=").ToString() -replace "MONGODB_URI=", ""
    $emailHost = ($envContent | Select-String "^EMAIL_HOST=").ToString() -replace "EMAIL_HOST=", ""
    
    Write-Host "Configuration:" -ForegroundColor Cyan
    Write-Host "  PORT: $port" -ForegroundColor White
    Write-Host "  NODE_ENV: $nodeEnv" -ForegroundColor White
    Write-Host "  MONGODB_URI: $($mongoUri.Substring(0, [Math]::Min(50, $mongoUri.Length)))..." -ForegroundColor White
    Write-Host "  EMAIL_HOST: $emailHost" -ForegroundColor White
} else {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "   Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Ready to Start!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "To start the application, run:" -ForegroundColor Yellow
Write-Host "  npm start" -ForegroundColor White
Write-Host "or" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "The application will be available at:" -ForegroundColor Yellow
Write-Host "  http://localhost:$port" -ForegroundColor Cyan
Write-Host ""
Write-Host "To test email functionality:" -ForegroundColor Yellow
Write-Host "  http://localhost:$port/api/test-email/config" -ForegroundColor Cyan
Write-Host ""
