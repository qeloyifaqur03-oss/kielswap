# PowerShell script to clean .next directory and fix EINVAL errors
# Run this from the project root directory

Write-Host "Cleaning .next directory..." -ForegroundColor Yellow

# Stop any running Node processes (optional, but helps avoid locks)
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Stopping Node processes..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Delete .next directory
if (Test-Path .next) {
    try {
        Remove-Item -Recurse -Force .next -ErrorAction Stop
        Write-Host "✓ .next directory deleted successfully" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Error deleting .next: $_" -ForegroundColor Red
        Write-Host "Try closing all editors and terminals, then run this script again." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✓ .next directory does not exist (already clean)" -ForegroundColor Green
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run dev" -ForegroundColor White
Write-Host "2. If errors persist, restart your IDE/editor" -ForegroundColor White
