$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[PLXYGROUND] Starting all services..." -ForegroundColor Cyan

# Backend
$backendPath = Join-Path $Root "backend"
if (-not (Test-Path (Join-Path $backendPath "node_modules"))) {
  Write-Host "[backend] Installing dependencies..." -ForegroundColor Yellow
  Push-Location $backendPath
  npm install
  Pop-Location
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run start" -WindowStyle Normal
Write-Host "[backend] Window opened → http://localhost:3011" -ForegroundColor Green

# Admin panel
$adminPath = Join-Path $Root "admin-panel"
if (-not (Test-Path (Join-Path $adminPath "node_modules"))) {
  Write-Host "[admin-panel] Installing dependencies..." -ForegroundColor Yellow
  Push-Location $adminPath
  npm install
  Pop-Location
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$adminPath'; npm run start" -WindowStyle Normal
Write-Host "[admin-panel] Window opened → http://localhost:3012" -ForegroundColor Green

# Frontend
$frontendPath = Join-Path $Root "frontend"
if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
  Write-Host "[frontend] Installing dependencies..." -ForegroundColor Yellow
  Push-Location $frontendPath
  npm install
  Pop-Location
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run start" -WindowStyle Normal
Write-Host "[frontend] Window opened → http://localhost:19006" -ForegroundColor Green

Write-Host ""
Write-Host "All three service windows launched." -ForegroundColor Cyan
