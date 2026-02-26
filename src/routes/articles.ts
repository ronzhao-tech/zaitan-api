import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireSubscription } from '../middleware/auth';
import { OpenAI } from 'openai';

const router = Router();
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 获取文章列表
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '20', category, search, isRead } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { userId: req.user!.id };
    
    if (category) where.category = category;
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          favorites: { where: { userId: req.user!.id } },
          _count: { select: { favorites: true } }
        }
      }),
      prisma.article.count({ where })
    ]);

    res.json({
      articles: articles.map(a => ({
        ...a,
        isFavorited: a.favorites.length > 0
      })),
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    res.status(500).json({ error: '获取文章列表失败' });
  }
});

// 添加文章
router.post('/', authenticate, requireSubscription, async (req: AuthRequest, res) => {
  const schema = z.object({
    url: z.string().url(),
    title: z.string().min(1),
    content: z.string().optional(),
    author: z.string().optional(),
    source: z.string().optional(),
    imageUrl: z.string().url().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional()
  });

  try {
    const data = schema.parse(req.body);

    // 检查是否已存在
    const existing = await prisma.article.findFirst({
      where: { userId: req.user!.id, url: data.url }
    });

    if (existing) {
      return res.status(409).json({ error: '文章已存在' });
    }

    // 生成 AI 摘要
    let summary = null;
    if (data.content) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的文章摘要生成助手。请用2-3句话概括文章的核心内容，要求简洁明了。'
            },
            {
              role: 'user',
              content: `请为以下文章生成摘要：\n\n标题：${data.title}\n\n内容：${data.content.slice(0, 3000)}`
            }
          ],
          max_tokens: 150
        });
        summary = completion.choices[0].message.content;
      } catch (e) {
        console.error('AI摘要生成失败:', e);
      }
    }

    const article = await prisma.article.create({
      data: {
        ...data,
        summary,
        userId: req.user!.id,
        readTime: Math.ceil((data.content?.length || 0) / 500)
      }
    });

    res.status(201).json({ success: true, article });
  } catch (error) {
    res.status(400).json({ error: '添加文章失败', details: error });
  }
});

// 获取文章详情
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const article = await prisma.article.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: {
        favorites: { where: { userId: req.user!.id } },
        readHistory: { where: { userId: req.user!.id } }
      }
    });

    if (!article) {
      return res.status(404).json({ error: '文章不存在' });
    }

    // 更新阅读历史
    await prisma.readHistory.upsert({
      where: {
        userId_articleId: {
          userId: req.user!.id,
          articleId: article.id
        }
      },
      update: {
        lastReadAt: new Date()
      },
      create: {
        userId: req.user!.id,
        articleId: article.id
      }
    });

    res.json({
      ...article,
      isFavorited: article.favorites.length > 0
    });
  } catch (error) {
    res.status(500).json({ error: '获取文章详情失败' });
  }
});

// 更新文章（标记已读、归档等）
router.patch('/:id', authenticate, async (req: AuthRequest, res) => {
  const schema = z.object({
    isRead: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional()
  });

  try {
    const data = schema.parse(req.body);
    
    const article = await prisma.article.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data
    });

    if (article.count === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: '更新文章失败' });
  }
});

// 删除文章
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.article.deleteMany({
      where: { id: req.params.id, userId: req.user!.id }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除文章失败' });
  }
});

// 收藏/取消收藏
router.post('/:id/favorite', authenticate, async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_articleId: {
          userId: req.user!.id,
          articleId: req.params.id
        }
      }
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id }
      });
      res.json({ success: true, isFavorited: false });
    } else {
      await prisma.favorite.create({
        data: {
          userId: req.user!.id,
          articleId: req.params.id
        }
      });
      res.json({ success: true, isFavorited: true });
    }
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
});

export { router as articlesRouter };
