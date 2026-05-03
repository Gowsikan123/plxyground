# PLXYGROUND — Start all services (PowerShell)

Write-Host ""
Write-Host "=== PLXYGROUND — Starting all services ==="
Write-Host ""

# Setup env files
if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "  Created backend\.env from example"
}
if (-not (Test-Path "frontend\.env")) {
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "  Created frontend\.env from example"
}

# Install dependencies
Write-Host "  Installing backend deps..."
Set-Location backend
npm install --silent
Set-Location ..

Write-Host "  Installing frontend deps..."
Set-Location frontend
npm install --silent
Set-Location ..

Write-Host "  Installing admin-panel deps..."
Set-Location admin-panel
npm install --silent
Set-Location ..

Write-Host ""
Write-Host "  Starting services in separate windows..."
Write-Host ""

$backend  = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -PassThru
$admin    = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd admin-panel; node server.js" -PassThru
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npx expo start" -PassThru

Write-Host "  Backend:      http://localhost:3011"
Write-Host "  Admin Panel:  http://localhost:3012"
Write-Host "  Frontend:     http://localhost:19006 (Expo)"
Write-Host ""
Write-Host "  Close the terminal windows to stop individual services."
Write-Host ""
