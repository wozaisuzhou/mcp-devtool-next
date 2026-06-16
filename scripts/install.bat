@echo off
REM MCP DevTool - Installation Script for Windows
REM This script sets up the Electron desktop app with SQLite storage

echo.
echo MCP DevTool - Installation ^& Setup
echo ======================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed. Please install Node.js 18+ first.
    echo Download from: https://nodejs.org/
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Success: Node.js detected: %NODE_VERSION%
echo.

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo Error: npm is not installed.
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
call npm install

echo.
echo Success: Installation complete!
echo.
echo Available commands:
echo.
echo   Mobile App (Development):
echo      npm run electron-dev      - Run app with dev tools
echo.
echo   Web App (Development):
echo      npm run dev               - Run Next.js dev server
echo.
echo   Build:
echo      npm run electron-build    - Build standalone app
echo      npm run build             - Build web version
echo.
echo Activity storage:
echo   * Electron: SQLite (local file at %%APPDATA%%\mcp-devtool\activities.db)
echo   * Web: PostgreSQL (requires DATABASE_URL env var)
echo.
echo For more info, see ELECTRON_SETUP.md
echo.
