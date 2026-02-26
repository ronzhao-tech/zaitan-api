# 部署指南

## 方案一：Vercel（推荐）

最快部署方式，免费且稳定。

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel --prod
```

**环境变量配置：**
在 Vercel Dashboard → Project Settings → Environment Variables 中添加所有变量。

## 方案二：Railway

更适合需要持续运行的服务。

```bash
# 1. 安装 Railway CLI
npm i -g @railway/cli

# 2. 登录
railway login

# 3. 创建项目
railway init

# 4. 部署
railway up
```

## 方案三：自建服务器

```bash
# 1. 构建
npm run build

# 2. 启动
npm start

# 或使用 PM2
pm2 start dist/index.js --name zaitan-api
```

## 数据库迁移

```bash
# 开发环境
npx prisma db push

# 生产环境（有数据后使用迁移）
npx prisma migrate deploy
```
