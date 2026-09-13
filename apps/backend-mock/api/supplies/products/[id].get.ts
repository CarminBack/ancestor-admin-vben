export default defineEventHandler(async (event) => {
  const productId = getRouterParam(event, 'id');

  if (!productId) {
    return {
      code: 400,
      message: '商品ID不能为空',
      data: null,
    };
  }

  const db = useDatabase();

  try {
    // 查询商品详情
    const productResult = await db.sql(
      `SELECT 
        p.id,
        p.code,
        p.name,
        p.description,
        p.cover as coverImage,
        p.price,
        p.stock,
        p.sales,
        p.created_at as createdAt,
        pc.code as categoryCode,
        pc.name as categoryName
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.code = ? AND p.status = 'ACTIVE'`,
      [productId],
    );

    if (!productResult.rows || productResult.rows.length === 0) {
      return {
        code: 404,
        message: '商品不存在或已下架',
        data: null,
      };
    }

    const product = productResult.rows[0];

    // 查询商品规格
    const specsResult = await db.sql(
      `SELECT id, name, price, stock
       FROM product_specs
       WHERE product_id = ? AND status = 'ACTIVE'
       ORDER BY sort DESC`,
      [product.id],
    );

    return {
      code: 200,
      message: 'success',
      data: {
        id: product.code,
        name: product.name,
        description: product.description || '',
        price: product.price,
        coverImage: product.coverImage,
        detailImages: [product.coverImage], // 简化版
        categories: [product.categoryName],
        categoryCodes: [product.categoryCode],
        options: specsResult.rows.map((spec: any) => ({
          name: spec.name,
          price: spec.price,
          stock: spec.stock,
        })),
        stock: product.stock,
        sales: product.sales || 0,
        createdAt: product.createdAt,
      },
    };
  } catch (error: any) {
    console.error('查询商品详情失败:', error);
    return {
      code: 500,
      message: error.message || '查询商品详情失败',
      data: null,
    };
  }
});
