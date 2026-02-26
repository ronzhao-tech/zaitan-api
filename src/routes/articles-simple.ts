import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { memoryDB, generateUUID } from '../services/memoryDB';
import { fetchArticleContent, extractText } from '../services/articleFetcher';
import { generateSummary } from '../services/aiSummary';

const router = Router();

// 获取文章列表
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '20', search } = req.query;
    
    let articles = memoryDB.articles.filter(a => a.userId === req.user!.id);
    
    // 搜索过滤
    if (search) {
      const searchLower = (search as string).toLowerCase();
      articles = articles.filter(a => 
        a.title.toLowerCase().includes(searchLower) ||
        a.content?.toLowerCase().includes(searchLower)
      );
    }
    
    // 分页
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const start = (pageNum - 1) * limitNum;
    const paginatedArticles = articles.slice(start, start + limitNum);
    
    res.json({
      articles: paginatedArticles.map(a => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        source: a.source,
        imageUrl: a.imageUrl,
        readTime: a.readTime,
        isRead: a.isRead,
        createdAt: a.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: articles.length,
        hasMore: start + limitNum < articles.length
      }
    });
  } catch (error) {
    console.error('[Get Articles Error]', error);
    res.status(500).json({ error: '获取文章失败' });
  }
});

// 添加文章
router.post('/', authenticate, async (req: AuthRequest, res) => {
  const schema = z.object({
    url: z.string().url('请输入有效的URL'),
  });

  try {
    const { url } = schema.parse(req.body);
    
    console.log(`[Add Article] 用户 ${req.user!.id} 添加文章: ${url}`);
    
    // 检查是否已存在
    const existing = memoryDB.articles.find(a => a.url === url && a.userId === req.user!.id);
    if (existing) {
      return res.status(400).json({ error: '文章已存在' });
    }
    
    // 抓取文章内容
    const content = await fetchArticleContent(url);
    
    if (!content) {
      return res.status(500).json({ error: '无法抓取文章内容，请检查URL是否有效' });
    }
    
    // 生成 AI 摘要
    const textContent = extractText(content.content);
    const aiResult = await generateSummary(textContent, content.title);
    
    // 创建文章
    const article = {
      id: generateUUID(),
      userId: req.user!.id,
      url,
      title: content.title,
      content: content.content,
      summary: aiResult.summary,
      keyPoints: aiResult.keyPoints,
      author: content.author,
      source: content.source,
      imageUrl: content.imageUrl,
      readTime: content.readTime,
      isRead: false,
      isArchived: false,
      category: '未分类',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    memoryDB.articles.push(article);
    
    console.log(`[Add Article] 成功: ${article.title}`);
    
    res.json({
      success: true,
      article: {
        id: article.id,
        title: article.title,
        summary: article.summary,
        source: article.source,
        imageUrl: article.imageUrl,
        readTime: article.readTime,
      }
    });
  } catch (error) {
    console.error('[Add Article Error]', error);
    res.status(400).json({ error: '添加文章失败', details: error });
  }
});

// 获取文章详情
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const article = memoryDB.articles.find(
      a => a.id === req.params.id && a.userId === req.user!.id
    );
    
    if (!article) {
      return res.status(404).json({ error: '文章不存在' });
    }
    
    res.json({
      id: article.id,
      title: article.title,
      content: article.content,
      summary: article.summary,
      keyPoints: article.keyPoints,
      author: article.author,
      source: article.source,
      url: article.url,
      imageUrl: article.imageUrl,
      readTime: article.readTime,
      isRead: article.isRead,
      category: article.category,
      tags: article.tags,
      createdAt: article.createdAt,
    });
  } catch (error) {
    console.error('[Get Article Error]', error);
    res.status(500).json({ error: '获取文章失败' });
  }
});

// 更新阅读状态
router.patch('/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const article = memoryDB.articles.find(
      a => a.id === req.params.id && a.userId === req.user!.id
    );
    
    if (!article) {
      return res.status(404).json({ error: '文章不存在' });
    }
    
    article.isRead = true;
    article.updatedAt = new Date();
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Update Read Status Error]', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// 删除文章
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const index = memoryDB.articles.findIndex(
      a => a.id === req.params.id && a.userId === req.user!.id
    );
    
    if (index === -1) {
      return res.status(404).json({ error: '文章不存在' });
    }
    
    memoryDB.articles.splice(index, 1);
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Delete Article Error]', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// 收藏文章
router.post('/:id/favorite', authenticate, async (req: AuthRequest, res) => {
  try {
    const article = memoryDB.articles.find(
      a => a.id === req.params.id && a.userId === req.user!.id
    );
    
    if (!article) {
      return res.status(404).json({ error: '文章不存在' });
    }
    
    // 检查是否已收藏
    const existingFav = memoryDB.favorites.find(
      f => f.articleId === req.params.id && f.userId === req.user!.id
    );
    
    if (existingFav) {
      // 取消收藏
      const favIndex = memoryDB.favorites.findIndex(
        f => f.articleId === req.params.id && f.userId === req.user!.id
      );
      memoryDB.favorites.splice(favIndex, 1);
      res.json({ success: true, isFavorited: false });
    } else {
      // 添加收藏
      memoryDB.favorites.push({
        id: generateUUID(),
        userId: req.user!.id,
        articleId: req.params.id,
        createdAt: new Date(),
      });
      res.json({ success: true, isFavorited: true });
    }
  } catch (error) {
    console.error('[Favorite Error]', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 获取收藏列表
router.get('/favorites/list', authenticate, async (req: AuthRequest, res) => {
  try {
    const favorites = memoryDB.favorites
      .filter(f => f.userId === req.user!.id)
      .map(f => {
        const article = memoryDB.articles.find(a => a.id === f.articleId);
        return article ? {
          id: article.id,
          title: article.title,
          summary: article.summary,
          source: article.source,
          imageUrl: article.imageUrl,
          readTime: article.readTime,
          favoritedAt: f.createdAt,
        } : null;
      })
      .filter(Boolean);
    
    res.json({ favorites });
  } catch (error) {
    console.error('[Get Favorites Error]', error);
    res.status(500).json({ error: '获取收藏失败' });
  }
});

export { router as articlesRouter };
