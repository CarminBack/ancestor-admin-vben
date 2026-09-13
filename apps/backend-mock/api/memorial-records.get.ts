export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { orderNo, customerName, deceasedName } = query;

  const db = useDatabase();

  try {
    let sql = `
      SELECT 
        ro.order_no as orderNo,
        ro.order_name as customerName,
        ro.deceased_name as deceasedName,
        ro.ritual_date as memorialDate,
        ro.package_name as packageName,
        ro.amount,
        ro.status
      FROM ritual_orders ro
      WHERE ro.status = 'COMPLETED'
    `;

    const params: any[] = [];

    // 按订单号查询（优先）
    if (orderNo) {
      sql += ` AND ro.order_no = ?`;
      params.push(orderNo);
    }
    // 按姓名组合查询
    else if (customerName && deceasedName) {
      sql += ` AND ro.order_name = ? AND ro.deceased_name = ?`;
      params.push(customerName, deceasedName);
    }
    // 参数不足
    else {
      return {
        code: 400,
        message: '请提供订单号或（下单人姓名+亡故亲人姓名）',
        data: null,
      };
    }

    sql += ` ORDER BY ro.ritual_date DESC`;

    const ordersResult = await db.sql(sql, params);

    if (!ordersResult.rows || ordersResult.rows.length === 0) {
      return {
        code: 200,
        message: 'success',
        data: [],
      };
    }

    // 查询每个订单的视频
    const records = await Promise.all(
      ordersResult.rows.map(async (order: any) => {
        const videosResult = await db.sql(
          `SELECT 
            type,
            title,
            video_url as videoUrl,
            thumbnail_url as coverImage,
            duration,
            created_at as createdAt
          FROM ritual_videos
          WHERE ritual_order_id = (
            SELECT id FROM ritual_orders WHERE order_no = ?
          ) AND status = 'ACTIVE'
          ORDER BY 
            CASE type
              WHEN 'PREPARE' THEN 1
              WHEN 'PACKAGE' THEN 2
              WHEN 'BURN' THEN 3
              WHEN 'FULL' THEN 4
            END`,
          [order.orderNo],
        );

        // 按类型组织视频
        const videos: Record<string, any> = {};
        videosResult.rows.forEach((video: any) => {
          const typeKey = video.type.toLowerCase().replace('_', '');
          videos[typeKey] = {
            title: video.title || getDefaultVideoTitle(video.type),
            videoUrl: video.videoUrl,
            coverImage: video.coverImage,
            duration: video.duration,
            createdAt: video.createdAt,
          };
        });

        return {
          orderNo: order.orderNo,
          customerName: order.customerName,
          deceasedName: order.deceasedName,
          memorialDate: order.memorialDate,
          packageName: order.packageName,
          amount: order.amount,
          status: 'completed',
          videos,
        };
      }),
    );

    return {
      code: 200,
      message: 'success',
      data: records,
    };
  } catch (error: any) {
    console.error('查询祭祀记录失败:', error);
    return {
      code: 500,
      message: error.message || '查询祭祀记录失败',
      data: null,
    };
  }
});

// 获取默认视频标题
function getDefaultVideoTitle(type: string): string {
  const titles: Record<string, string> = {
    PREPARE: '祭祀准备',
    PACKAGE: '封包',
    BURN: '焚化',
    FULL: '完整祭祀',
  };
  return titles[type] || '祭祀视频';
}
