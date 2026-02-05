# Delete User from MongoDB by Email
# Usage: .\delete-user.ps1 -Email "user@example.com"

param(
    [Parameter(Mandatory=$true, HelpMessage="Email address of the user to delete")]
    [string]$Email,
    
    [Parameter(Mandatory=$false, HelpMessage="Also delete from newsletter and contacts")]
    [switch]$DeleteAll
)

# MongoDB connection details
$MongoContainer = "cixio-com-mongodb"
$MongoUser = "admin"
$MongoPass = "changeme123"
$Database = "cixio"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Delete User from MongoDB" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Find Docker executable
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    # Try common Docker installation paths
    $dockerPaths = @(
        "C:\Program Files\Docker\Docker\resources\bin\docker.exe",
        "C:\Program Files\Docker\Docker\resources\docker.exe",
        "$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe",
        "$env:LOCALAPPDATA\Programs\Docker\Docker\resources\bin\docker.exe"
    )
    
    foreach ($path in $dockerPaths) {
        if (Test-Path $path) {
            $dockerCmd = $path
            break
        }
    }
    
    if (-not $dockerCmd) {
        Write-Host "❌ Error: Docker not found!" -ForegroundColor Red
        Write-Host "   Please make sure Docker Desktop is installed and running." -ForegroundColor Yellow
        Write-Host "   Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        exit 1
    }
} else {
    $dockerCmd = "docker"
}

Write-Host "Using Docker: $dockerCmd" -ForegroundColor DarkGray

# Check if container is running
Write-Host "Checking MongoDB container..." -ForegroundColor Yellow
$containerRunning = & $dockerCmd ps --filter "name=$MongoContainer" --format "{{.Names}}"

if ($containerRunning -ne $MongoContainer) {
    Write-Host "❌ Error: MongoDB container '$MongoContainer' is not running!" -ForegroundColor Red
    Write-Host "   Start it with: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ MongoDB container is running`n" -ForegroundColor Green

# First, check if user exists
Write-Host "Searching for user: $Email" -ForegroundColor Yellow
$findCommand = "db.getSiblingDB('$Database').users.findOne({ email: '$Email' }, { email: 1, firstName: 1, lastName: 1, isEmailVerified: 1 })"
$userExists = & $dockerCmd exec -i $MongoContainer mongosh -u $MongoUser -p $MongoPass --authenticationDatabase admin --quiet --eval $findCommand

if ($userExists -match "null") {
    Write-Host "❌ User not found with email: $Email" -ForegroundColor Red
    Write-Host "`nTrying case-insensitive search..." -ForegroundColor Yellow
    
    $findCaseInsensitive = "db.getSiblingDB('$Database').users.findOne({ email: { `$regex: '$Email', `$options: 'i' } }, { email: 1 })"
    $userExistsCaseInsensitive = & $dockerCmd exec -i $MongoContainer mongosh -u $MongoUser -p $MongoPass --authenticationDatabase admin --quiet --eval $findCaseInsensitive
    
    if ($userExistsCaseInsensitive -match "null") {
        Write-Host "❌ No user found with that email (case-insensitive search)" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "Found user (different case):" -ForegroundColor Green
        Write-Host $userExistsCaseInsensitive
    }
} else {
    Write-Host "✅ User found:" -ForegroundColor Green
    Write-Host $userExists
}

Write-Host "`n⚠️  Are you sure you want to delete this user?" -ForegroundColor Yellow
$confirmation = Read-Host "Type 'yes' to confirm"

if ($confirmation -ne "yes") {
    Write-Host "❌ Deletion cancelled." -ForegroundColor Red
    exit 0
}

Write-Host "`nDeleting user from users collection..." -ForegroundColor Yellow
$deleteCommand = "db.getSiblingDB('$Database').users.deleteOne({ email: '$Email' })"
$result = & $dockerCmd exec -i $MongoContainer mongosh -u $MongoUser -p $MongoPass --authenticationDatabase admin --quiet --eval $deleteCommand

if ($result -match "deletedCount: 1") {
    Write-Host "✅ User deleted successfully from users collection" -ForegroundColor Green
} else {
    Write-Host "⚠️  User may not have been deleted. Result:" -ForegroundColor Yellow
    Write-Host $result
}

# Delete from other collections if requested
if ($DeleteAll) {
    Write-Host "`nDeleting from newsletter collection..." -ForegroundColor Yellow
    $deleteNewsletter = "db.getSiblingDB('$Database').newsletters.deleteOne({ email: '$Email' })"
    & $dockerCmd exec -i $MongoContainer mongosh -u $MongoUser -p $MongoPass --authenticationDatabase admin --quiet --eval $deleteNewsletter | Out-Null
    Write-Host "✅ Checked newsletter collection" -ForegroundColor Green
    
    Write-Host "Deleting from contacts collection..." -ForegroundColor Yellow
    $deleteContact = "db.getSiblingDB('$Database').contacts.deleteOne({ email: '$Email' })"
    & $dockerCmd exec -i $MongoContainer mongosh -u $MongoUser -p $MongoPass --authenticationDatabase admin --quiet --eval $deleteContact | Out-Null
    Write-Host "✅ Checked contacts collection" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Deletion Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "You can now register again with: $Email" -ForegroundColor Cyan
Write-Host ""
