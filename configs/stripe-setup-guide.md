# Stripe 支付配置指南

## 申请条件
- 支持全球大部分地区
- 需要银行账户接收款项
- 中国大陆需要香港或海外银行账户

## 申请步骤

### 1. 注册 Stripe 账号
访问: https://stripe.com

### 2. 完善账户信息
- 填写企业/个人信息
- 验证邮箱
- 添加银行账户

### 3. 获取 API Keys
1. Developers → API keys
2. 复制 Publishable key 和 Secret key
3. 注意: 测试环境使用 test key (sk_test_xxx)

### 4. 创建产品和价格
1. 左侧菜单: Products → Add product
2. 创建月付产品:
   - Name: 再探月付会员
   - Price: ¥9.9 / month
3. 创建年付产品:
   - Name: 再探年付会员
   - Price: ¥99 / year
4. 复制价格 ID (price_xxx)

### 5. 配置 Webhook
1. Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://your-api.com/api/subscription/webhook`
3. 选择事件:
   - checkout.session.completed
   - invoice.payment_failed
   - customer.subscription.deleted
4. 复制 Signing secret (whsec_xxx)

### 6. 中国大陆收款方案
Stripe 不支持直接收款到大陆账户，可选方案:
1. 香港公司 + 香港银行账户
2. 美国公司 + Payoneer
3. 使用 Stripe Atlas（$500 开设美国公司）
4. 改用国内支付: 微信支付 + 支付宝（需企业资质）

## 替代方案
- 国内用户: 微信支付 + 支付宝（需申请商户号）
- 海外用户: Stripe / PayPal
