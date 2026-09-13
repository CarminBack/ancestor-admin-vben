/**
 * 祭祀套餐更新
 * PUT /api/ancestor/ritual-packages/[id]
 */
export default eventHandler(async (event) => {
  try {
    const id = event.context.params?.id;
    const body = await readBody(event);
    const { name, description, cover, price, sort, status } = body;

    if (!name) {
      return forbiddenResponse(event, '请填写套餐名称');
    }

    if (!price || price < 0) {
      return forbiddenResponse(event, '请填写正确的价格');
    }

    const db = event.context.db;

    // 检查套餐是否存在
    const pkg = await db
      .prepare('SELECT * FROM ritual_packages WHERE id = ?')
      .bind(id)
      .first();

    if (!pkg) {
      return notFoundResponse(event, '套餐不存在');
    }

    const now = new Date().toISOString();
    await db
      .prepare(
        `
      UPDATE ritual_packages 
      SET name = ?,
          description = ?,
          cover = ?,
          price = ?,
          sort = ?,
          status = ?,
          updated_at = ?
      WHERE id = ?
    `,
      )
      .bind(
        name,
        description || '',
        cover || '',
        price,
        sort || 0,
        status || 'ACTIVE',
        now,
        id,
      )
      .run();

    return successResponse('套餐更新成功');
  } catch (error: any) {
    console.error('更新套餐失败:', error);
    return serverErrorResponse(event, error.message || '更新套餐失败');
  }
});
