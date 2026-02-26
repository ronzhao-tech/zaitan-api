# 一键部署指南

## 方案 1: Render 一键部署（推荐，最简单）

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ronzhao-tech/zaitan-api)

点击上方按钮，按提示操作即可。

**注意：** 部署前请确保已执行数据库初始化 SQL。

---

## 方案 2: Railway 部署

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/placeholder)

---

## 方案 3: Vercel 部署

### 方法 A: 使用 Vercel CLI

```bash
# 1. 安装 CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel --prod
```

### 方法 B: Git 集成（推荐）

1. 访问 https://vercel.com
2. 导入 GitHub 仓库
3. 添加环境变量（见下方）
4. 自动部署

---

## 环境变量配置

部署时需要设置以下环境变量：

```bash
DATABASE_URL="postgresql://postgres:OHp9kNpkilyr6o7F@db.fqhctnvypxfdvuodbdaj.supabase.co:5432/postgres"
SUPABASE_URL="https://fqhctnvypxfdvuodbdaj.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaGN0bnZ5cHhmZHZ1b2RiZGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwODUxNjEsImV4cCI6MjA4NzY2MTE2MX0.K9LZt0l5AiH-JKbrIt0tgI22ZK4EJb9nxcAMwfksdYw"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaGN0bnZ5cHhmZHZ1b2RiZGFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA4NTE2MSwiZXhwIjoyMDg3NjYxMTYxfQ.KuCbQ6LCUMS3fNtRUP8-reC-kzssL1dAZHdso3KfqC4"
JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
NODE_ENV="production"
FRONTEND_URL="https://ronzhao-tech.github.io/zaitan-h5"
```

---

## 部署前必做

1. ✅ 在 Supabase SQL Editor 执行初始化脚本
2. ✅ 确认环境变量正确
3. ✅ 部署后访问 `/health` 检查状态

---

## 部署后更新前端

部署成功后会获得一个 URL，例如：
```
https://zaitan-api-xxxxx.onrender.com
```

更新前端 `index.html` 中的 API 地址：
```javascript
const API_BASE_URL = 'https://zaitan-api-xxxxx.onrender.com';
```
