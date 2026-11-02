@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Syncing A to Pace now...
node a-to-c.js
echo.
echo (If the numbers look old: the export from A runs at 07, 12, 17 and 21 o'clock. Ask Claude to "run the export now" first.)
pause
