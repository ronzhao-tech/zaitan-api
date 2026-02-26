# 再探！API 后端服务

基于最佳第三方服务构建的 AI 稍后阅读应用后端 API。

## 技术栈

| 服务 | 用途 | 免费额度 |
|------|------|----------|
| **Supabase** | PostgreSQL 数据库 + Auth | 500MB 存储, 无限请求 |
| **OpenAI** | AI 摘要生成 | $5 免费额度 |
| **Stripe** | 支付订阅 | 免费使用，收手续费 |
| **Upstash Redis** | 速率限制缓存 | 10,000 请求/天 |
| **Vercel** | 部署托管 | 免费 Hobby 计划 |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入你的配置
```

### 3. 初始化数据库

```bash
npx prisma db push
npx prisma generate
```

### 4. 本地开发

```bash
npm run dev
```

### 5. 部署到 Vercel

```bash
npm i -g vercel
vercel --prod
```

## API 文档

### 认证

- `POST /api/auth/send-code` - 发送验证码
- `POST /api/auth/login` - 登录/注册
- `GET /api/auth/me` - 获取当前用户

### 文章

- `GET /api/articles` - 获取文章列表
- `POST /api/articles` - 添加文章
- `GET /api/articles/:id` - 获取文章详情
- `PATCH /api/articles/:id` - 更新文章
- `DELETE /api/articles/:id` - 删除文章
- `POST /api/articles/:id/favorite` - 收藏/取消收藏

### 订阅

- `GET /api/subscription` - 获取订阅状态
- `POST /api/subscription/create` - 创建订阅
- `POST /api/subscription/cancel` - 取消订阅
- `POST /api/subscription/webhook` - Stripe Webhook

### AI

- `POST /api/ai/summary` - 生成摘要
- `POST /api/ai/ask` - 文章问答

### 用户

- `GET /api/user/stats` - 获取统计数据
- `PATCH /api/user/profile` - 更新用户信息

## 第三方服务配置

### 1. Supabase

1. 访问 [supabase.com](https://supabase.com) 创建项目
2. 获取 `Project URL` 和 `anon/service_role` key
3. 在 Database → Connection string 获取 `DATABASE_URL`

### 2. OpenAI

1. 访问 [platform.openai.com](https://platform.openai.com)
2. 创建 API Key
3. 新用户有 $5 免费额度

### 3. Stripe

1. 访问 [stripe.com](https://stripe.com) 注册账号
2. 创建两个价格（月付和年付）
3. 获取 API Key 和 Webhook Secret
4. 配置 Webhook Endpoint: `https://your-api.com/api/subscription/webhook`
   - 选择事件: `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted`

### 4. Upstash Redis

1. 访问 [upstash.com](https://upstash.com) 创建 Redis 数据库
2. 获取 REST URL 和 Token

## 定价设置

在 Stripe Dashboard 中创建两个价格：

1. **月付**: ¥9.9/month
2. **年付**: ¥99/year

复制价格 ID 到环境变量 `STRIPE_PRICE_MONTHLY` 和 `STRIPE_PRICE_YEARLY`

## 开发路线图

- [x] 用户认证（手机号+验证码）
- [x] 文章 CRUD
- [x] AI 摘要生成
- [x] 订阅支付（Stripe）
- [x] 收藏功能
- [x] 阅读统计
- [ ] 文章链接解析（网页抓取）
- [ ] AI 朗读（TTS）
- [ ] 全文搜索
- [ ] 导入导出

## License

MIT
