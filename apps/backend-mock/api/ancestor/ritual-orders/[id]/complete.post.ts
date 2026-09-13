/**
 * 代祭祀订单：完成祭祀
 * POST /api/ancestor/ritual-orders/[id]/complete
 */
export default eventHandler(async (event) => {
  try {
    const id = event.context.params?.id;

    const db = event.context.db;

    // 查询订单
    const order = await db
      .prepare('SELECT * FROM ritual_orders WHERE id = ?')
      .bind(id)
      .first();

    if (!order) {
      return notFoundResponse(event, '订单不存在');
    }

    const orderData = order as any;

    // 必须在待上传视频状态
    if (orderData.status !== 'UPLOAD_VIDEO') {
      return forbiddenResponse(event, '只能对待上传视频状态的订单执行完成操作');
    }

    // 检查必需的视频是否都已上传
    const videos = await db
      .prepare(
        `
      SELECT type 
      FROM ritual_videos 
      WHERE ritual_order_id = ? AND status = 'ACTIVE'
    `,
      )
      .bind(id)
      .all();

    const videoTypes = new Set(
      (videos.results as any[])?.map((v) => v.type) || [],
    );

    // 至少需要准备、封包、焚化三个视频
    const requiredTypes = ['PREPARE', 'PACKAGE', 'BURN'];
    const missingTypes = requiredTypes.filter((t) => !videoTypes.has(t));

    if (missingTypes.length > 0) {
      return forbiddenResponse(
        event,
        `请先上传所有必需的视频：${missingTypes.join('、')}`,
      );
    }

    // 获取操作人信息
    const user = event.context.user || { id: 1, username: 'admin' };

    // 更新订单状态为已完成
    const now = new Date().toISOString();
    await db
      .prepare(
        `
      UPDATE ritual_orders 
      SET status = 'COMPLETED',
          completed_at = ?,
          updated_at = ?
      WHERE id = ?
    `,
      )
      .bind(now, now, id)
      .run();

    // 记录操作日志
    await db
      .prepare(
        `
      INSERT INTO ritual_logs (
        ritual_order_id, from_status, to_status,
        operator_id, operator_name, remark, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .bind(
        id,
        'UPLOAD_VIDEO',
        'COMPLETED',
        user.id,
        user.username,
        '祭祀完成',
        now,
      )
      .run();

    return successResponse('祭祀已完成');
  } catch (error: any) {
    console.error('完成祭祀失败:', error);
    return serverErrorResponse(event, error.message || '完成祭祀失败');
  }
});
