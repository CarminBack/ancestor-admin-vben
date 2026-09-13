export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const {
    productId,
    specName,
    quantity,
    receiverName,
    receiverPhone,
    province,
    city,
    district,
    detailAddress,
  } = body;

  // 参数校验
  if (!productId) {
    return { code: 400, message: '商品ID不能为空', data: null };
  }
  if (!specName) {
    return { code: 400, message: '商品规格不能为空', data: null };
  }
  if (!quantity || quantity < 1 || quantity > 999) {
    return { code: 400, message: '购买数量范围为1-999', data: null };
  }
  if (!receiverName || receiverName.length > 50) {
    return { code: 400, message: '收货人姓名不合法', data: null };
  }
  if (!receiverPhone || !/^1[3-9]\d{9}$/.test(receiverPhone)) {
    return { code: 400, message: '手机号格式错误', data: null };
  }
  if (!province || !city || !district || !detailAddress) {
    return { code: 400, message: '收货地址不完整', data: null };
  }
  if (detailAddress.length > 200) {
    return { code: 400, message: '详细地址最多200字符', data: null };
  }

  const db = useDatabase();

  try {
    // 查询商品
    const productResult = await db.sql(
      `SELECT p.id, p.code, p.name, p.cover
       FROM products p
       WHERE p.code = ? AND p.status = 'ACTIVE'`,
      [productId],
    );

    if (!productResult.rows || productResult.rows.length === 0) {
      return { code: 404, message: '商品不存在或已下架', data: null };
    }

    const product = productResult.rows[0];

    // 查询规格
    const specResult = await db.sql(
      `SELECT id, name, price, stock
       FROM product_specs
       WHERE product_id = ? AND name = ? AND status = 'ACTIVE'`,
      [product.id, specName],
    );

    if (!specResult.rows || specResult.rows.length === 0) {
      return { code: 400, message: '商品规格不存在', data: null };
    }

    const spec = specResult.rows[0];

    // 检查库存
    if (spec.stock < quantity) {
      return { code: 409, message: '库存不足', data: null };
    }

    // 计算金额
    const amount = (spec.price * quantity).toFixed(2);

    // 生成订单号
    const orderNo = generateSuppliesOrderNo();

    // 拼接完整地址
    const fullAddress = `${province}${city}${district}${detailAddress}`;

    // 创建订单
    const now = new Date().toISOString();
    await db.sql(
      `INSERT INTO product_orders (
        order_no, total_amount, status,
        receiver_name, receiver_phone,
        province, city, district, detail_address, receiver_address,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNo,
        amount,
        'PENDING_SERVICE',
        receiverName,
        receiverPhone,
        province,
        city,
        district,
        detailAddress,
        fullAddress,
        now,
        now,
      ],
    );

    // 获取订单ID
    const orderResult = await db.sql(
      'SELECT id FROM product_orders WHERE order_no = ?',
      [orderNo],
    );
    const orderId = orderResult.rows[0].id;

    // 创建订单明细
    await db.sql(
      `INSERT INTO product_order_items (
        order_id, product_id, spec_id, spec_name,
        product_name, product_image, price, quantity, amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        product.id,
        spec.id,
        spec.name,
        product.name,
        product.cover,
        spec.price,
        quantity,
        amount,
      ],
    );

    // 扣减库存
    await db.sql(`UPDATE product_specs SET stock = stock - ? WHERE id = ?`, [
      quantity,
      spec.id,
    ]);

    return {
      code: 200,
      message: 'success',
      data: {
        orderNo,
        productName: product.name,
        spec: spec.name,
        quantity,
        amount: Number.parseFloat(amount),
        status: 'pending_service',
      },
    };
  } catch (error: any) {
    console.error('创建用品订单失败:', error);
    return {
      code: 500,
      message: error.message || '创建用品订单失败',
      data: null,
    };
  }
});

// 生成用品订单号
function generateSuppliesOrderNo(): string {
  const date = new Date();
  const prefix = 'SP';
  const dateStr = date.toISOString().slice(0, 10).replaceAll('-', '');
  const random = Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}
