@echo off
echo Starting Shopee Tools...

start "Backend" cmd /k "cd /d %~dp0backend && uvicorn main:app --reload --port 8000"
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Done! Backend: http://localhost:8000 / Frontend: http://localhost:5173
