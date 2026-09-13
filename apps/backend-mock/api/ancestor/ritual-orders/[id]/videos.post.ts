import prisma from '~/utils/db';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const orderId = getRouterParam(event, 'id');
  const body = await readBody(event);

  if (!orderId) {
    return useResponseError('订单ID不能为空');
  }

  // 检查订单是否存在
  const order = await prisma.ritualOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return useResponseError('订单不存在');
  }

  // 创建新视频记录
  const newVideo = await prisma.ritualVideo.create({
    data: {
      ritualOrderId: orderId,
      stage: body.stage,
      title: body.title || '',
      videoUrl: body.videoUrl,
      thumbnailUrl: body.thumbnailUrl || '',
      duration: body.duration || 0,
      fileSize: body.fileSize || 0,
      status: 'ACTIVE',
      availableAt: body.availableAt ? new Date(body.availableAt) : null,
    },
  });

  // console.log(`视频已保存到订单 ${orderId}:`, newVideo);

  return useResponseSuccess({
    id: newVideo.id,
    ritualOrderId: newVideo.ritualOrderId,
    stage: newVideo.stage,
    title: newVideo.title,
    videoUrl: newVideo.videoUrl,
    thumbnailUrl: newVideo.thumbnailUrl,
    duration: newVideo.duration,
    fileSize: newVideo.fileSize,
    status: newVideo.status,
    availableAt: newVideo.availableAt?.toISOString() || null,
    createdAt: newVideo.createdAt.toISOString(),
  });
});
