#!/bin/bash

echo "========================================="
echo "   🚀 后端自动构建 / 重启脚本开始执行"
echo "========================================="

LOG_FILE="backend-bd.log"
SERVER_DIR="/root/code/Activities/server"
REPO_ROOT="/root/code/Activities"

# 进入后端目录
echo "📂 切换目录到: $SERVER_DIR"
cd "$SERVER_DIR" || {
  echo "❌ 无法进入目录 $SERVER_DIR"
  exit 1
}

echo "📦 同步依赖并更新 lock 文件 (npm install via node:20)..."
docker run --rm -v "$SERVER_DIR":/app -w /app node:20 npm install --no-fund --no-audit >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
  echo "❌ npm install 失败，查看 $LOG_FILE"
  exit 1
fi

echo "🛑 停止当前 docker compose 服务..."
docker compose -f "$REPO_ROOT/docker-compose.yml" down >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
  echo "❌ docker compose down 失败，查看 $LOG_FILE"
  exit 1
fi

echo "🔨 构建后端镜像..."
docker compose -f "$REPO_ROOT/docker-compose.yml" build --no-cache >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
  echo "❌ docker compose build 失败，查看 $LOG_FILE"
  exit 1
fi

echo "🚀 启动 docker compose..."
docker compose -f "$REPO_ROOT/docker-compose.yml" up -d >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
  echo "❌ docker compose up 启动失败，查看 $LOG_FILE"
  exit 1
fi

echo "========================================="
echo "🎉 后端构建完成并成功启动！"
echo "📜 日志文件: $SERVER_DIR/$LOG_FILE"
echo "========================================="
