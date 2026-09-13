import { defineEventHandler } from 'h3';
import prisma from '~/utils/db';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { miniappServerError, miniappSuccess } from '~/utils/miniapp-response';
import { unAuthorizedResponse } from '~/utils/response';

export default defineEventHandler(async (event) => {
  try {
    const userinfo = verifyAccessToken(event);
    if (!userinfo) {
      return unAuthorizedResponse(event);
    }

    const id = event.context.params?.id;
    if (!id) {
      return miniappServerError(event, '订单ID不能为空');
    }

    // 查询订单
    const order = await prisma.ritualOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return miniappServerError(event, '订单不存在');
    }

    if (order.status !== 'PENDING_PAYMENT') {
      return miniappServerError(event, '订单状态不允许确认付款');
    }

    // 更新订单状态为已支付
    const updatedOrder = await prisma.ritualOrder.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    return miniappSuccess(updatedOrder, '确认付款成功');
  } catch (error: any) {
    console.error('确认祭祀订单付款失败:', error);
    return miniappServerError(event, error.message || '确认付款失败');
  }
});
