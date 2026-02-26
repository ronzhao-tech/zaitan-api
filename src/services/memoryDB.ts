// 临时内存数据库 - 用于演示
export const memoryDB = {
  users: [] as any[],
  articles: [] as any[],
  favorites: [] as any[],
  codeCache: new Map<string, { code: string; expireAt: number }>()
};

// 生成 UUID
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 保存验证码
export function saveMemoryCode(phone: string, code: string): void {
  memoryDB.codeCache.set(phone, {
    code,
    expireAt: Date.now() + 5 * 60 * 1000
  });
}

// 验证验证码
export function verifyMemoryCode(phone: string, code: string): boolean {
  const record = memoryDB.codeCache.get(phone);
  if (!record) return false;
  if (Date.now() > record.expireAt) {
    memoryDB.codeCache.delete(phone);
    return false;
  }
  return record.code === code;
}
