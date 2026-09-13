/**
 * 管理员列表
 * GET /api/ancestor/admins
 */
export default eventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const username = query.username as string;
    const phone = query.phone as string;
    const status = query.status as string;

    const db = event.context.db;

    let whereClause = '1=1';
    const params: any[] = [];

    if (username) {
      whereClause += ' AND username LIKE ?';
      params.push(`%${username}%`);
    }

    if (phone) {
      whereClause += ' AND phone LIKE ?';
      params.push(`%${phone}%`);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // 查询总数
    const countResult = await db
      .prepare(`SELECT COUNT(*) as total FROM admins WHERE ${whereClause}`)
      .bind(...params)
      .first();

    const total = (countResult as any)?.total || 0;

    // 查询列表
    const offset = (page - 1) * pageSize;
    const listQuery = `
      SELECT 
        id,
        username,
        nickname,
        phone,
        role,
        status,
        last_login_at as lastLoginAt,
        created_at as createdAt
      FROM admins
      WHERE ${whereClause}
      ORDER BY created_at DESC
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
    console.error('获取管理员列表失败:', error);
    return serverErrorResponse(event, error.message || '获取管理员列表失败');
  }
});
