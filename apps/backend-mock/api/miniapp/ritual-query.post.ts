import { miniappError, miniappSuccess } from '~/utils/miniapp-response';

/**
 * 小程序端：通过姓名查询祭祀视频
 * POST /api/miniapp/ritual-query
 */
export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { orderName, deceasedName } = body;

    // 参数校验
    if (!orderName || !deceasedName) {
      return miniappError('请输入下单人姓名和亡故亲人姓名');
    }

    const db = event.context.db;

    // 精准匹配姓名 + 只返回已完成的订单
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
        ro.amount,
        ro.status,
        ro.created_at as createdAt
      FROM ritual_orders ro
      WHERE ro.order_name = ?
        AND ro.deceased_name = ?
        AND ro.status = 'COMPLETED'
        AND ro.deleted_at IS NULL
      ORDER BY ro.ritual_date DESC, ro.created_at DESC
    `,
      )
      .bind(orderName, deceasedName)
      .all();

    if (!orders.results || orders.results.length === 0) {
      return miniappError('未找到对应的祭祀记录，请确认姓名是否正确');
    }

    // 查询每个订单的视频
    const results = await Promise.all(
      orders.results.map(async (order: any) => {
        const videos = await db
          .prepare(
            `
          SELECT 
            type,
            title,
            video_url as videoUrl,
            thumbnail_url as thumbnailUrl,
            duration,
            file_size as fileSize
          FROM ritual_videos
          WHERE ritual_order_id = ?
            AND status = 'ACTIVE'
          ORDER BY 
            CASE type
              WHEN 'PREPARE' THEN 1
              WHEN 'PACKAGE' THEN 2
              WHEN 'BURN' THEN 3
              WHEN 'FULL' THEN 4
            END
        `,
          )
          .bind(order.id)
          .all();

        const videoMap: Record<string, any> = {};
        if (videos.results) {
          for (const video of videos.results as any[]) {
            videoMap[video.type.toLowerCase()] = {
              title: video.title,
              url: video.videoUrl,
              thumbnail: video.thumbnailUrl,
              duration: video.duration,
              fileSize: video.fileSize,
            };
          }
        }

        return {
          orderNo: order.orderNo,
          orderName: order.orderName,
          deceasedName: order.deceasedName,
          packageName: order.packageName,
          ritualDate: order.ritualDate,
          amount: order.amount,
          createdAt: order.createdAt,
          videos: videoMap,
        };
      }),
    );

    return miniappSuccess(results);
  } catch (error: any) {
    console.error('查询祭祀记录失败:', error);
    return miniappError(error.message || '查询失败，请稍后重试');
  }
});
