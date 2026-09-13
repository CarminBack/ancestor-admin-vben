/**
 * 祭祀视频删除
 * DELETE /api/ancestor/ritual-videos/[id]
 */
export default eventHandler(async (event) => {
  try {
    const id = event.context.params?.id;

    const db = event.context.db;

    // 查询视频
    const video = await db
      .prepare('SELECT * FROM ritual_videos WHERE id = ?')
      .bind(id)
      .first();

    if (!video) {
      return notFoundResponse(event, '视频不存在');
    }

    const videoData = video as any;

    // 查询关联的订单
    const order = await db
      .prepare('SELECT * FROM ritual_orders WHERE id = ?')
      .bind(videoData.ritual_order_id)
      .first();

    if (order) {
      const orderData = order as any;
      // 如果订单已完成，不允许删除视频
      if (orderData.status === 'COMPLETED') {
        return forbiddenResponse(event, '已完成的订单视频不允许删除');
      }
    }

    // 逻辑删除
    const now = new Date().toISOString();
    await db
      .prepare(
        `
      UPDATE ritual_videos 
      SET status = 'DELETED',
          updated_at = ?
      WHERE id = ?
    `,
      )
      .bind(now, id)
      .run();

    return successResponse('视频已删除');
  } catch (error: any) {
    console.error('删除视频失败:', error);
    return serverErrorResponse(event, error.message || '删除视频失败');
  }
});
