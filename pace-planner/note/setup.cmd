@echo off
rem Pace desktop note installer. Kept ASCII-only on purpose: cmd.exe mangles UTF-8 batch files.
rem It runs setup.ps1 from the Pace website, which holds the real steps and the Chinese messages.
title Pace
echo.
echo   Installing the Pace desktop note...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $b=$env:PACE_NOTE_BASE; if(-not $b){$b='https://block-planner-beta.vercel.app/note/'}; $env:PACE_NOTE_BASE=$b; $w=New-Object Net.WebClient; $w.Encoding=[Text.Encoding]::UTF8; iex ($w.DownloadString($b+'setup.ps1').TrimStart([char]0xFEFF))"
if errorlevel 1 goto failed
exit /b 0
:failed
echo.
echo   Install failed. Check your internet connection, then open this file again.
echo.
pause
exit /b 1
