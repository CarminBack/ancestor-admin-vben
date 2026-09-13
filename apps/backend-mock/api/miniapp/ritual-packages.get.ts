import { miniappSuccess } from '~/utils/miniapp-response';

/**
 * 小程序端：祭祀套餐列表
 * GET /api/miniapp/ritual-packages
 */
export default eventHandler(async (event) => {
  try {
    const db = event.context.db;

    const result = await db
      .prepare(
        `
      SELECT 
        id,
        name,
        description,
        cover,
        price,
        sort
      FROM ritual_packages
      WHERE status = 'ACTIVE'
      ORDER BY sort DESC, created_at DESC
    `,
      )
      .all();

    return miniappSuccess(result.results || []);
  } catch (error: any) {
    console.error('获取祭祀套餐失败:', error);
    return miniappSuccess([]);
  }
});
