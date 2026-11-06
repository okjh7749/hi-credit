@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [Hi-Credit & Sub Hub] 서버를 시작합니다...
start "" "http://localhost:5173"
npm run dev
