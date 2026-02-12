@echo off
title SB Infra - Server
:: Always run from the folder where this script lives
cd /d "%~dp0"

echo ============================================
echo   SB INFRA PROJECTS - Starting server
echo ============================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Download and install from: https://nodejs.org
    echo Then close and reopen this window and try again.
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js found: 
node -v
echo.

echo Installing backend dependencies (first time may take a moment)...
cd server
call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)
echo.

echo Starting server on http://localhost:3002
echo.
echo   Keep this window OPEN while using the site.
echo   Open Chrome and go to: http://localhost:3002
echo   Press Ctrl+C here to stop the server.
echo ============================================
echo.

node server.js

echo.
echo Server stopped.
pause
