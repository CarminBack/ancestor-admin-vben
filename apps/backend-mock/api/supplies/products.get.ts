export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { category, page = 1, pageSize = 10 } = query;

  const db = useDatabase();

  try {
    // 构建查询条件
    let sql = `
      SELECT 
        p.id,
        p.code,
        p.name,
        p.description,
        p.cover as coverImage,
        p.price,
        p.stock,
        p.sales,
        pc.code as categoryCode,
        pc.name as categoryName
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.status = 'ACTIVE'
    `;

    const params: any[] = [];

    // 按分类筛选
    if (category) {
      sql += ` AND pc.code = ?`;
      params.push(category);
    }

    // 排序
    sql += ` ORDER BY p.sort DESC, p.created_at DESC`;

    // 分页
    const offset = (Number(page) - 1) * Number(pageSize);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), offset);

    const products = await db.sql(sql, params);

    // 获取总数
    let countSql = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.status = 'ACTIVE'
    `;
    const countParams: any[] = [];
    if (category) {
      countSql += ` AND pc.code = ?`;
      countParams.push(category);
    }
    const countResult = await db.sql(countSql, countParams);
    const total = countResult.rows[0]?.total || 0;

    // 获取每个商品的规格
    const items = await Promise.all(
      products.rows.map(async (product: any) => {
        const specs = await db.sql(
          `SELECT id, name, price, stock 
           FROM product_specs 
           WHERE product_id = ? AND status = 'ACTIVE'
           ORDER BY sort DESC`,
          [product.id],
        );

        return {
          id: product.code,
          name: product.name,
          description: product.description || '',
          price: product.price,
          coverImage: product.coverImage,
          detailImages: [product.coverImage], // 简化版，实际应该有多张详情图
          categories: [product.categoryName],
          categoryCodes: [product.categoryCode],
          options: specs.rows.map((spec: any) => ({
            name: spec.name,
            price: spec.price,
            stock: spec.stock,
          })),
          stock: product.stock,
          sales: product.sales || 0,
        };
      }),
    );

    return {
      code: 200,
      message: 'success',
      data: {
        items,
        total,
      },
    };
  } catch (error: any) {
    console.error('查询商品列表失败:', error);
    return {
      code: 500,
      message: error.message || '查询商品列表失败',
      data: null,
    };
  }
});
