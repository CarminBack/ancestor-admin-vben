import { miniappError, miniappSuccess } from '~/utils/miniapp-response';

/**
 * 小程序端：商品订单创建
 * POST /api/miniapp/product-orders
 */
export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { items, receiverName, receiverPhone, receiverAddress, remark } =
      body;

    // 参数校验
    if (!items || !Array.isArray(items) || items.length === 0) {
      return miniappError('请选择商品');
    }
    if (!receiverName || !receiverPhone || !receiverAddress) {
      return miniappError('请填写完整的收货信息');
    }

    const db = event.context.db;

    // 生成订单号
    const orderNo = `PO${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // 计算订单总额并验证商品
    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const product = await db
        .prepare('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL')
        .bind(item.productId)
        .first();

      if (!product) {
        return miniappError(`商品不存在: ${item.productId}`);
      }

      const productData = product as any;

      if (productData.status !== 'ON_SHELF') {
        return miniappError(`商品已下架: ${productData.name}`);
      }

      if (productData.stock < item.quantity) {
        return miniappError(`库存不足: ${productData.name}`);
      }

      const itemAmount = productData.price * item.quantity;
      totalAmount += itemAmount;

      orderItems.push({
        productId: item.productId,
        productName: productData.name,
        productImage: productData.cover,
        price: productData.price,
        quantity: item.quantity,
        amount: itemAmount,
      });
    }

    // 创建订单
    const now = new Date().toISOString();
    await db
      .prepare(
        `
      INSERT INTO product_orders (
        order_no, total_amount, status, 
        receiver_name, receiver_phone, receiver_address, 
        remark, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .bind(
        orderNo,
        totalAmount,
        'PENDING',
        receiverName,
        receiverPhone,
        receiverAddress,
        remark || '',
        now,
        now,
      )
      .run();

    // 获取订单ID
    const order = await db
      .prepare('SELECT id FROM product_orders WHERE order_no = ?')
      .bind(orderNo)
      .first();

    const orderId = (order as any).id;

    // 创建订单明细
    for (const item of orderItems) {
      await db
        .prepare(
          `
        INSERT INTO product_order_items (
          order_id, product_id, product_name, product_image,
          price, quantity, amount, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          orderId,
          item.productId,
          item.productName,
          item.productImage,
          item.price,
          item.quantity,
          item.amount,
          now,
          now,
        )
        .run();

      // 扣减库存
      await db
        .prepare('UPDATE products SET stock = stock - ? WHERE id = ?')
        .bind(item.quantity, item.productId)
        .run();
    }

    return miniappSuccess({
      orderNo,
      orderId,
      totalAmount,
    });
  } catch (error: any) {
    console.error('创建商品订单失败:', error);
    return miniappError(error.message || '下单失败，请稍后重试');
  }
});
