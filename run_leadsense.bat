@echo off
title Lead Sense - AI Voice Calling Agent Platform (4-1 Major Project)
color 0A

echo =======================================================================
echo          LEAD SENSE - MULTILINGUAL AI VOICE CALLING AGENT
echo                  4-1 B.Tech Major Project Launcher
echo =======================================================================
echo.

set BASEDIR=%~dp0
cd /d "%BASEDIR%"

echo [1/3] Checking environment...
if not exist "backend\venv\Scripts\python.exe" (
    echo [WARNING] Virtualenv not found in backend\venv. Using system python.
    set PY_CMD=python
) else (
    set PY_CMD="%BASEDIR%backend\venv\Scripts\python.exe"
)

echo [2/3] Starting FastAPI Backend on http://localhost:8000...
start "LeadSense - Backend (FastAPI)" cmd /k "cd /d ""%BASEDIR%backend"" && %PY_CMD% -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak > nul

echo [3/3] Starting Next.js Frontend on http://localhost:3000...
start "LeadSense - Frontend (Next.js)" cmd /k "cd /d ""%BASEDIR%frontend"" && npm run dev"

echo.
echo =======================================================================
echo Lead Sense is launching!
echo - Web Dashboard:      http://localhost:3000
echo - API Docs (Swagger): http://localhost:8000/docs
echo =======================================================================
echo.
timeout /t 5 /nobreak > nul
start http://localhost:3000
exit
