/**
 * 祭祀视频列表
 * GET /api/ancestor/ritual-videos
 */
export default eventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const ritualOrderId = query.ritualOrderId as string;
    const type = query.type as string;

    const db = event.context.db;

    let whereClause = 'rv.status = "ACTIVE"';
    const params: any[] = [];

    if (ritualOrderId) {
      whereClause += ' AND rv.ritual_order_id = ?';
      params.push(ritualOrderId);
    }

    if (type) {
      whereClause += ' AND rv.type = ?';
      params.push(type);
    }

    // 查询总数
    const countResult = await db
      .prepare(
        `SELECT COUNT(*) as total FROM ritual_videos rv WHERE ${whereClause}`,
      )
      .bind(...params)
      .first();

    const total = (countResult as any)?.total || 0;

    // 查询列表
    const offset = (page - 1) * pageSize;
    const listQuery = `
      SELECT 
        rv.id,
        rv.ritual_order_id as ritualOrderId,
        rv.type,
        rv.title,
        rv.video_url as videoUrl,
        rv.thumbnail_url as thumbnailUrl,
        rv.duration,
        rv.file_size as fileSize,
        rv.created_by as createdBy,
        rv.created_at as createdAt,
        ro.order_no as orderNo,
        ro.order_name as orderName,
        ro.deceased_name as deceasedName
      FROM ritual_videos rv
      LEFT JOIN ritual_orders ro ON rv.ritual_order_id = ro.id
      WHERE ${whereClause}
      ORDER BY rv.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const listResult = await db
      .prepare(listQuery)
      .bind(...params, pageSize, offset)
      .all();

    return successResponse({
      items: listResult.results || [],
      total,
    });
  } catch (error: any) {
    console.error('获取视频列表失败:', error);
    return serverErrorResponse(event, error.message || '获取视频列表失败');
  }
});
