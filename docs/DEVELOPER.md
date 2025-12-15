# 开发者文档 — 算账工具 Pro

## 项目结构
- `server/`: Node.js + Express + better-sqlite3 服务
  - `app.js`: 所有 HTTP 接口
  - `db.js`: SQLite 连接、schema 初始化、用户种子导入
  - `schema.sql`: 数据表定义（含 share_links）
  - `users.seed.json`: 默认用户种子（可用 `USERS_SEED_PATH` 覆盖）
  - `server.Dockerfile`, `docker-compose.yml`
- `client/`: Vite + React + MUI 前端
  - `src/App.jsx`: 入口，包含登录/管理员模式/分享入口
  - `src/pages/*`: 业务页面（Activities、ActivityDetail、Admin、PublicShare、Login）
  - `src/api/api.js`: Axios API 封装
  - `frontend-bd.sh`: 前端构建脚本（使用 node:20 容器）
- `docs/`: 文档（本文件、用户文档）

## 运行与构建
### 后端
- 本地：`cd server && npm install && node app.js`（需要 Node 20+）
- Docker：`docker-compose up --build -d`（server.Dockerfile 已使用 Node 20）
- 数据库：默认路径 `server/db-data/accounting.db`，可设 `DB_PATH`
- 用户种子：`USERS_SEED_PATH=/path/to/users.json`；默认读取 `server/users.seed.json`

### 前端
- 本地：`cd client && npm install && npm run dev`
- 构建/部署：`bash client/frontend-bd.sh`（内部用 node:20 做 npm install & build）
- 公共分享：访问 `/?share=<token>`，无需登录

## 后端接口速览
### 认证
- `POST /login` — 登录（返回 cookie）
- `POST /logout` — 退出
- `GET /auth/status` — 会话/角色检测
- `GET /me` — 当前用户信息（需登录）

### 活动与数据
- `GET /activities` — 列表（需登录）
- `POST /activities` — 创建
- `PUT /activities/:id` — 重命名
- `DELETE /activities/:id` — 删除
- `GET /activities/:id` — 详情（人员、支出）
- `GET /activities/:id/stats` — 统计
- 人员：`POST /activities/:id/persons`，`PUT /persons/:id`，`DELETE /persons/:id`
- 支出：`POST /activities/:id/expenses`，`DELETE /expenses/:id`
- 批量人员导入：`POST /activities/:id/persons/batch`

### 配置（模板）
- `GET /configs`，`POST /configs`，`PUT /configs/:id`，`DELETE /configs/:id`

### 分享（公开只读）
- `POST /activities/:id/share` — 生成分享 token（validDays 1–365，需登录且活动 owner）
- `GET /public/activities/:token` — 公开查看，校验过期返回 410

### 管理员
- `POST /admin/users` — 创建用户（role 固定 user）
- `POST /admin/users/reset-password` — 重置用户密码
- 管理员登录后只显示管理界面，不能使用普通记账功能

## 数据库 schema 要点
- `users(username UNIQUE, password, role CHECK IN user|admin)`
- `activities / persons / expenses`（外键级联）
- `configs / config_persons`（模板）
- `share_links(activity_id, token UNIQUE, expires_at, created_at)`

## 前端要点
- 管理员模式：强制进入 Admin 页，不显示普通工作台。
- 公共分享页：`/?share=<token>`，无顶部菜单/退出按钮，支持滚动。
- 单笔支出直接提交；多笔支出弹窗选择合并/分笔。
- 密码输入：登录与管理员页均支持显示/隐藏密码。

## 开发提示
- 角色/权限依赖 `auth/status`；确保前端请求带 `withCredentials`.
- 分享链接不会自动废弃旧 token，如需强制单链可在 `/activities/:id/share` 插入前先删除旧记录。
- 更新依赖或构建时请使用 Node 20+，避免 better-sqlite3 引擎警告。 
