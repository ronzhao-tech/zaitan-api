# Vercel 部署指南

## 方案 A: 通过 Vercel Dashboard 部署（推荐）

### 步骤 1: 准备代码
确保你的代码已经推送到 GitHub:
```bash
cd /root/zaitan-api
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 步骤 2: 导入项目
1. 访问 https://vercel.com
2. 使用 GitHub 登录
3. 点击 "Add New Project"
4. 找到并导入 "zaitan-api" 仓库
5. 点击 "Import"

### 步骤 3: 配置项目
1. **Framework Preset**: 选择 "Other"
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Install Command**: `npm install`

### 步骤 4: 添加环境变量
点击 "Environment Variables"，添加以下变量（从 backend.env 复制）:

```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
OPENAI_API_KEY=...（如果有）
NODE_ENV=production
```

### 步骤 5: 部署
点击 "Deploy"，等待 1-2 分钟。

部署成功后，你会获得一个域名，例如:
`https://zaitan-api-xxxxx.vercel.app`

### 步骤 6: 更新前端 API 地址
编辑 `/root/zaitan-h5/index.html`，找到 API_BASE_URL 并更新:
```javascript
const API_BASE_URL = 'https://zaitan-api-xxxxx.vercel.app';
```

然后提交更改:
```bash
cd /root/zaitan-h5
git add .
git commit -m "Update API URL"
git push origin main
```

等待 1-2 分钟，GitHub Pages 会自动更新。

---

## 方案 B: 使用 Vercel CLI 部署

### 步骤 1: 安装 CLI
```bash
npm install -g vercel
```

### 步骤 2: 登录
```bash
vercel login
# 按提示在浏览器中确认
```

### 步骤 3: 部署
```bash
cd /root/zaitan-api
vercel --prod
```

按提示选择:
- Set up and deploy? [Y/n]: Y
- Which scope? [选择你的账号]
- Link to existing project? [y/N]: N
- What's your project name? [zaitan-api]
- In which directory is your code located? [./]

### 步骤 4: 配置环境变量
```bash
vercel env add DATABASE_URL
cvercel env add SUPABASE_URL
# ... 添加其他变量
```

或者在 Dashboard 中批量添加。

---

## 验证部署

部署完成后，测试 API:

```bash
# 健康检查
curl https://your-domain.vercel.app/health

# 应该返回:
# {"status":"ok","timestamp":"..."}
```

---

## 自定义域名（可选）

如果你有自己的域名:

1. Vercel Dashboard → Project Settings → Domains
2. 添加你的域名
3. 按提示配置 DNS

---

## 监控和日志

Vercel Dashboard 提供:
- 实时日志
- 性能监控
- 错误追踪
- 部署历史

访问: `https://vercel.com/dashboard`
