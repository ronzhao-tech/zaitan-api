import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 获取用户统计数据
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const [
      totalArticles,
      readArticles,
      totalFavorites,
      totalReadTime
    ] = await Promise.all([
      prisma.article.count({ where: { userId: req.user!.id } }),
      prisma.article.count({ where: { userId: req.user!.id, isRead: true } }),
      prisma.favorite.count({ where: { userId: req.user!.id } }),
      prisma.readHistory.aggregate({
        where: { userId: req.user!.id },
        _sum: { readTime: true }
      })
    ]);

    // 获取阅读趋势（最近7天）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentReads = await prisma.readHistory.groupBy({
      by: ['lastReadAt'],
      where: {
        userId: req.user!.id,
        lastReadAt: { gte: sevenDaysAgo }
      },
      _count: { id: true }
    });

    res.json({
      totalArticles,
      readArticles,
      totalFavorites,
      totalReadTime: totalReadTime._sum.readTime || 0,
      recentActivity: recentReads
    });
  } catch (error) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// 更新用户信息
router.patch('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, avatar } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, avatar }
    });

    res.json({
      id: user.id,
      name: user.name,
      avatar: user.avatar
    });
  } catch (error) {
    res.status(500).json({ error: '更新用户信息失败' });
  }
});

export { router as userRouter };
