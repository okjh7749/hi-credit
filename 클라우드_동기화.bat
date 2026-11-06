@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [Hi-Credit] 로컬 데이터를 클라우드(GitHub Gist)로 업로드 동기화합니다...
gh gist edit 10ac81dcf7df61f3c7957fb0e92f6375 "data\hi-credit-db.json"
echo 완료되었습니다! 갤럭시 앱에서 [클라우드에서 최신 데이터 불러오기]를 누르면 즉시 반영됩니다.
pause
