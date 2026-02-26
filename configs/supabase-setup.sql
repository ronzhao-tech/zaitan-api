-- ==========================================
-- 再探！数据库初始化脚本
-- 在 Supabase SQL Editor 中执行
-- ==========================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建枚举类型
CREATE TYPE "PlanType" AS ENUM ('MONTHLY', 'YEARLY');
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID');

-- 用户表
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "phone" VARCHAR(20) UNIQUE,
  "email" VARCHAR(255) UNIQUE,
  "wechatOpenId" VARCHAR(255) UNIQUE,
  "wechatUnionId" VARCHAR(255) UNIQUE,
  "name" VARCHAR(255),
  "avatar" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 订阅表
CREATE TABLE "subscriptions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "plan" "PlanType" NOT NULL,
  "status" "Status" DEFAULT 'ACTIVE',
  "stripeSubId" VARCHAR(255) UNIQUE,
  "currentPeriodStart" TIMESTAMP NOT NULL,
  "currentPeriodEnd" TIMESTAMP NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文章表
CREATE TABLE "articles" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "title" VARCHAR(500) NOT NULL,
  "content" TEXT,
  "summary" TEXT,
  "author" VARCHAR(255),
  "source" VARCHAR(255),
  "imageUrl" TEXT,
  "readTime" INTEGER DEFAULT 0,
  "isRead" BOOLEAN DEFAULT FALSE,
  "isArchived" BOOLEAN DEFAULT FALSE,
  "category" VARCHAR(100),
  "tags" TEXT[],
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 收藏表
CREATE TABLE "favorites" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "articleId" UUID REFERENCES "articles"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "articleId")
);

-- 阅读历史表
CREATE TABLE "read_history" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "articleId" UUID REFERENCES "articles"("id") ON DELETE CASCADE,
  "progress" FLOAT DEFAULT 0,
  "readTime" INTEGER DEFAULT 0,
  "lastReadAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "articleId")
);

-- 支付记录表
CREATE TABLE "payments" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "stripePaymentId" VARCHAR(255) UNIQUE,
  "amount" INTEGER NOT NULL,
  "currency" VARCHAR(10) DEFAULT 'cny',
  "status" VARCHAR(50),
  "plan" "PlanType" NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引优化查询
CREATE INDEX "idx_articles_userId" ON "articles"("userId");
CREATE INDEX "idx_articles_createdAt" ON "articles"("createdAt");
CREATE INDEX "idx_favorites_userId" ON "favorites"("userId");
CREATE INDEX "idx_read_history_userId" ON "read_history"("userId");
CREATE INDEX "idx_payments_userId" ON "payments"("userId");

-- 创建触发器自动更新 updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON "subscriptions"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON "articles"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入测试数据（可选）
-- INSERT INTO "users" ("phone", "name") VALUES ('13800138000', '测试用户');

-- 启用 RLS (Row Level Security) - 重要！
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "articles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "favorites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "read_history" ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的数据
CREATE POLICY "Users can only access their own data" ON "users"
  FOR ALL USING (auth.uid()::text = "id"::text);

CREATE POLICY "Users can only access their own articles" ON "articles"
  FOR ALL USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can only access their own subscriptions" ON "subscriptions"
  FOR ALL USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can only access their own favorites" ON "favorites"
  FOR ALL USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users can only access their own read history" ON "read_history"
  FOR ALL USING (auth.uid()::text = "userId"::text);
