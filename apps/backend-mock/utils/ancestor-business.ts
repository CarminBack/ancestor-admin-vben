import type { H3Event } from 'h3';

import type { LocalStore } from './local-store';

import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  getHeader,
  getQuery,
  getRequestURL,
  getRouterParam,
  readBody,
  setResponseStatus,
} from 'h3';

import { verifyAccessToken } from './jwt-utils';
import { changeStore, localDataDir, readStore } from './local-store';

export function fail(message: string, statusCode = 400): never {
  throw Object.assign(new Error(message), { statusCode });
}
export async function respond(
  event: H3Event,
  admin: boolean,
  action: () => any,
) {
  try {
    if (admin && !verifyAccessToken(event)) fail('请先登录', 401);
    return { code: admin ? 0 : 200, message: 'success', data: await action() };
  } catch (error: any) {
    const status = error.statusCode || 500;
    setResponseStatus(event, status);
    return {
      code: status,
      message:
        status === 500 ? '本地数据操作失败，请检查服务日志' : error.message,
      data: null,
    };
  }
}
export function text(value: any, label: string, max = 50) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    fail(`${label}不能为空且长度不能超过${max}`);
  return value.trim();
}
function date(value: any) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    fail('祭祀日期无效');
  return value;
}
function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}
export function adminOrder(o: any) {
  return {
    ...o,
    id: o.orderNo,
    status:
      o.status === 'pending_service'
        ? 'PENDING_PAYMENT'
        : o.status.toUpperCase(),
    orderName: o.customerName,
    ritualDate: o.memorialDate,
    remark: o.note || '',
    receiverAddress: o.fullAddress,
    price: o.quantity ? o.amount / o.quantity : undefined,
    videoCount: o.videos?.length || 0,
    videos: (o.videos || []).map((v: any) => ({
      ...v,
      videoUrl: v.videoUrl.startsWith('/api/media/')
        ? signMedia(v.videoUrl)
        : v.videoUrl,
    })),
    logs: o.logs || [],
  };
}
export function publicOrder(o: any) {
  const { logs: _logs, videos: _videos, ...result } = o;
  return {
    ...result,
    status: [
      'burning',
      'packaging',
      'pending_ritual',
      'pending_video',
      'preparing',
    ].includes(o.status)
      ? 'processing'
      : o.status,
  };
}
function lookup(s: LocalStore, id: string | undefined, type?: string) {
  const o = s.orders.find(
    (o) => o.orderNo === id && (!type || o.orderType === type),
  );
  if (!o) fail('订单不存在', 404);
  return o;
}
export function page(items: any[], q: Record<string, any>) {
  const n = Number(q.pageSize || 10);
  const p = Number(q.page || 1);
  if (!Number.isInteger(p) || p < 1 || !Number.isInteger(n) || n < 1 || n > 100)
    fail('分页参数无效');
  return { items: items.slice((p - 1) * n, p * n), total: items.length };
}
export function createOrder(event: H3Event, type: string) {
  return respond(event, false, async () => {
    const body = await readBody(event);
    if (!body || typeof body !== 'object' || Array.isArray(body))
      fail('请求体无效');
    const key =
      getHeader(event, 'idempotency-key') || getHeader(event, 'x-request-id');
    if (key && key.length > 128) fail('请求标识过长');
    const hash = createHash('sha256')
      .update(JSON.stringify(body))
      .digest('hex');
    return changeStore((s) => {
      const requestKey = key ? `${type}:${key}` : '';
      const previous = requestKey && s.requests[requestKey];
      if (previous) {
        if (previous.hash !== hash) fail('同一请求标识不能提交不同订单', 409);
        return publicOrder(lookup(s, previous.orderNo));
      }
      const o: any = {
        orderNo: `${type === 'memorial' ? 'JS' : 'SP'}${randomUUID().replaceAll('-', '')}`,
        orderType: type,
        status: 'pending_service',
        createdAt: timestamp(),
        updatedAt: timestamp(),
        videos: [],
        logs: [],
      };
      if (type === 'memorial') {
        o.customerName = text(body.customerName, '下单人');
        o.deceasedName = text(body.deceasedName, '故人姓名');
        o.memorialDate = date(body.memorialDate);
        const p = s.packages.find(
          (p) =>
            (body.packageId
              ? p.id === body.packageId
              : p.name === body.packageName) && p.status !== 0,
        );
        if (
          !p ||
          (body.packagePrice !== undefined && body.packagePrice !== p.price)
        )
          fail('套餐或展示价格已变更，请刷新');
        o.packageId = p.id;
        o.packageName = p.name;
        o.amount = p.price;
        o.note = body.note ? text(body.note, '备注', 500) : '';
      } else {
        const p = s.products.find(
          (p) => p.id === body.productId && p.status === 'on_sale',
        );
        const spec = p?.options.find((v: any) => v.name === body.spec);
        if (!p || !spec) fail('商品已下架或规格不存在', 404);
        const n = body.quantity;
        if (!Number.isInteger(n) || n < 1 || n > 999)
          fail('数量必须为1至999的整数');
        o.receiverName = text(body.receiverName, '收货人');
        o.receiverPhone = text(body.receiverPhone, '手机号');
        if (!/^1[3-9]\d{9}$/.test(o.receiverPhone)) fail('手机号无效');
        for (const field of ['province', 'city', 'district', 'detailAddress'])
          o[field] = text(
            body[field],
            field,
            field === 'detailAddress' ? 200 : 50,
          );
        if (spec.stock < n || p.stock < n) fail('库存不足', 409);
        spec.stock -= n;
        p.stock -= n;
        Object.assign(o, {
          productId: p.id,
          productName: p.name,
          productImage: p.coverImage,
          spec: spec.name,
          quantity: n,
          amount: (Math.round(spec.price * 100) * n) / 100,
          fullAddress: `${o.province}${o.city}${o.district}${o.detailAddress}`,
        });
      }
      s.orders.unshift(o);
      if (requestKey) s.requests[requestKey] = { hash, orderNo: o.orderNo };
      return publicOrder(o);
    });
  });
}
export function listOrders(event: H3Event, type: string) {
  return respond(event, true, () => {
    const q = getQuery(event);
    const items = readStore()
      .orders.filter(
        (o) =>
          o.orderType === type &&
          !(
            type === 'memorial' &&
            q.excludeCompleted === 'true' &&
            o.status === 'completed'
          ),
      )
      .map((o) => adminOrder(o))
      .filter(
        (o) =>
          [
            'orderNo',
            'orderName',
            'deceasedName',
            'receiverName',
            'receiverPhone',
          ].every((k) => !q[k] || String(o[k] || '').includes(String(q[k]))) &&
          (!q.status || o.status === q.status) &&
          (!q.ritualDate || o.ritualDate === q.ritualDate),
      );
    return page(items, q);
  });
}
export function orderDetail(event: H3Event, type?: string) {
  return respond(event, !!type, () => {
    const o = lookup(
      readStore(),
      getRouterParam(event, type ? 'id' : 'orderNo'),
      type,
    );
    return type ? adminOrder(o) : publicOrder(o);
  });
}
const flow: Record<string, string> = {
  paid: 'preparing',
  pending_ritual: 'preparing',
  preparing: 'packaging',
  packaging: 'burning',
  burning: 'pending_video',
  pending_video: 'completed',
};
export function updateOrder(
  event: H3Event,
  type: string,
  operation = 'update',
) {
  return respond(event, true, async () => {
    const body = ['confirm-video', 'update'].includes(operation)
      ? await readBody(event)
      : {};
    return changeStore((s) => {
      const o = lookup(s, getRouterParam(event, 'id'), type);
      if (operation === 'confirm-video') {
        const stages: Record<string, { target: string; from: string[] }> = {
          PREPARING: {
            target: 'packaging',
            from: ['paid', 'pending_ritual', 'preparing'],
          },
          PACKAGING: { target: 'burning', from: ['packaging'] },
          BURNING: { target: 'completed', from: ['burning', 'pending_video'] },
        };
        const stage = stages[body?.stage];
        if (type !== 'memorial' || !stage) fail('视频阶段无效');
        if (!o.videos?.some((v: any) => v.stage === body.stage))
          fail('请先上传当前阶段的视频', 409);
        if (o.status === stage.target) return adminOrder(o);
        if (!stage.from.includes(o.status))
          fail('当前状态不允许确认此阶段，请刷新订单', 409);
        if (
          body.stage === 'BURNING' &&
          !['PREPARING', 'PACKAGING', 'BURNING'].every((t) =>
            o.videos.some((v: any) => v.stage === t),
          )
        )
          fail('请先补齐准备、封包和祭祀视频', 409);
        const from = o.status;
        o.status = stage.target;
        o.updatedAt = timestamp();
        if (o.status === 'completed') o.completedAt = o.updatedAt;
        o.logs ||= [];
        o.logs.push({
          id: randomUUID(),
          ritualOrderId: o.orderNo,
          fromStatus: from.toUpperCase(),
          toStatus: o.status.toUpperCase(),
          operatorName: verifyAccessToken(event)?.username || '管理员',
          createdAt: o.updatedAt,
          remark: `确认${body.stage}阶段视频完成`,
        });
        return adminOrder(o);
      }
      const targets: Record<string, string> = {
        'confirm-payment': 'paid',
        cancel: 'cancelled',
        ship: 'shipped',
        advance: flow[o.status],
        complete: 'completed',
      };
      const target =
        targets[operation] || String(body?.status || '').toLowerCase();
      const from = o.status;
      let allowed: boolean;
      if (target === 'paid')
        allowed = ['pending_payment', 'pending_service'].includes(from);
      else if (target === 'cancelled')
        allowed = ['paid', 'pending_payment', 'pending_service'].includes(from);
      else if (type === 'supplies')
        allowed =
          (from === 'paid' && target === 'shipped') ||
          (from === 'shipped' && target === 'completed');
      else allowed = !!target && flow[from] === target;
      if (!allowed) fail('当前订单状态不允许此操作', 409);
      if (type === 'memorial' && target === 'completed' && !o.videos?.length)
        fail('请先上传祭祀视频', 409);
      if (target === 'cancelled' && type === 'supplies') {
        const p = s.products.find((p) => p.id === o.productId);
        const spec = p?.options.find((v: any) => v.name === o.spec);
        if (p && spec) {
          p.stock += o.quantity;
          spec.stock += o.quantity;
        }
      }
      o.status = target;
      o.updatedAt = timestamp();
      if (target === 'paid') o.paidAt = o.updatedAt;
      if (target === 'shipped') o.shippedAt = o.updatedAt;
      if (target === 'completed') o.completedAt = o.updatedAt;
      o.logs ||= [];
      o.logs.push({
        id: randomUUID(),
        ritualOrderId: o.orderNo,
        fromStatus: from.toUpperCase(),
        toStatus: target.toUpperCase(),
        operatorName: verifyAccessToken(event)?.username || '管理员',
        createdAt: o.updatedAt,
        remark: '后台订单操作',
      });
      return adminOrder(o);
    });
  });
}
export function orderLogs(event: H3Event) {
  return respond(
    event,
    true,
    () =>
      lookup(readStore(), getRouterParam(event, 'id'), 'memorial').logs || [],
  );
}
export function videoAction(event: H3Event, operation: string) {
  return respond(event, true, async () => {
    if (operation === 'list')
      return page(
        readStore().orders.flatMap((o) => o.videos || []),
        getQuery(event),
      );
    const b = operation === 'delete' ? {} : await readBody(event);
    return changeStore((s) => {
      const id = getRouterParam(event, 'id');
      if (operation === 'add') {
        const o = lookup(s, id, 'memorial');
        if (
          ![
            'burning',
            'packaging',
            'paid',
            'pending_ritual',
            'pending_video',
            'preparing',
          ].includes(o.status)
        )
          fail('当前状态不能上传视频', 409);
        const type =
          (
            {
              PAID: 'PREPARE',
              PREPARING: 'PREPARE',
              PACKAGING: 'PACKAGE',
              BURNING: 'BURN',
              PENDING_VIDEO: 'FULL',
            } as Record<string, string>
          )[b.stage] || b.type;
        if (!['BURN', 'FULL', 'PACKAGE', 'PREPARE'].includes(type))
          fail('视频阶段无效');
        const url = text(b.videoUrl, '视频地址', 2048);
        if (
          !url.startsWith('https://') &&
          !/^\/api\/media\/[a-f0-9-]+\.mp4$/.test(url)
        )
          fail('请使用HTTPS视频地址或本地上传视频');
        const v = {
          id: randomUUID(),
          ritualOrderId: o.orderNo,
          type,
          stage: b.stage,
          title:
            b.title ||
            (
              {
                PREPARE: '祭祀准备',
                PACKAGE: '封包',
                BURN: '祭祀焚化',
                FULL: '完整视频',
              } as any
            )[type],
          videoUrl: url,
          createdAt: timestamp(),
          status: 1,
          availableAt: b.availableAt || '',
        };
        if (v.availableAt && Number.isNaN(Date.parse(v.availableAt)))
          fail('视频开放时间无效');
        o.videos ||= [];
        o.videos.push(v);
        return v;
      }
      const o = s.orders.find((o) => o.videos?.some((v: any) => v.id === id));
      if (!o) fail('视频不存在', 404);
      const v = o.videos.find((v: any) => v.id === id);
      if (operation === 'delete') {
        o.videos = o.videos.filter((v: any) => v.id !== id);
        return null;
      }
      if (
        typeof b.availableAt !== 'string' ||
        (b.availableAt && Number.isNaN(Date.parse(b.availableAt)))
      )
        fail('开放时间无效');
      v.availableAt = b.availableAt;
      return v;
    });
  });
}
export function records(event: H3Event, admin = false) {
  return respond(event, admin, async () => {
    const q = admin ? await readBody(event) : getQuery(event);
    if (
      (!q.orderNo && !(q.customerName || q.orderName)) ||
      (!q.orderNo && !q.deceasedName)
    )
      fail('请输入订单号，或同时输入下单人和故人姓名');
    return readStore()
      .orders.filter(
        (o) =>
          o.orderType === 'memorial' &&
          o.status === 'completed' &&
          (q.orderNo
            ? o.orderNo === q.orderNo
            : o.customerName === (q.customerName || q.orderName) &&
              o.deceasedName === q.deceasedName),
      )
      .toSorted((a, b) => b.memorialDate.localeCompare(a.memorialDate))
      .map((o) => ({
        ...publicOrder(o),
        videos: (o.videos || [])
          .filter(
            (v: any) =>
              admin ||
              !v.availableAt ||
              Date.parse(v.availableAt) <= Date.now(),
          )
          .map((v: any) => ({
            ...v,
            coverImage: v.thumbnailUrl || '',
            videoUrl:
              v.videoUrl.startsWith('/api/media/') && !admin
                ? `${process.env.ANCESTOR_PUBLIC_ORIGIN || getRequestURL(event).origin}${signMedia(v.videoUrl)}`
                : v.videoUrl,
          })),
      }));
  });
}
// 本地媒体短期签名：避免小程序通过未公开记录猜测媒体路径。
function mediaKey() {
  if (process.env.ANCESTOR_MEDIA_SECRET)
    return process.env.ANCESTOR_MEDIA_SECRET;
  mkdirSync(localDataDir, { recursive: true });
  const file = resolve(localDataDir, 'media.key');
  if (!existsSync(file)) {
    try {
      writeFileSync(file, randomBytes(32).toString('hex'), {
        mode: 0o600,
        flag: 'wx',
      });
    } catch (error: any) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
  return readFileSync(file, 'utf8');
}
export function signMedia(url: string) {
  const expires = Date.now() + 3_600_000;
  const sig = createHmac('sha256', mediaKey())
    .update(`${url}:${expires}`)
    .digest('hex');
  return `${url}?expires=${expires}&sig=${sig}`;
}
export function checkMedia(url: string, expires: any, sig: any) {
  if (!expires || Number(expires) < Date.now() || typeof sig !== 'string')
    return false;
  const expected = createHmac('sha256', mediaKey())
    .update(`${url}:${expires}`)
    .digest('hex');
  return (
    sig.length === expected.length &&
    timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  );
}
