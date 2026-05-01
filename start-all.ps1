Write-Host "🚀 Starting PLXYGROUND (Windows PowerShell)..."

function Start-ServiceProcess($cwd, $command, $args) {
  Push-Location $cwd
  Start-Process -FilePath $command -ArgumentList $args -NoNewWindow -PassThru | Out-Null
  Pop-Location
}

# Backend
Write-Host "Starting backend..."
Start-ServiceProcess "c:\plxyground\backend" "npm" "install"
Start-ServiceProcess "c:\plxyground\backend" "node" "src/index.js"

# Admin panel
Write-Host "Starting admin panel..."
Start-ServiceProcess "c:\plxyground\admin-panel" "npm" "install"
Start-ServiceProcess "c:\plxyground\admin-panel" "node" "server.js"

# Frontend
Write-Host "Starting frontend..."
Start-ServiceProcess "c:\plxyground\frontend" "npm" "install"
Start-ServiceProcess "c:\plxyground\frontend" "npx" "expo start --web --port 19006"

Start-Sleep -Seconds 8

Write-Host "🔍 Health checks..."
$backend = Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3011/healthz -ErrorAction SilentlyContinue
if ($backend -and $backend.StatusCode -eq 200) { Write-Host "✅ Backend healthy" } else { Write-Host "❌ Backend not healthy" }

$admin = Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3012 -ErrorAction SilentlyContinue
if ($admin -and $admin.StatusCode -eq 200) { Write-Host "✅ Admin panel healthy" } else { Write-Host "❌ Admin panel not healthy" }

$frontend = Invoke-WebRequest -UseBasicParsing -Uri http://localhost:19006 -ErrorAction SilentlyContinue
if ($frontend -and $frontend.StatusCode -eq 200) { Write-Host "Frontend healthy" } else { Write-Host "Frontend not healthy" }

Write-Host "===================================="
Write-Host "  PLXYGROUND RUNNING"
Write-Host "  Backend:  http://localhost:3011"
Write-Host "  Frontend: http://localhost:19006"
Write-Host "  Admin:    http://localhost:3012"
Write-Host "===================================="
