@echo off
echo ===================================================
echo   AuraGuard Insurance System - Production Publisher
echo ===================================================
echo.

echo [1/3] Building Production Frontend (React/Vite)...
cd /d "%~dp0\frontend"
call npm ci
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b %errorlevel%
)
echo [OK] Frontend built successfully to frontend\dist

echo.
echo [2/3] Building & Publishing Production Backend (.NET 9)...
cd /d "%~dp0\backend"
dotnet publish InsuranceApi.csproj -c Release -o "%~dp0\publish\backend"
if %errorlevel% neq 0 (
    echo [ERROR] Backend publish failed!
    pause
    exit /b %errorlevel%
)
echo [OK] Backend published successfully to publish\backend

echo.
echo [3/3] Copying Frontend Assets to Deployment Directory...
mkdir "%~dp0\publish\frontend" 2>nul
xcopy /E /I /Y "%~dp0\frontend\dist" "%~dp0\publish\frontend"
echo [OK] Frontend copied to publish\frontend

echo.
echo ===================================================
echo   DEPLOYMENT BUNDLE READY in .\publish
echo ===================================================
echo Backend API : .\publish\backend\InsuranceApi.exe
echo Frontend SPA: .\publish\frontend (Static files)
echo.
pause
