import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phone: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '未提供访问令牌' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      phone: string;
    };

    req.user = {
      id: decoded.userId,
      phone: decoded.phone
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的访问令牌' });
  }
};

export const requireSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id }
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
      return res.status(403).json({ 
        error: '需要订阅',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
