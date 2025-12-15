FROM node:20

WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production

# 复制应用代码
COPY app.js .
COPY db.js .
COPY schema.sql .

# 创建数据目录（挂载到外部）
RUN mkdir -p /data && chmod 777 /data

# 环境变量
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/data/accounting.db

EXPOSE 3001

CMD ["node", "app.js"]
