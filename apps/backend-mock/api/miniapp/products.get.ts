import { miniappSuccess } from '~/utils/miniapp-response';

/**
 * 小程序端：商品列表
 * GET /api/miniapp/products
 */
export default eventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const categoryId = query.categoryId as string;
    const keyword = query.keyword as string;

    const db = event.context.db;

    let whereClause = 'p.status = "ON_SHELF" AND p.deleted_at IS NULL';
    const params: any[] = [];

    if (categoryId) {
      whereClause += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    if (keyword) {
      whereClause += ' AND p.name LIKE ?';
      params.push(`%${keyword}%`);
    }

    // 查询总数
    const countResult = await db
      .prepare(`SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`)
      .bind(...params)
      .first();

    const total = (countResult as any)?.total || 0;

    // 查询列表
    const offset = (page - 1) * pageSize;
    const listQuery = `
      SELECT 
        p.id,
        p.name,
        p.cover,
        p.description,
        p.price,
        p.original_price as originalPrice,
        p.stock,
        p.sales,
        p.category_id as categoryId,
        c.name as categoryName
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      WHERE ${whereClause}
      ORDER BY p.sort DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const listResult = await db
      .prepare(listQuery)
      .bind(...params, pageSize, offset)
      .all();

    return miniappSuccess({
      items: listResult.results || [],
      total,
      page,
      pageSize,
    });
  } catch (error: any) {
    console.error('获取商品列表失败:', error);
    return miniappSuccess({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    });
  }
});
