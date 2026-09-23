@echo off
cd /d "%~dp0"
call npm ci
if errorlevel 1 goto failed
if not exist .venv\Scripts\python.exe uv venv .venv
if errorlevel 1 goto failed
uv pip install --python .venv\Scripts\python.exe -r requirements.lock
if errorlevel 1 goto failed
echo Setup complete. Double-click start-windows.cmd or demo-windows.cmd.
pause
exit /b 0
:failed
echo Setup failed. Install Node.js 22+ and uv, then retry.
pause
exit /b 1
