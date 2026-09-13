import { defineEventHandler, readBody } from 'h3';
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

    const body = await readBody(event);
    const { status } = body;

    if (!status) {
      return miniappServerError(event, '状态不能为空');
    }

    // 查询订单
    const order = await prisma.productOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return miniappServerError(event, '订单不存在');
    }

    // 更新订单
    const updateData: any = { status };

    if (status === 'SHIPPED' && !order.shippedAt) {
      updateData.shippedAt = new Date();
    }

    if (status === 'COMPLETED' && !order.completedAt) {
      updateData.completedAt = new Date();
    }

    const updatedOrder = await prisma.productOrder.update({
      where: { id },
      data: updateData,
    });

    return miniappSuccess(updatedOrder, '更新成功');
  } catch (error: any) {
    console.error('更新商品订单失败:', error);
    return miniappServerError(event, error.message || '更新失败');
  }
});
