#!/bin/bash

echo "========================================"
echo "Office 365 Manager - 启动脚本"
echo "========================================"
echo ""

echo "[1/2] 构建前端..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "前端构建失败!"
    exit 1
fi
cd ..

echo "[2/2] 启动应用服务器..."
uv run run.py &
APP_PID=$!

echo ""
echo "========================================"
echo "启动完成!"
echo "========================================"
echo "应用地址: http://localhost:8000"
echo "API 文档: http://localhost:8000/docs"
echo "========================================"
echo ""
echo "提示: 前后端已集成，只需访问 http://localhost:8000"
echo ""
echo "按 Ctrl+C 停止服务..."

# Trap Ctrl+C to kill the process
trap "kill $APP_PID; exit" INT

wait
