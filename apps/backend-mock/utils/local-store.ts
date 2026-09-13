import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { products, ritualPackages } from './miniapp-data';

// 本地联调存储；多进程以同一目录的锁防止覆盖写入。生产环境应迁移数据库。
export const localDataDir = resolve(process.env.ANCESTOR_DATA_DIR || 'data/ancestor');
const file = resolve(localDataDir, 'store.json');
export interface LocalStore { products: any[]; packages: any[]; orders: any[]; categories: any[]; settings: Record<string, any>; requests: Record<string, any>; }
function seed(): LocalStore {
  return { products: structuredClone(products).map((p, i) => ({ ...p, categoryId: 'paper', categoryName: '纸钱', sort: i, createdAt: new Date().toISOString() })), packages: structuredClone(ritualPackages).map(p => ({ ...p, status: 1 })), orders: [],
    categories: [{ id: 'paper', name: '纸钱', code: 'paper', sort: 1, status: 1 }, { id: 'incense', name: '香烛', code: 'incense', sort: 2, status: 1 }],
    settings: { serviceName: '祭祀客服', wechatId: '', wechatQrCode: '', phone: '', workTime: '9:00-18:00', notice: '请先在后台系统设置填写客服信息' }, requests: {} };
}
export function readStore(): LocalStore { return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : seed(); }
export function changeStore<T>(fn: (store: LocalStore) => T): T {
  mkdirSync(localDataDir, { recursive: true });
  const lock = resolve(localDataDir, 'write.lock');
  try { mkdirSync(lock); } catch { throw Object.assign(new Error('数据正在写入，请稍后重试'), { statusCode: 409 }); }
  try {
    const store = readStore();
    const result = fn(store);
    const temporary = `${file}.${process.pid}.tmp`;
    writeFileSync(temporary, JSON.stringify(store, null, 2), { mode: 0o600 });
    renameSync(temporary, file);
    return result;
  } finally { rmSync(lock, { recursive: true, force: true }); }
}
