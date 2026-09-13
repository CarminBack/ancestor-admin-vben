/**
 * 管理员创建
 * POST /api/ancestor/admins
 */
export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { username, password, nickname, phone, role } = body;

    if (!username) {
      return forbiddenResponse(event, '请填写用户名');
    }

    if (!password) {
      return forbiddenResponse(event, '请填写密码');
    }

    if (password.length < 6) {
      return forbiddenResponse(event, '密码长度不能少于6位');
    }

    const db = event.context.db;

    // 检查用户名是否已存在
    const existUser = await db
      .prepare('SELECT * FROM admins WHERE username = ?')
      .bind(username)
      .first();

    if (existUser) {
      return forbiddenResponse(event, '用户名已存在');
    }

    const now = new Date().toISOString();
    await db
      .prepare(
        `
      INSERT INTO admins (
        username, password, nickname, phone, role, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .bind(
        username,
        password, // 注意：生产环境需要加密
        nickname || username,
        phone || '',
        role || 'RITUAL_ADMIN',
        'ACTIVE',
        now,
        now,
      )
      .run();

    return successResponse('管理员创建成功');
  } catch (error: any) {
    console.error('创建管理员失败:', error);
    return serverErrorResponse(event, error.message || '创建管理员失败');
  }
});
