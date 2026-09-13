/**
 * 管理员更新
 * PUT /api/ancestor/admins/[id]
 */
export default eventHandler(async (event) => {
  try {
    const id = event.context.params?.id;
    const body = await readBody(event);
    const { nickname, phone, role, status } = body;

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
      SET nickname = ?,
          phone = ?,
          role = ?,
          status = ?,
          updated_at = ?
      WHERE id = ?
    `,
      )
      .bind(
        nickname || (admin as any).nickname,
        phone || (admin as any).phone,
        role || (admin as any).role,
        status || (admin as any).status,
        now,
        id,
      )
      .run();

    return successResponse('管理员更新成功');
  } catch (error: any) {
    console.error('更新管理员失败:', error);
    return serverErrorResponse(event, error.message || '更新管理员失败');
  }
});
