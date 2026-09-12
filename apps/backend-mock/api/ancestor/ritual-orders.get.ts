import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// 导入共享存储
import { orderStore, videoStore } from './ritual-orders/[id].get';

const mockRitualOrders = [
  {
    id: '1',
    orderNo: 'JZ202609100001',
    orderName: '张三',
    deceasedName: '张XX',
    packageId: '1',
    packageName: '诚心祭祀',
    amount: 268,
    ritualDate: '2026-09-10',
    status: 'PREPARING',
    videoCount: 0,
    remark: '',
    paidAt: '2026-09-09 20:35:00',
    completedAt: null,
    createdAt: '2026-09-09 20:30:00',
    updatedAt: '2026-09-10 09:00:00',
  },
  {
    id: '2',
    orderNo: 'JZ202609100002',
    orderName: '李四',
    deceasedName: '李XX',
    packageId: '2',
    packageName: '基础祭祀',
    amount: 168,
    ritualDate: '2026-09-11',
    status: 'PAID',
    videoCount: 0,
    remark: '',
    paidAt: '2026-09-09 21:20:00',
    completedAt: null,
    createdAt: '2026-09-09 21:15:00',
    updatedAt: '2026-09-09 21:20:00',
  },
  {
    id: '3',
    orderNo: 'JZ202609090005',
    orderName: '王五',
    deceasedName: '王XX',
    packageId: '3',
    packageName: '敬亲祭祀',
    amount: 398,
    ritualDate: '2026-09-09',
    status: 'COMPLETED',
    videoCount: 3,
    remark: '',
    paidAt: '2026-09-08 15:30:00',
    completedAt: '2026-09-09 16:00:00',
    createdAt: '2026-09-08 15:25:00',
    updatedAt: '2026-09-09 16:00:00',
  },
];

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const query = getQuery(event);
  const { orderNo, orderName, deceasedName, status, page = 1, pageSize = 10 } = query;

  // 合并数据：使用保存的状态和视频数量
  let filtered = mockRitualOrders.map(order => {
    const savedOrder = orderStore[order.id];
    const videos = videoStore[order.id] || [];

    return {
      ...order,
      status: savedOrder?.status || order.status,
      videoCount: videos.length,
      updatedAt: savedOrder?.updatedAt || order.updatedAt,
      completedAt: savedOrder?.status === 'COMPLETED'
        ? (savedOrder.updatedAt || new Date().toISOString().replace('T', ' ').substring(0, 19))
        : order.completedAt,
    };
  });

  // 如果没有指定status参数，则过滤掉已完成的订单（祭祀订单页面不显示已完成的）
  // 如果指定了status=COMPLETED，则保留已完成的订单（祭祀记录页面需要）
  if (!status) {
    filtered = filtered.filter(o => o.status !== 'COMPLETED');
  }

  if (orderNo) {
    filtered = filtered.filter((o) =>
      o.orderNo.toLowerCase().includes((orderNo as string).toLowerCase()),
    );
  }

  if (orderName) {
    filtered = filtered.filter((o) =>
      o.orderName.toLowerCase().includes((orderName as string).toLowerCase()),
    );
  }

  if (deceasedName) {
    filtered = filtered.filter((o) =>
      o.deceasedName.toLowerCase().includes((deceasedName as string).toLowerCase()),
    );
  }

  if (status) {
    filtered = filtered.filter((o) => o.status === status);
  }

  const start = (Number(page) - 1) * Number(pageSize);
  const end = start + Number(pageSize);
  const items = filtered.slice(start, end);

  return useResponseSuccess({
    items,
    total: filtered.length,
    page: Number(page),
    pageSize: Number(pageSize),
  });
});
