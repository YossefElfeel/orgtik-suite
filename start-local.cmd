@echo off
cd /d "%~dp0"
node tools\services\local.cjs
if errorlevel 1 pause
