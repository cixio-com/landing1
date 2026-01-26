@echo off
REM ============================================================================
REM CIXIO Installation Script for Windows
REM This script installs and configures the CIXIO application
REM ============================================================================

cls
echo.
echo ================================================================
echo        CIXIO - Installation Script (Windows)
echo ================================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js 14.x or higher from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [OK] Node.js detected
    node -v
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
) else (
    echo [OK] npm detected
    npm -v
)

echo.
echo Step 1: Installing Dependencies...
echo ----------------------------------------------------------------
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed successfully

echo.
echo Step 2: Setting Up Environment Configuration...
echo ----------------------------------------------------------------
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo [OK] Created .env file from .env.example
        echo [INFO] Please edit .env file with your configuration
    ) else (
        echo [ERROR] .env.example file not found
        pause
        exit /b 1
    )
) else (
    echo [INFO] .env file already exists (skipping)
)

echo.
echo Step 3: Configuration Requirements...
echo ----------------------------------------------------------------
echo [INFO] Before running the application, please configure:
echo   1. MongoDB connection string (MONGODB_URI in .env)
echo   2. JWT secret key (JWT_SECRET in .env)
echo   3. Email service credentials (EMAIL_* variables in .env)
echo   4. Frontend URL (FRONTEND_URL in .env)
echo.
echo [INFO] Generate a secure JWT secret with:
echo   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
echo.

echo.
echo ================================================================
echo                   Installation Complete!
echo ================================================================
echo.
echo Next Steps:
echo ----------------------------------------------------------------
echo 1. Edit .env file with your configuration:
echo    notepad .env  (or use your preferred editor)
echo.
echo 2. Start MongoDB (if running locally):
echo    mongod  (or use MongoDB service)
echo.
echo 3. Start the application:
echo    npm start         # Production mode
echo    npm run dev       # Development mode with auto-reload
echo.
echo 4. The API will be available at:
echo    http://localhost:3000
echo.
echo 5. Access the frontend at:
echo    http://localhost:3000  (served by Express)
echo.
echo For more information:
echo    - Read START_HERE.txt for quick start
echo    - Read GET_STARTED.md for detailed guide
echo    - Read DEPLOYMENT.md for production deployment
echo.
echo ================================================================
echo.
pause
