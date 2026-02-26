# Supabase 快速设置指南

## 步骤 1: 创建 Supabase 项目（5分钟）

### 1.1 注册/登录
- 访问: https://supabase.com
- 点击 "Start your project"
- 使用 GitHub 账号登录（推荐）

### 1.2 创建项目
1. 点击 "New Project"
2. 填写信息:
   - **Organization**: 选择你的组织（或创建新的）
   - **Project name**: zaitan-app
   - **Database Password**: 生成强密码（保存好！）
   - **Region**: 选择最近的（Singapore 对国内较好）
3. 点击 "Create new project"
4. 等待 1-2 分钟项目创建完成

### 1.3 获取连接信息
项目创建后，在 Dashboard 中:

**找到 DATABASE_URL:**
1. 左侧菜单: Project Settings → Database
2. 找到 "Connection string" 部分
3. 选择 "URI" 格式
4. 复制 connection string（包含密码）
5. 格式: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

**找到 API Keys:**
1. 左侧菜单: Project Settings → API
2. 复制:
   - `Project URL` (例如: https://xxxxx.supabase.co)
   - `anon public` (用于前端)
   - `service_role secret` (用于后端，保密！)

## 步骤 2: 初始化数据库（3分钟）

### 2.1 打开 SQL Editor
1. 左侧菜单: SQL Editor
2. 点击 "New query"

### 2.2 执行初始化脚本
1. 打开 `/root/zaitan-configs/supabase-setup.sql` 文件
2. 复制全部内容
3. 粘贴到 SQL Editor
4. 点击 "Run" 按钮
5. 等待执行完成（显示 "Success, no rows returned"）

### 2.3 验证表创建
1. 左侧菜单: Table Editor
2. 应该看到以下表:
   - users
   - subscriptions
   - articles
   - favorites
   - read_history
   - payments

## 步骤 3: 配置后端环境变量（2分钟）

### 3.1 编辑 backend.env
```bash
cp /root/zaitan-configs/backend.env /root/zaitan-api/.env
nano /root/zaitan-api/.env  # 或使用其他编辑器
```

### 3.2 填入 Supabase 信息
```env
# 从步骤 1.3 复制
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# 生成 JWT_SECRET（随机字符串）
# 在终端运行: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="[生成的随机字符串]"

# 其他保持默认或稍后配置
OPENAI_API_KEY="稍后申请"
```

## 步骤 4: 测试数据库连接（1分钟）

```bash
cd /root/zaitan-api

# 安装依赖
npm install

# 生成 Prisma Client
npx prisma generate

# 测试连接
npx prisma db pull
```

如果成功，会看到数据库结构被拉取。

## 完成！

现在你可以:
1. ✅ 本地运行后端测试
2. ✅ 部署到 Vercel
3. ⏳ 申请 OpenAI API Key

## 常见问题

### Q: 忘记数据库密码怎么办？
A: Project Settings → Database → Reset database password

### Q: 连接超时？
A: 检查网络，确保能访问 supabase.co。如果在国内，可能需要 VPN。

### Q: 权限错误？
A: 确保使用了 service_role key，不是 anon key。

### Q: 表创建失败？
A: 检查 SQL 脚本是否完整复制，特别是分号和引号。

## 下一步

配置完成后，继续:
- [申请 OpenAI API Key](./openai-guide.md)
- [部署到 Vercel](./deploy-vercel.md)
