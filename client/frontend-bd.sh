#!/bin/bash

echo "🚀 开始构建前端..."

CLIENT_DIR="/root/code/Activities/client"
LOG_FILE="$CLIENT_DIR/bd.log"

# 进入client目录
cd "$CLIENT_DIR" || {
  echo "❌ 找不到目录 $CLIENT_DIR"
  exit 1
}

# 重置日志
echo "" > "$LOG_FILE"

echo "📦 安装依赖 (node:20)..."
docker run --rm -v "$CLIENT_DIR":/app -w /app node:20 npm install --no-fund --no-audit >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
  echo "❌ npm install 失败！请查看 bd.log"
  exit 1
fi

echo "🧱 运行 npm run build (node:20)..."
docker run --rm -v "$CLIENT_DIR":/app -w /app node:20 npm run build >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
  echo "❌ 构建失败！请查看 bd.log"
  exit 1
fi

echo "✅ 构建成功！准备复制文件..."

TARGET_DIR="/var/www/activities"

# 如果目标目录不存在就创建
if [ ! -d "$TARGET_DIR" ]; then
  mkdir -p "$TARGET_DIR"
fi

# 如果 dist 已存在则删除
if [ -d "$TARGET_DIR/dist" ]; then
  echo "🧹 删除旧的 dist..."
  rm -rf "$TARGET_DIR/dist"
fi

echo "📁 复制新的 dist 到 /var/www/activities..."
cp -r dist "$TARGET_DIR"

echo "🎉 前端部署完成！"
