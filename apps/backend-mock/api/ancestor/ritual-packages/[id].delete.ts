/**
 * 祭祀套餐删除
 * DELETE /api/ancestor/ritual-packages/[id]
 */
export default eventHandler(async (event) => {
  try {
    const id = event.context.params?.id;

    const db = event.context.db;

    // 检查套餐是否存在
    const pkg = await db
      .prepare('SELECT * FROM ritual_packages WHERE id = ?')
      .bind(id)
      .first();

    if (!pkg) {
      return notFoundResponse(event, '套餐不存在');
    }

    // 检查是否有订单使用此套餐
    const orderCount = await db
      .prepare(
        'SELECT COUNT(*) as total FROM ritual_orders WHERE package_id = ?',
      )
      .bind(id)
      .first();

    if ((orderCount as any)?.total > 0) {
      return forbiddenResponse(event, '该套餐已被订单使用，不能删除');
    }

    // 物理删除
    await db.prepare('DELETE FROM ritual_packages WHERE id = ?').bind(id).run();

    return successResponse('套餐删除成功');
  } catch (error: any) {
    console.error('删除套餐失败:', error);
    return serverErrorResponse(event, error.message || '删除套餐失败');
  }
});
