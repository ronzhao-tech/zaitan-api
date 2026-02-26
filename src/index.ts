import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import { authRouter } from './routes/auth';
import { articlesRouter } from './routes/articles';
import { subscriptionRouter } from './routes/subscription';
import { userRouter } from './routes/user';
import { aiRouter } from './routes/ai';
import { errorHandler } from './middleware/error';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors({
  origin: ['https://ronzhao-tech.github.io', 'https://ronzhao-tech.github.io/zaitan-h5', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/auth', authRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/user', userRouter);
app.use('/api/ai', aiRouter);

// 错误处理
app.use(errorHandler);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`🚀 再探！API 服务已启动: http://localhost:${PORT}`);
});
