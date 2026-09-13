/**
 * 祭祀操作日志
 * GET /api/ancestor/ritual-orders/[id]/logs
 */
export default eventHandler(async (event) => {
  try {
    const id = event.context.params?.id;

    const db = event.context.db;

    const logs = await db
      .prepare(
        `
      SELECT 
        id,
        from_status as fromStatus,
        to_status as toStatus,
        operator_id as operatorId,
        operator_name as operatorName,
        remark,
        created_at as createdAt
      FROM ritual_logs
      WHERE ritual_order_id = ?
      ORDER BY created_at DESC
    `,
      )
      .bind(id)
      .all();

    return successResponse(logs.results || []);
  } catch (error: any) {
    console.error('获取操作日志失败:', error);
    return serverErrorResponse(event, error.message || '获取操作日志失败');
  }
});
