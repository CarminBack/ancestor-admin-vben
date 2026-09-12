import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// 临时存储
const videoStore: Record<string, any[]> = {};
const orderStore: Record<string, any> = {};

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const id = getRouterParam(event, 'id');

  // 获取订单状态（如果之前更新过）
  const savedOrder = orderStore[id!] || {};
  const videos = videoStore[id!] || [];

  return useResponseSuccess({
    id,
    orderNo: 'JZ202609100001',
    orderName: '张三',
    deceasedName: '张XX',
    packageId: '1',
    packageName: '诚心祭祀',
    amount: 268,
    ritualDate: '2026-09-10',
    status: savedOrder.status || 'PREPARING',
    remark: '',
    paidAt: '2026-09-09 20:35:00',
    completedAt: savedOrder.status === 'COMPLETED' ? new Date().toISOString().replace('T', ' ').substring(0, 19) : null,
    createdAt: '2026-09-09 20:30:00',
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    videos: videos,
    videoCount: videos.length,
    logs: [
      {
        id: '1',
        fromStatus: 'PAID',
        toStatus: 'PREPARING',
        operatorName: '王管理员',
        remark: '开始准备祭祀用品',
        createdAt: '2026-09-10 09:00:00',
      },
    ],
  });
});

// 导出存储供其他接口使用
export { videoStore, orderStore };
