/**
 * 管理员删除
 * DELETE /api/ancestor/admins/[id]
 */
export default eventHandler(async (event) => {
  try {
    const id = event.context.params?.id;

    const db = event.context.db;

    // 检查管理员是否存在
    const admin = await db
      .prepare('SELECT * FROM admins WHERE id = ?')
      .bind(id)
      .first();

    if (!admin) {
      return notFoundResponse(event, '管理员不存在');
    }

    const adminData = admin as any;

    // 超级管理员不能删除
    if (adminData.role === 'SUPER_ADMIN') {
      return forbiddenResponse(event, '超级管理员不能删除');
    }

    // 物理删除
    await db.prepare('DELETE FROM admins WHERE id = ?').bind(id).run();

    return successResponse('管理员删除成功');
  } catch (error: any) {
    console.error('删除管理员失败:', error);
    return serverErrorResponse(event, error.message || '删除管理员失败');
  }
});
