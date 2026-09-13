export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { packageId, customerName, deceasedName, memorialDate, note } = body;

  // 参数校验
  if (!packageId) {
    return { code: 400, message: '祭祀套餐不能为空', data: null };
  }
  if (!customerName || customerName.length > 50) {
    return { code: 400, message: '下单人姓名不合法', data: null };
  }
  if (!deceasedName || deceasedName.length > 50) {
    return { code: 400, message: '亡故亲人姓名不合法', data: null };
  }
  if (!memorialDate || !/^\d{4}-\d{2}-\d{2}$/.test(memorialDate)) {
    return { code: 400, message: 'memorialDate 格式错误', data: null };
  }
  if (note && note.length > 500) {
    return { code: 400, message: '祭祀备注最多500字符', data: null };
  }

  const db = useDatabase();

  try {
    // 查询套餐
    const packageResult = await db.sql(
      `SELECT id, name, price FROM ritual_packages WHERE id = ? AND status = 'ACTIVE'`,
      [packageId],
    );

    if (!packageResult.rows || packageResult.rows.length === 0) {
      return { code: 400, message: 'packageName 不存在', data: null };
    }

    const pkg = packageResult.rows[0];

    // 生成订单号
    const orderNo = generateMemorialOrderNo();

    // 创建订单
    const now = new Date().toISOString();
    await db.sql(
      `INSERT INTO ritual_orders (
        order_no, order_name, deceased_name,
        package_id, package_name, amount, ritual_date,
        status, remark, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNo,
        customerName,
        deceasedName,
        pkg.id,
        pkg.name,
        pkg.price,
        memorialDate,
        'PENDING_SERVICE',
        note || '',
        now,
        now,
      ],
    );

    return {
      code: 200,
      message: 'success',
      data: {
        orderNo,
        packageName: pkg.name,
        amount: pkg.price,
        status: 'pending_service',
      },
    };
  } catch (error: any) {
    console.error('创建祭祀订单失败:', error);
    return {
      code: 500,
      message: error.message || '创建祭祀订单失败',
      data: null,
    };
  }
});

// 生成祭祀订单号
function generateMemorialOrderNo(): string {
  const date = new Date();
  const prefix = 'JS';
  const dateStr = date.toISOString().slice(0, 10).replaceAll('-', '');
  const random = Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}
