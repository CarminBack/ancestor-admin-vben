import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  return useResponseSuccess({
    todayRitualOrders: 12,
    todayProductOrders: 28,
    todaySalesAmount: 8960,
    pendingRitualOrders: 5,
    totalRitualOrders: 1856,
    totalProductOrders: 3421,
    totalSalesAmount: 562800,
    completedRituals: 1823,
    recentRitualOrders: [
      {
        id: '1',
        orderNo: 'JZ202609100001',
        orderName: '张三',
        deceasedName: '张XX',
        packageName: '诚心祭祀',
        ritualDate: '2026-09-10',
        amount: 268,
        status: 'PREPARING',
        videoCount: 0,
        createdAt: '2026-09-09 20:30:00',
      },
      {
        id: '2',
        orderNo: 'JZ202609100002',
        orderName: '李四',
        deceasedName: '李XX',
        packageName: '基础祭祀',
        ritualDate: '2026-09-11',
        amount: 168,
        status: 'PAID',
        videoCount: 0,
        createdAt: '2026-09-09 21:15:00',
      },
    ],
    recentProductOrders: [
      {
        id: '1',
        orderNo: 'SP202609100001',
        productName: '金元宝',
        quantity: 2,
        amount: 58,
        receiverName: '王五',
        receiverPhone: '13800138000',
        receiverAddress: '北京市朝阳区XXX',
        status: 'PAID',
        createdAt: '2026-09-10 09:30:00',
      },
    ],
  });
});
