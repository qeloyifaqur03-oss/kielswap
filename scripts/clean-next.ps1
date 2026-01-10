# PowerShell script to clean .next directory on Windows
# Fixes symlink issues with OneDrive

Write-Host "Stopping Node.js processes..."
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Removing .next directory..."
if (Test-Path .next) {
    $deleted = $false
    
    # Try standard deletion first
    try {
        Remove-Item -Recurse -Force .next -ErrorAction Stop
        Write-Host ".next directory deleted successfully"
        $deleted = $true
    } catch {
        Write-Host "Standard deletion failed, trying aggressive cleanup..."
    }
    
    # If standard deletion failed, try aggressive cleanup
    if (-not $deleted) {
        # More aggressive cleanup - delete files individually first
        Get-ChildItem -Path .next -Recurse -Force -ErrorAction SilentlyContinue | 
            ForEach-Object {
                try {
                    $_.Attributes = 'Normal'
                    Remove-Item $_.FullName -Force -Recurse -ErrorAction SilentlyContinue
                } catch {
                    # Ignore errors for individual items
                }
            }
        
        # Try PowerShell removal again
        try {
            Remove-Item -Force -Recurse .next -ErrorAction SilentlyContinue
            $deleted = $true
        } catch {
            # Ignore errors
        }
        
        # Try CMD rmdir as fallback (handles symlinks better on Windows)
        if (-not $deleted) {
            try {
                $null = cmd /c "rmdir /s /q .next" 2>&1
                $deleted = $true
            } catch {
                # Ignore errors
            }
        }
        
        # Final check
        if (-not (Test-Path .next)) {
            Write-Host ".next directory deleted successfully (aggressive cleanup)"
        } else {
            Write-Host "Warning: Some files may still exist in .next"
            Write-Host "  You may need to manually delete the .next folder"
        }
    }
} else {
    Write-Host ".next directory does not exist"
}

Write-Host ""
Write-Host "Cleanup completed. You can now run 'npm run dev'"
