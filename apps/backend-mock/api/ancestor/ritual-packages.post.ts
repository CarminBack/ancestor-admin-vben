/**
 * 祭祀套餐创建
 * POST /api/ancestor/ritual-packages
 */
export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { name, description, cover, price, sort, status } = body;

    if (!name) {
      return forbiddenResponse(event, '请填写套餐名称');
    }

    if (!price || price < 0) {
      return forbiddenResponse(event, '请填写正确的价格');
    }

    const db = event.context.db;

    const now = new Date().toISOString();
    await db
      .prepare(
        `
      INSERT INTO ritual_packages (
        name, description, cover, price, sort, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
        now,
      )
      .run();

    return successResponse('套餐创建成功');
  } catch (error: any) {
    console.error('创建套餐失败:', error);
    return serverErrorResponse(event, error.message || '创建套餐失败');
  }
});
