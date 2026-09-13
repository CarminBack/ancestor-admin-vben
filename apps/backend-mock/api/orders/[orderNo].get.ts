export default defineEventHandler(async (event) => {
  const orderNo = getRouterParam(event, 'orderNo');

  if (!orderNo) {
    return {
      code: 400,
      message: '订单号不能为空',
      data: null,
    };
  }

  const db = useDatabase();

  try {
    // 判断订单类型
    if (orderNo.startsWith('JS')) {
      // 祭祀订单
      const result = await db.sql(
        `SELECT 
          order_no as orderNo,
          order_name as customerName,
          deceased_name as deceasedName,
          ritual_date as memorialDate,
          package_name as packageName,
          amount,
          status,
          remark as note,
          created_at as createdAt
        FROM ritual_orders
        WHERE order_no = ?`,
        [orderNo],
      );

      if (!result.rows || result.rows.length === 0) {
        return { code: 404, message: '订单不存在', data: null };
      }

      const order = result.rows[0];

      return {
        code: 200,
        message: 'success',
        data: {
          orderNo: order.orderNo,
          orderType: 'memorial',
          customerName: order.customerName,
          deceasedName: order.deceasedName,
          memorialDate: order.memorialDate,
          packageName: order.packageName,
          amount: order.amount,
          status: mapRitualStatus(order.status),
          note: order.note,
          createdAt: order.createdAt,
        },
      };
    } else if (orderNo.startsWith('SP')) {
      // 用品订单
      const orderResult = await db.sql(
        `SELECT 
          order_no as orderNo,
          total_amount as amount,
          status,
          receiver_name as receiverName,
          receiver_phone as receiverPhone,
          province,
          city,
          district,
          detail_address as detailAddress,
          receiver_address as fullAddress,
          created_at as createdAt
        FROM product_orders
        WHERE order_no = ?`,
        [orderNo],
      );

      if (!orderResult.rows || orderResult.rows.length === 0) {
        return { code: 404, message: '订单不存在', data: null };
      }

      const order = orderResult.rows[0];

      // 查询订单明细
      const itemsResult = await db.sql(
        `SELECT 
          product_id as productId,
          product_name as productName,
          spec_name as spec,
          quantity
        FROM product_order_items
        WHERE order_id = (SELECT id FROM product_orders WHERE order_no = ?)`,
        [orderNo],
      );

      const item = itemsResult.rows[0] || {};

      return {
        code: 200,
        message: 'success',
        data: {
          orderNo: order.orderNo,
          orderType: 'supplies',
          productId: item.productId,
          productName: item.productName,
          spec: item.spec,
          quantity: item.quantity,
          amount: order.amount,
          status: mapProductOrderStatus(order.status),
          receiverName: order.receiverName,
          receiverPhone: order.receiverPhone,
          province: order.province,
          city: order.city,
          district: order.district,
          detailAddress: order.detailAddress,
          fullAddress: order.fullAddress,
          createdAt: order.createdAt,
        },
      };
    } else {
      return { code: 400, message: '订单号格式错误', data: null };
    }
  } catch (error: any) {
    console.error('查询订单详情失败:', error);
    return {
      code: 500,
      message: error.message || '查询订单详情失败',
      data: null,
    };
  }
});

// 祭祀订单状态映射
function mapRitualStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING_SERVICE: 'pending_service',
    PENDING_PAYMENT: 'pending_payment',
    PAID: 'paid',
    PENDING_RITUAL: 'processing',
    PREPARING: 'processing',
    PACKAGING: 'processing',
    BURNING: 'processing',
    PENDING_VIDEO_UPLOAD: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };
  return map[status] || 'pending_service';
}

// 用品订单状态映射
function mapProductOrderStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING_SERVICE: 'pending_service',
    PENDING_PAYMENT: 'pending_payment',
    PAID: 'paid',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };
  return map[status] || 'pending_service';
}
