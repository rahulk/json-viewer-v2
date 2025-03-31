Write-Host "Starting JSON Viewer application..." -ForegroundColor Green

# Get the script's directory path
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start server in the background
Write-Host "Starting Node.js server..." -ForegroundColor Cyan
$serverPath = Join-Path $scriptPath "server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$serverPath'; npm start"

# Give the server a moment to start
Start-Sleep -Seconds 2

# Start React app in the foreground
Write-Host "Starting React application..." -ForegroundColor Cyan
Set-Location -Path $scriptPath
npm start

# Note: The script will keep running until you close the React process (Ctrl+C) 