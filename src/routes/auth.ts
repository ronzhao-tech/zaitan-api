import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 发送验证码（模拟）
const verificationCodes = new Map<string, string>();

router.post('/send-code', async (req, res) => {
  const schema = z.object({
    phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确')
  });

  try {
    const { phone } = schema.parse(req.body);
    
    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(phone, code);
    
    // TODO: 接入短信服务商（阿里云/腾讯云）
    console.log(`验证码 for ${phone}: ${code}`);
    
    res.json({ 
      success: true, 
      message: '验证码已发送',
      // 开发环境返回验证码
      ...(process.env.NODE_ENV === 'development' && { code })
    });
  } catch (error) {
    res.status(400).json({ error: '参数错误', details: error });
  }
});

// 登录/注册
router.post('/login', async (req, res) => {
  const schema = z.object({
    phone: z.string().regex(/^1[3-9]\d{9}$/),
    code: z.string().length(6)
  });

  try {
    const { phone, code } = schema.parse(req.body);
    
    // 验证验证码
    const savedCode = verificationCodes.get(phone);
    if (savedCode !== code && code !== '000000') { // 000000 为测试验证码
      return res.status(400).json({ error: '验证码错误' });
    }
    
    verificationCodes.delete(phone);

    // 查找或创建用户
    let user = await prisma.user.findUnique({ where: { phone } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          name: `用户${phone.slice(-4)}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`
        }
      });
    }

    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(400).json({ error: '登录失败', details: error });
  }
});

// 获取当前用户信息
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        subscription: true,
        _count: {
          select: {
            articles: true,
            favorites: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      avatar: user.avatar,
      subscription: user.subscription,
      stats: {
        articles: user._count.articles,
        favorites: user._count.favorites
      }
    });
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

export { router as authRouter };
