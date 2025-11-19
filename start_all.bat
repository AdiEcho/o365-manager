@echo off
echo ========================================
echo Office 365 Manager - 启动脚本
echo ========================================
echo.

echo [1/2] 构建前端...
cd frontend
call npm run build
if %ERRORLEVEL% neq 0 (
    echo 前端构建失败!
    pause
    exit /b 1
)
cd ..

echo [2/2] 启动应用服务器...
start "O365 Manager" cmd /k "uv run run.py"

echo.
echo ========================================
echo 启动完成!
echo ========================================
echo 应用地址: http://localhost:8000
echo API 文档: http://localhost:8000/docs
echo ========================================
echo.
echo 提示: 前后端已集成，只需访问 http://localhost:8000
echo.
echo 按任意键退出...
pause >nul
