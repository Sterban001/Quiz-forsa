@echo off
echo ============================================
echo Starting Quiz Platform - All Services
echo ============================================
echo.
echo Backend API will run on: http://localhost:4000
echo Admin Panel will run on: http://localhost:3000
echo Student App will run on: http://localhost:3005
echo.
echo ============================================
echo.

REM Start Backend API
start "Backend API (Port 4000)" cmd /k "cd backend-api && npm run dev"

REM Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak > nul

REM Start Admin Panel
start "Admin Panel (Port 3000)" cmd /k "cd admin-panel && npm run dev"

REM Start Student App
start "Student App (Port 3005)" cmd /k "cd student-app && npm run dev"

echo.
echo ============================================
echo All services are starting...
echo.
echo Backend API: http://localhost:4000
echo Admin Panel: http://localhost:3000
echo Student App: http://localhost:3005
echo.
echo Press any key to close this window.
echo (The services will continue running in separate windows)
echo ============================================
pause > nul
