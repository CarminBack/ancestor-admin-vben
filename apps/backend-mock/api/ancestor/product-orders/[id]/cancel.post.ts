/**
 * 商品订单：取消订单
 * POST /api/ancestor/product-orders/[id]/cancel
 */
export default eventHandler(async (event) => {
  try {
    const id = event.context.params?.id;
    const body = await readBody(event);
    const { reason } = body;

    const db = event.context.db;

    // 查询订单
    const order = await db
      .prepare('SELECT * FROM product_orders WHERE id = ?')
      .bind(id)
      .first();

    if (!order) {
      return notFoundResponse(event, '订单不存在');
    }

    const orderData = order as any;

    if (orderData.status === 'COMPLETED' || orderData.status === 'CANCELLED') {
      return forbiddenResponse(event, '该订单状态不允许取消');
    }

    // 查询订单明细，恢复库存
    const items = await db
      .prepare('SELECT * FROM product_order_items WHERE order_id = ?')
      .bind(id)
      .all();

    if (items.results) {
      for (const item of items.results as any[]) {
        await db
          .prepare('UPDATE products SET stock = stock + ? WHERE id = ?')
          .bind(item.quantity, item.product_id)
          .run();
      }
    }

    // 更新订单状态
    const now = new Date().toISOString();
    await db
      .prepare(
        `
      UPDATE product_orders 
      SET status = 'CANCELLED',
          remark = ?,
          updated_at = ?
      WHERE id = ?
    `,
      )
      .bind(reason || '管理员取消', now, id)
      .run();

    return successResponse('订单已取消');
  } catch (error: any) {
    console.error('取消订单失败:', error);
    return serverErrorResponse(event, error.message || '取消订单失败');
  }
});
