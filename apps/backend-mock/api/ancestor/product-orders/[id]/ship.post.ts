/**
 * 商品订单：发货
 * POST /api/ancestor/product-orders/[id]/ship
 */
export default eventHandler(async (event) => {
  try {
    const id = event.context.params?.id;
    const body = await readBody(event);
    const { trackingNo, shippingCompany } = body;

    if (!trackingNo) {
      return forbiddenResponse(event, '请填写快递单号');
    }

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

    if (orderData.status !== 'PENDING') {
      return forbiddenResponse(event, '只能对待发货订单进行发货操作');
    }

    // 更新订单状态
    const now = new Date().toISOString();
    await db
      .prepare(
        `
      UPDATE product_orders 
      SET status = 'SHIPPED',
          tracking_no = ?,
          shipping_company = ?,
          shipped_at = ?,
          updated_at = ?
      WHERE id = ?
    `,
      )
      .bind(trackingNo, shippingCompany || '', now, now, id)
      .run();

    return successResponse('发货成功');
  } catch (error: any) {
    console.error('发货失败:', error);
    return serverErrorResponse(event, error.message || '发货失败');
  }
});
