import { randomUUID } from 'node:crypto';
import { getQuery, getRouterParam, readBody, type H3Event } from 'h3';
import { readStore, changeStore } from './local-store';
import { respond, fail, text, page, adminOrder } from './ancestor-business';
function productView(p: any, admin: boolean) { return admin ? { ...p, categoryName: p.categoryName || p.categories?.[0] || '', cover: p.coverImage, images: p.detailImages, status: p.status === 'on_sale' ? 1 : 0 } : p; }
export function catalog(event: H3Event, kind: 'products' | 'categories' | 'packages', admin: boolean, op = 'list') {
  return respond(event, admin, async () => {
    const id = getRouterParam(event, 'id'); const q = getQuery(event);
    if (op === 'list' || op === 'detail') {
      let rows = readStore()[kind];
      if (!admin) rows = rows.filter(p => kind === 'products' ? p.status === 'on_sale' : p.status !== 0);
      if (kind === 'products') rows = rows.filter(p => (!q.category || p.categoryCodes.includes(q.category)) && (!q.categoryId || p.categoryId === q.categoryId) && (!(q.name || q.keyword) || p.name.includes(q.name || q.keyword)) && (!q.status || (admin ? (p.status === 'on_sale' ? '1' : '0') : p.status) === q.status));
      if (op === 'detail') { const p = rows.find(p => p.id === id); if (!p) fail('商品不存在或已下架', 404); return productView(p, admin); }
      return page(rows.map(p => kind === 'products' ? productView(p, admin) : p), q);
    }
    const b = op === 'delete' ? {} : await readBody(event);
    return changeStore(s => {
      const rows = s[kind]; const old = op === 'create' ? null : rows.find(p => p.id === id);
      if (op !== 'create' && !old) fail('记录不存在', 404);
      if (op === 'delete') {
        if (kind === 'categories' && s.products.some(p => p.categoryId === id)) fail('分类下仍有商品', 409);
        rows.splice(rows.indexOf(old), 1); return null;
      }
      const p: any = { ...old, id: old?.id || randomUUID(), name: text(b.name ?? old?.name, '名称', 100), updatedAt: new Date().toISOString(), createdAt: old?.createdAt || new Date().toISOString() };
      for (const k of ['description', 'sort', 'image', 'cover']) if (b[k] !== undefined) p[k] = b[k];
      if (kind === 'products' || kind === 'packages') {
        p.price = Number(b.price ?? old?.price);
        if (!Number.isFinite(p.price) || p.price < 0) fail('价格无效');
      }
      if (kind === 'products') {
        p.stock = Number(b.stock ?? old?.stock ?? 0);
        if (!Number.isInteger(p.stock) || p.stock < 0) fail('库存无效');
        p.categoryId = b.categoryId ?? old?.categoryId;
        const category = s.categories.find(c => c.id === p.categoryId);
        if (!category) fail('请选择有效分类');
        p.categoryName = category.name; p.categoryCodes = [category.code || category.id]; p.categories = [category.name];
        p.coverImage = b.cover ?? b.coverImage ?? old?.coverImage ?? ''; p.detailImages = b.images ?? b.detailImages ?? old?.detailImages ?? [];
        p.sales = old?.sales || 0;
        p.status = b.status === undefined ? old?.status || 'on_sale' : [1, 'on_sale', 'ON_SALE'].includes(b.status) ? 'on_sale' : 'off_sale';
        p.options = b.options ?? structuredClone(old?.options || [{ name: '标准装', price: p.price, stock: p.stock }]);
        if (!Array.isArray(p.options) || !p.options.length || p.options.some((v: any) => !v.name || !Number.isFinite(v.price) || v.price < 0 || !Number.isInteger(v.stock) || v.stock < 0) || new Set(p.options.map((v: any) => v.name)).size !== p.options.length) fail('商品规格无效');
        if (!b.options && p.options.length === 1) { p.options[0].price = p.price; p.options[0].stock = p.stock; }
        else if (p.options.reduce((n: number, v: any) => n + v.stock, 0) !== p.stock) fail('规格库存总数必须等于商品库存');
      } else { p.status = b.status ?? old?.status ?? 1; if (kind === 'categories') p.code = b.code || old?.code || p.id; }
      if (old) Object.assign(old, p); else rows.push(p);
      return kind === 'products' ? productView(p, true) : p;
    });
  });
}
export function settings(event: H3Event, admin: boolean, update = false) {
  return respond(event, admin, async () => {
    if (!update) return readStore().settings;
    const b = await readBody(event);
    return changeStore(s => {
      for (const key of ['serviceName', 'wechatId', 'wechatQrCode', 'phone', 'workTime', 'notice']) if (b[key] !== undefined) {
        if (typeof b[key] !== 'string' || b[key].length > 2000) fail('客服配置无效');
        s.settings[key] = b[key];
      }
      return s.settings;
    });
  });
}
export function dashboard(event: H3Event) {
  return respond(event, true, () => {
    const all = readStore().orders, rituals = all.filter(o => o.orderType === 'memorial'), supplies = all.filter(o => o.orderType === 'supplies');
    const today = new Date().toISOString().slice(0, 10);
    const paid = all.filter(o => o.paidAt && o.status !== 'cancelled');
    return { todayRitualOrders: rituals.filter(o => o.createdAt.startsWith(today)).length, todayProductOrders: supplies.filter(o => o.createdAt.startsWith(today)).length, todaySalesAmount: paid.filter(o => o.paidAt.startsWith(today)).reduce((n, o) => n + o.amount, 0), totalRitualOrders: rituals.length, totalProductOrders: supplies.length, pendingRitualOrders: rituals.filter(o => !['completed', 'cancelled'].includes(o.status)).length, totalSalesAmount: paid.reduce((n, o) => n + o.amount, 0), completedRituals: rituals.filter(o => o.status === 'completed').length, recentRitualOrders: rituals.slice(0, 5).map(adminOrder), recentProductOrders: supplies.slice(0, 5).map(adminOrder) };
  });
}
