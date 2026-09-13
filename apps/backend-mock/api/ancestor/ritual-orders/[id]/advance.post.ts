/**
 * 代祭祀订单：推进状态
 * POST /api/ancestor/ritual-orders/[id]/advance
 */
export default eventHandler(async (event) => {
  try {
    const id = event.context.params?.id;
    const body = await readBody(event);
    const { remark } = body;

    const db = event.context.db;

    // 查询订单
    const order = await db
      .prepare('SELECT * FROM ritual_orders WHERE id = ?')
      .bind(id)
      .first();

    if (!order) {
      return notFoundResponse(event, '订单不存在');
    }

    const orderData = order as any;

    // 状态流转规则
    const statusFlow: Record<string, string> = {
      PENDING: 'PAID',
      PAID: 'WAITING',
      WAITING: 'PREPARING',
      PREPARING: 'PACKAGING',
      PACKAGING: 'BURNING',
      BURNING: 'UPLOAD_VIDEO',
      UPLOAD_VIDEO: 'COMPLETED',
    };

    const nextStatus = statusFlow[orderData.status];

    if (!nextStatus) {
      return forbiddenResponse(event, '当前状态不允许推进');
    }

    // 获取操作人信息
    const user = event.context.user || { id: 1, username: 'admin' };

    // 更新订单状态
    const now = new Date().toISOString();
    await db
      .prepare(
        `
      UPDATE ritual_orders 
      SET status = ?,
          updated_at = ?
      WHERE id = ?
    `,
      )
      .bind(nextStatus, now, id)
      .run();

    // 如果推进到已完成，记录完成时间
    if (nextStatus === 'COMPLETED') {
      await db
        .prepare('UPDATE ritual_orders SET completed_at = ? WHERE id = ?')
        .bind(now, id)
        .run();
    }

    // 记录操作日志
    await db
      .prepare(
        `
      INSERT INTO ritual_logs (
        ritual_order_id, from_status, to_status,
        operator_id, operator_name, remark, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .bind(
        id,
        orderData.status,
        nextStatus,
        user.id,
        user.username,
        remark || '',
        now,
      )
      .run();

    return successResponse('状态已推进');
  } catch (error: any) {
    console.error('推进状态失败:', error);
    return serverErrorResponse(event, error.message || '推进状态失败');
  }
});
