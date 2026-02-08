# Make Deployment Scripts Executable (PowerShell/Windows)
# This script prepares the deployment scripts for use on Linux servers

Write-Host ""
Write-Host "=========================================="
Write-Host "Preparing Deployment Scripts"
Write-Host "=========================================="
Write-Host ""

Write-Host "Note: On Windows, these scripts will be marked for Git as executable." -ForegroundColor Yellow
Write-Host "The actual executable permission will be set when deployed to Linux servers." -ForegroundColor Yellow
Write-Host ""

# Use Git to set executable bit (works on Windows)
$scripts = @(
    "deploy-to-stage.sh",
    "deploy-stage.sh",
    "deploy-production.sh",
    "build-and-export-images.sh",
    "deploy-on-stage.sh",
    "make-scripts-executable.sh",
    "install.sh",
    "redeploy.sh",
    "deploy-to-stage.sh"
)

Write-Host "Setting executable permissions via Git..." -ForegroundColor Cyan
Write-Host ""

foreach ($script in $scripts) {
    if (Test-Path $script) {
        # Use git update-index to set executable bit
        git update-index --chmod=+x $script 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $script" -ForegroundColor Green
        } else {
            Write-Host "  $script (not in git or already set)" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "  $script (file not found)" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Setup Complete!"
Write-Host "=========================================="
Write-Host ""
Write-Host "On Linux/Jump Server, you can run:" -ForegroundColor Cyan
Write-Host "  ./deploy-stage.sh       - Deploy to stage server" -ForegroundColor White
Write-Host "  ./deploy-production.sh  - Deploy to production server" -ForegroundColor White
Write-Host ""
Write-Host "On Windows, use Git Bash or WSL to run these scripts." -ForegroundColor Yellow
Write-Host ""
