@echo off
echo ============================================
echo Deploy to VPS #3 (92.53.119.24)
echo ============================================
echo.
echo Copying dist files...
"C:\Program Files\PuTTY\pscp.exe" -r dist\* root@92.53.119.24:/opt/aivet/dist/
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy files
    pause
    exit /b 1
)
echo.
echo Files copied! Restarting PM2...
"C:\Program Files\PuTTY\plink.exe" root@92.53.119.24 "pm2 restart aivet"
if %errorlevel% neq 0 (
    echo ERROR: Failed to restart PM2
    pause
    exit /b 1
)
echo.
echo ============================================
echo SUCCESS! Now:
echo 1. Open https://vetai24.ru/super
echo 2. Press Ctrl+Shift+R to clear cache
echo 3. Try to login again
echo ============================================
pause
