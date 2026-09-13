import prisma from '~/utils/db';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const id = event.context.params?.id;
  if (!id) {
    return useResponseError('订单ID不能为空');
  }

  // 查询订单详情
  const order = await prisma.ritualOrder.findUnique({
    where: { id },
    include: {
      package: {
        select: {
          name: true,
        },
      },
      videos: {
        orderBy: { createdAt: 'desc' },
      },
      logs: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    return useResponseError('订单不存在');
  }

  // 格式化返回数据
  const formattedOrder = {
    id: order.id,
    orderNo: order.orderNo,
    orderName: order.orderName,
    deceasedName: order.deceasedName,
    packageId: order.packageId,
    packageName: order.package.name,
    ritualDate: order.ritualDate,
    amount: Number(order.amount),
    status: order.status,
    videoCount: order.videos.length,
    remark: order.remark || '',
    paidAt: order.paidAt?.toISOString() || null,
    completedAt: order.completedAt?.toISOString() || null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    videos: order.videos.map((video) => ({
      id: video.id,
      ritualOrderId: video.ritualOrderId,
      stage: video.stage,
      title: video.title,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl || '',
      duration: video.duration || 0,
      fileSize: video.fileSize || 0,
      status: video.status,
      availableAt: video.availableAt?.toISOString() || null,
      createdAt: video.createdAt.toISOString(),
    })),
    logs: order.logs.map((log) => ({
      id: log.id,
      ritualOrderId: log.ritualOrderId,
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      operatorId: log.operatorId || '',
      operatorName: log.operatorName,
      remark: log.remark || '',
      createdAt: log.createdAt.toISOString(),
    })),
  };

  return useResponseSuccess(formattedOrder);
});
