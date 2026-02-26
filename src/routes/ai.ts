import { Router } from 'express';
import { OpenAI } from 'openai';
import { authenticate, AuthRequest, requireSubscription } from '../middleware/auth';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// AI 生成摘要
router.post('/summary', authenticate, requireSubscription, async (req: AuthRequest, res) => {
  try {
    const { content, title } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: '需要提供文章内容' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的文章摘要生成助手。请用2-3句话概括文章的核心内容，要求简洁明了。'
        },
        {
          role: 'user',
          content: `标题：${title || '无标题'}\n\n内容：${content.slice(0, 4000)}`
        }
      ],
      max_tokens: 200
    });

    res.json({
      summary: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('AI摘要生成失败:', error);
    res.status(500).json({ error: 'AI摘要生成失败' });
  }
});

// AI 回答关于文章的问题
router.post('/ask', authenticate, requireSubscription, async (req: AuthRequest, res) => {
  try {
    const { content, question } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '基于提供的文章内容回答用户问题。如果问题与文章无关，请礼貌地指出。'
        },
        {
          role: 'user',
          content: `文章内容：\n${content.slice(0, 4000)}\n\n用户问题：${question}`
        }
      ],
      max_tokens: 500
    });

    res.json({
      answer: completion.choices[0].message.content
    });
  } catch (error) {
    res.status(500).json({ error: 'AI回答生成失败' });
  }
});

export { router as aiRouter };
