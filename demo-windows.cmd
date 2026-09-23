@echo off
cd /d "%~dp0"
node server.mjs --demo --open
if errorlevel 1 pause
