import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { Request, Response, NextFunction } from 'express';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});

export const rateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const identifier = req.ip || 'anonymous';
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  if (!success) {
    return res.status(429).json({
      error: '请求过于频繁，请稍后再试',
      retryAfter: reset
    });
  }

  next();
};
