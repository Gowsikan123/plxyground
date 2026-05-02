@echo off
echo Starting PLXYGROUND services...
echo.

echo [1/3] Starting backend on port 3011...
start "PLXYGROUND Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul

echo [2/3] Starting admin panel on port 3013...
start "PLXYGROUND Admin" cmd /k "cd admin-panel && npm start"
timeout /t 2 /nobreak >nul

echo [3/3] Starting frontend (Expo)...
start "PLXYGROUND Frontend" cmd /k "cd frontend && npx expo start"

echo.
echo All services started!
echo   Backend:     http://localhost:3011
echo   Admin Panel: http://localhost:3013
echo   Frontend:    Expo DevTools (see Expo window)
echo.
pause
