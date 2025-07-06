@echo off
echo Starting Travel.Go Mobile Connect...
echo.

REM Start ngrok in a separate window
start cmd /k "npx ngrok http 3000"

REM Wait a moment for ngrok to start
echo Waiting for ngrok to initialize...
timeout /t 3 /nobreak > nul

REM Open the mobile connect tool
echo Opening Mobile Connect tool...
start frontend\ngrok-mobile-connect.html

echo.
echo Done! The Mobile Connect tool should open automatically.
echo. 