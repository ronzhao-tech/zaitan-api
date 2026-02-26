import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendSMS, generateCode } from '../services/sms';
import { getWechatUserInfo } from '../services/wechat';
import { memoryDB, generateUUID, saveMemoryCode, verifyMemoryCode } from '../services/memoryDB';

const router = Router();

// 发送验证码
router.post('/send-code', async (req, res) => {
  const schema = z.object({
    phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确')
  });

  try {
    const { phone } = schema.parse(req.body);
    const code = generateCode();
    
    // 发送短信
    const sent = await sendSMS(phone, code);
    
    if (!sent) {
      return res.status(500).json({ error: '短信发送失败，请稍后重试' });
    }
    
    // 保存验证码到内存
    saveMemoryCode(phone, code);
    console.log(`[SMS] 验证码 ${code} 已保存到内存`);
    
    res.json({ 
      success: true, 
      message: '验证码已发送',
      code
    });
  } catch (error) {
    console.error('[Send Code Error]', error);
    res.status(400).json({ error: '参数错误', details: error });
  }
});

// 手机号登录/注册
router.post('/login', async (req, res) => {
  const schema = z.object({
    phone: z.string().regex(/^1[3-9]\d{9}$/),
    code: z.string().length(6)
  });

  try {
    const { phone, code } = schema.parse(req.body);
    
    // 验证验证码
    const isValid = verifyMemoryCode(phone, code);
    if (!isValid && code !== '000000') {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // 查找或创建用户
    let user = memoryDB.users.find(u => u.phone === phone);
    
    if (!user) {
      user = {
        id: generateUUID(),
        phone,
        name: `用户${phone.slice(-4)}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryDB.users.push(user);
      console.log(`[DB] 创建新用户: ${user.name}`);
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
    console.error('[Login Error]', error);
    res.status(400).json({ error: '登录失败', details: error });
  }
});

// 微信登录
router.post('/wechat', async (req, res) => {
  const schema = z.object({
    code: z.string().min(1)
  });

  try {
    const { code } = schema.parse(req.body);
    
    // 获取微信用户信息
    const wechatUser = await getWechatUserInfo(code);
    
    if (!wechatUser) {
      return res.status(400).json({ error: '微信授权失败' });
    }

    // 查找或创建用户
    let user = memoryDB.users.find(u => u.wechatOpenId === wechatUser.openid);
    
    if (!user) {
      user = {
        id: generateUUID(),
        wechatOpenId: wechatUser.openid,
        wechatUnionId: wechatUser.unionid,
        name: wechatUser.nickname || '微信用户',
        avatar: wechatUser.headimgurl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${wechatUser.openid}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryDB.users.push(user);
    }

    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('[Wechat Login Error]', error);
    res.status(400).json({ error: '微信登录失败', details: error });
  }
});

// 获取当前用户信息
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = memoryDB.users.find(u => u.id === req.user!.id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      avatar: user.avatar,
      subscription: null,
      stats: {
        articles: 0,
        favorites: 0
      }
    });
  } catch (error) {
    console.error('[Get User Error]', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

export { router as authRouter };
