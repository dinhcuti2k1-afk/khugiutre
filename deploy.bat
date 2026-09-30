@echo off
chcp 65001 >nul
echo ==============================================
echo   MOON HOUSE - LUU CODE LEN GITHUB + DEPLOY
echo ==============================================
echo.
set /p MSG=Noi dung cap nhat (bo trong = "update"): 
if "%MSG%"=="" set MSG=update

echo.
echo [1/3] Luu code (git commit)...
git add .
git commit -m "%MSG%"

echo.
echo [2/3] Day len GitHub (Render tu deploy server)...
git push
if errorlevel 1 (
  echo.
  echo *** git push bi loi - kiem tra lai roi chay lai. ***
  pause
  exit /b 1
)

echo.
echo [3/3] Deploy Mini App len Zalo...
call npm run deploy

echo.
echo XONG! Server Render se cap nhat sau 1-3 phut.
pause
