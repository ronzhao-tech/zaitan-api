import express from "express";
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import Stripe from 'stripe';

const router = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

// 获取订阅状态
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.id }
    });

    if (!subscription) {
      return res.json({ status: 'inactive' });
    }

    res.json({
      status: subscription.status,
      plan: subscription.plan,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
    });
  } catch (error) {
    res.status(500).json({ error: '获取订阅状态失败' });
  }
});

// 创建订阅
router.post('/create', authenticate, async (req: AuthRequest, res) => {
  try {
    const { plan } = req.body;
    const priceId = plan === 'monthly' 
      ? process.env.STRIPE_PRICE_MONTHLY 
      : process.env.STRIPE_PRICE_YEARLY;

    if (!priceId) {
      return res.status(500).json({ error: '价格配置错误' });
    }

    // 创建 Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: req.user!.phone + '@zaitan.app', // 使用手机号作为临时邮箱
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: {
        userId: req.user!.id
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('创建订阅失败:', error);
    res.status(500).json({ error: '创建订阅失败' });
  }
});

// Stripe Webhook（处理支付事件）
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 处理订阅事件
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      
      if (userId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        await prisma.subscription.upsert({
          where: { userId },
          update: {
            status: 'ACTIVE',
            stripeSubId: session.subscription as string,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
          },
          create: {
            userId,
            plan: subscription.items.data[0].price.id === process.env.STRIPE_PRICE_MONTHLY ? 'MONTHLY' : 'YEARLY',
            status: 'ACTIVE',
            stripeSubId: session.subscription as string,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
          }
        });

        // 记录支付
        await prisma.payment.create({
          data: {
            userId,
            stripePaymentId: session.payment_intit as string,
            amount: session.amount_total || 0,
            status: 'completed',
            plan: subscription.items.data[0].price.id === process.env.STRIPE_PRICE_MONTHLY ? 'MONTHLY' : 'YEARLY'
          }
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const userId = invoice.subscription_details?.metadata?.userId;
      
      if (userId) {
        await prisma.subscription.updateMany({
          where: { userId },
          data: { status: 'PAST_DUE' }
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      
      if (userId) {
        await prisma.subscription.updateMany({
          where: { userId },
          data: { status: 'CANCELED' }
        });
      }
      break;
    }
  }

  res.json({ received: true });
});

// 取消订阅
router.post('/cancel', authenticate, async (req: AuthRequest, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.id }
    });

    if (!subscription?.stripeSubId) {
      return res.status(404).json({ error: '订阅不存在' });
    }

    await stripe.subscriptions.update(subscription.stripeSubId, {
      cancel_at_period_end: true
    });

    await prisma.subscription.update({
      where: { userId: req.user!.id },
      data: { cancelAtPeriodEnd: true }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '取消订阅失败' });
  }
});

export { router as subscriptionRouter };
