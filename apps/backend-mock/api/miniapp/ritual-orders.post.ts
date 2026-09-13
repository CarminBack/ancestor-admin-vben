import { miniappError, miniappSuccess } from '~/utils/miniapp-response';

/**
 * 小程序端：代祭祀订单创建
 * POST /api/miniapp/ritual-orders
 */
export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
      orderName,
      deceasedName,
      packageId,
      ritualDate,
      contactPhone,
      remark,
    } = body;

    // 参数校验
    if (!orderName || !deceasedName) {
      return miniappError('请填写下单人姓名和亡故亲人姓名');
    }
    if (!packageId) {
      return miniappError('请选择祭祀套餐');
    }
    if (!ritualDate) {
      return miniappError('请选择祭祀日期');
    }
    if (!contactPhone) {
      return miniappError('请填写联系电话');
    }

    const db = event.context.db;

    // 查询套餐信息
    const pkg = await db
      .prepare(
        'SELECT * FROM ritual_packages WHERE id = ? AND status = "ACTIVE"',
      )
      .bind(packageId)
      .first();

    if (!pkg) {
      return miniappError('祭祀套餐不存在或已下架');
    }

    const packageData = pkg as any;

    // 生成订单号
    const orderNo = `JZ${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // 创建订单
    const now = new Date().toISOString();
    await db
      .prepare(
        `
      INSERT INTO ritual_orders (
        order_no, order_name, deceased_name, 
        package_id, package_name, amount, 
        ritual_date, contact_phone, remark, 
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .bind(
        orderNo,
        orderName,
        deceasedName,
        packageId,
        packageData.name,
        packageData.price,
        ritualDate,
        contactPhone,
        remark || '',
        'PENDING',
        now,
        now,
      )
      .run();

    // 获取订单ID
    const order = await db
      .prepare('SELECT id FROM ritual_orders WHERE order_no = ?')
      .bind(orderNo)
      .first();

    const orderId = (order as any).id;

    return miniappSuccess({
      orderNo,
      orderId,
      amount: packageData.price,
    });
  } catch (error: any) {
    console.error('创建代祭祀订单失败:', error);
    return miniappError(error.message || '下单失败，请稍后重试');
  }
});
