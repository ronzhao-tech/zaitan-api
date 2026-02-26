// 阿里云短信服务
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 模拟短信发送（实际部署时需要配置阿里云AK）
export async function sendSMS(phone: string, code: string): Promise<boolean> {
  try {
    // TODO: 接入阿里云短信服务
    // const SMSClient = require('@alicloud/sms-sdk');
    // const smsClient = new SMSClient({
    //   accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    //   secretAccessKey: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET
    // });
    // 
    // await smsClient.sendSMS({
    //   PhoneNumbers: phone,
    //   SignName: '再探',
    //   TemplateCode: 'SMS_xxx',
    //   TemplateParam: JSON.stringify({ code })
    // });
    
    console.log(`[SMS] 发送验证码 ${code} 到 ${phone}`);
    return true;
  } catch (error) {
    console.error('SMS发送失败:', error);
    return false;
  }
}

// 生成6位验证码
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 验证码缓存（实际应用使用Redis）
const codeCache = new Map<string, { code: string; expireAt: number }>();

export function saveCode(phone: string, code: string): void {
  codeCache.set(phone, {
    code,
    expireAt: Date.now() + 5 * 60 * 1000 // 5分钟过期
  });
}

export function verifyCode(phone: string, code: string): boolean {
  const record = codeCache.get(phone);
  if (!record) return false;
  if (Date.now() > record.expireAt) {
    codeCache.delete(phone);
    return false;
  }
  return record.code === code;
}
