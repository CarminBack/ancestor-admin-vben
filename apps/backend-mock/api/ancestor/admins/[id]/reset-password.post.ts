/**
 * 管理员重置密码
 * POST /api/ancestor/admins/[id]/reset-password
 */
export default eventHandler(async (event) => {
  try {
    const id = event.context.params?.id;
    const body = await readBody(event);
    const { newPassword } = body;

    if (!newPassword) {
      return forbiddenResponse(event, '请填写新密码');
    }

    if (newPassword.length < 6) {
      return forbiddenResponse(event, '密码长度不能少于6位');
    }

    const db = event.context.db;

    // 检查管理员是否存在
    const admin = await db
      .prepare('SELECT * FROM admins WHERE id = ?')
      .bind(id)
      .first();

    if (!admin) {
      return notFoundResponse(event, '管理员不存在');
    }

    const now = new Date().toISOString();
    await db
      .prepare(
        `
      UPDATE admins 
      SET password = ?,
          updated_at = ?
      WHERE id = ?
    `,
      )
      .bind(
        newPassword, // 注意：生产环境需要加密
        now,
        id,
      )
      .run();

    return successResponse('密码重置成功');
  } catch (error: any) {
    console.error('重置密码失败:', error);
    return serverErrorResponse(event, error.message || '重置密码失败');
  }
});
