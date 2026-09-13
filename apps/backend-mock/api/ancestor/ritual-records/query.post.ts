/**
 * 祭祀记录查询（用户端接口）
 * POST /api/ancestor/ritual-records/query
 */
export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { orderName, deceasedName } = body;

    if (!orderName || !deceasedName) {
      return forbiddenResponse(event, '请填写下单人姓名和亡故亲人姓名');
    }

    const db = event.context.db;

    // 精准匹配，只返回已完成的订单
    const orders = await db
      .prepare(
        `
      SELECT 
        ro.id,
        ro.order_no as orderNo,
        ro.order_name as orderName,
        ro.deceased_name as deceasedName,
        ro.package_name as packageName,
        ro.ritual_date as ritualDate,
        ro.status,
        ro.completed_at as completedAt
      FROM ritual_orders ro
      WHERE ro.order_name = ?
        AND ro.deceased_name = ?
        AND ro.status = 'COMPLETED'
      ORDER BY ro.ritual_date DESC
    `,
      )
      .bind(orderName, deceasedName)
      .all();

    if (!orders.results || orders.results.length === 0) {
      return notFoundResponse(event, '未找到相关祭祀记录');
    }

    // 为每个订单查询视频
    const records = await Promise.all(
      (orders.results as any[]).map(async (order) => {
        const videos = await db
          .prepare(
            `
          SELECT 
            type,
            video_url as videoUrl,
            thumbnail_url as thumbnailUrl,
            duration
          FROM ritual_videos
          WHERE ritual_order_id = ? AND status = 'ACTIVE'
        `,
          )
          .bind(order.id)
          .all();

        const videoMap: Record<string, any> = {};
        (videos.results as any[])?.forEach((v) => {
          videoMap[v.type.toLowerCase()] = {
            url: v.videoUrl,
            thumbnail: v.thumbnailUrl,
            duration: v.duration,
          };
        });

        return {
          ...order,
          videos: videoMap,
        };
      }),
    );

    return successResponse(records);
  } catch (error: any) {
    console.error('查询祭祀记录失败:', error);
    return serverErrorResponse(event, error.message || '查询祭祀记录失败');
  }
});
