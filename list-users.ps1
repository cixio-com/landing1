# List All Users in MongoDB
# Usage: .\list-users.ps1

param(
    [Parameter(Mandatory=$false, HelpMessage="Filter by email pattern")]
    [string]$EmailFilter = "",
    
    [Parameter(Mandatory=$false, HelpMessage="Show only unverified users")]
    [switch]$UnverifiedOnly,
    
    [Parameter(Mandatory=$false, HelpMessage="Limit number of results")]
    [int]$Limit = 0
)

# MongoDB connection details
$MongoContainer = "cixio-com-mongodb"
$MongoUser = "admin"
$MongoPass = "changeme123"
$Database = "cixio"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   List Users in MongoDB" -ForegroundColor Cyan
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
$containerRunning = & $dockerCmd ps --filter "name=$MongoContainer" --format "{{.Names}}"

if ($containerRunning -ne $MongoContainer) {
    Write-Host "❌ Error: MongoDB container '$MongoContainer' is not running!" -ForegroundColor Red
    Write-Host "   Start it with: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ MongoDB container is running`n" -ForegroundColor Green

# Build query
$query = "{}"
if ($EmailFilter) {
    $query = "{ email: { `$regex: '$EmailFilter', `$options: 'i' } }"
}
if ($UnverifiedOnly) {
    $query = "{ isEmailVerified: false }"
}

# Build limit
$limitQuery = ""
if ($Limit -gt 0) {
    $limitQuery = ".limit($Limit)"
}

# Get total count
Write-Host "Counting users..." -ForegroundColor Yellow
$countCommand = "db.getSiblingDB('$Database').users.countDocuments($query)"
$totalCount = & $dockerCmd exec -i $MongoContainer mongosh -u $MongoUser -p $MongoPass --authenticationDatabase admin --quiet --eval $countCommand

Write-Host "Total users found: $totalCount`n" -ForegroundColor Cyan

# List users
Write-Host "Fetching user details...`n" -ForegroundColor Yellow
$listCommand = "db.getSiblingDB('$Database').users.find($query, { email: 1, firstName: 1, lastName: 1, isEmailVerified: 1, createdAt: 1 }).sort({ createdAt: -1 })$limitQuery.forEach(u => print(JSON.stringify(u)))"
$users = & $dockerCmd exec -i $MongoContainer mongosh -u $MongoUser -p $MongoPass --authenticationDatabase admin --quiet --eval $listCommand

if ($users) {
    $users -split "`n" | Where-Object { $_ -match '\{' } | ForEach-Object {
        $user = $_ | ConvertFrom-Json
        $verified = if ($user.isEmailVerified) { "✅" } else { "❌" }
        $created = if ($user.createdAt) { 
            $date = [DateTime]$user.createdAt.'$date'
            $date.ToString("yyyy-MM-dd HH:mm")
        } else { 
            "N/A" 
        }
        
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host "Email:    " -NoNewline -ForegroundColor Yellow
        Write-Host $user.email -ForegroundColor White
        Write-Host "Name:     " -NoNewline -ForegroundColor Yellow
        Write-Host "$($user.firstName) $($user.lastName)" -ForegroundColor White
        Write-Host "Verified: " -NoNewline -ForegroundColor Yellow
        Write-Host "$verified $($user.isEmailVerified)" -ForegroundColor White
        Write-Host "Created:  " -NoNewline -ForegroundColor Yellow
        Write-Host $created -ForegroundColor White
        Write-Host "ID:       " -NoNewline -ForegroundColor Yellow
        Write-Host $user._id.'$oid' -ForegroundColor DarkGray
    }
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor DarkGray
} else {
    Write-Host "No users found matching criteria.`n" -ForegroundColor Yellow
}

# Show statistics
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Statistics:" -ForegroundColor Cyan
Write-Host "  Total Users: $totalCount" -ForegroundColor White

# Get verified count
$verifiedCommand = "db.getSiblingDB('$Database').users.countDocuments({ isEmailVerified: true })"
$verifiedCount = & $dockerCmd exec -i $MongoContainer mongosh -u $MongoUser -p $MongoPass --authenticationDatabase admin --quiet --eval $verifiedCommand
Write-Host "  Verified:    $verifiedCount" -ForegroundColor Green

# Get unverified count
$unverifiedCommand = "db.getSiblingDB('$Database').users.countDocuments({ isEmailVerified: false })"
$unverifiedCount = & $dockerCmd exec -i $MongoContainer mongosh -u $MongoUser -p $MongoPass --authenticationDatabase admin --quiet --eval $unverifiedCommand
Write-Host "  Unverified:  $unverifiedCount" -ForegroundColor Red

Write-Host "========================================`n" -ForegroundColor Cyan
