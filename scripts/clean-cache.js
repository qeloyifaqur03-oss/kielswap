// Cross-platform cache cleaning script
// Handles Windows/OneDrive file locking issues
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function deleteRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  // On Windows, try using native commands first for better handling of locked files
  if (process.platform === 'win32') {
    try {
      // Try using rmdir command which handles locked files better on Windows
      execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'ignore', timeout: 5000 });
      return;
    } catch (e) {
      // Fall through to manual deletion if rmdir fails
    }
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      try {
        if (entry.isDirectory()) {
          deleteRecursive(fullPath);
          // Try multiple methods to delete directory
          try {
            fs.rmSync(fullPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
          } catch (e) {
            try {
              fs.rmdirSync(fullPath, { recursive: true, maxRetries: 3 });
            } catch (e2) {
              // Ignore if still can't delete
            }
          }
        } else {
          // Try to make file writable before deleting
          try {
            fs.chmodSync(fullPath, 0o666);
          } catch (e) {
            // Ignore chmod errors
          }
          // Try multiple times with retries
          let deleted = false;
          for (let i = 0; i < 3 && !deleted; i++) {
            try {
              fs.unlinkSync(fullPath);
              deleted = true;
            } catch (e) {
              if (i < 2) {
                // Wait a bit before retrying
                try {
                  require('child_process').execSync('timeout /t 0.1 /nobreak >nul 2>&1', { stdio: 'ignore' });
                } catch (e2) {
                  // Ignore timeout errors
                }
              }
            }
          }
        }
      } catch (e) {
        // Ignore individual file/directory errors and continue
        // Don't log warnings to keep output clean
      }
    }
    
    // Try to remove the directory itself with multiple methods
    try {
      fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } catch (e) {
      try {
        fs.rmdirSync(dirPath, { recursive: true, maxRetries: 3 });
      } catch (e2) {
        // Ignore if directory still exists - it will be cleaned on next run
      }
    }
  } catch (e) {
    // Ignore read errors - directory might be locked
  }
}

const dirsToClean = ['.next', 'node_modules/.cache'];

console.log('Cleaning cache...');

for (const dir of dirsToClean) {
  const fullPath = path.resolve(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    console.log(`Removing ${dir}...`);
    deleteRecursive(fullPath);
  }
}

console.log('Cache cleaned successfully!');
