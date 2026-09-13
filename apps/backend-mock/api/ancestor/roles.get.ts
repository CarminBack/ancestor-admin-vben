/**
 * 角色列表
 * GET /api/ancestor/roles
 */
export default eventHandler(async (event) => {
  try {
    // Mock 角色数据
    // 生产环境应该从数据库查询
    const roles = [
      {
        id: 1,
        code: 'SUPER_ADMIN',
        name: '超级管理员',
        description: '拥有所有权限',
        permissions: ['*'],
        status: 'ACTIVE',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        code: 'RITUAL_ADMIN',
        name: '祭祀管理员',
        description: '管理代祭祀订单和视频',
        permissions: [
          'ritual:order:view',
          'ritual:order:edit',
          'ritual:video:upload',
          'ritual:video:view',
          'ritual:record:view',
        ],
        status: 'ACTIVE',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 3,
        code: 'PRODUCT_ADMIN',
        name: '商品管理员',
        description: '管理商品和商品订单',
        permissions: [
          'product:view',
          'product:edit',
          'product:category:view',
          'product:category:edit',
          'product:order:view',
          'product:order:edit',
        ],
        status: 'ACTIVE',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    return successResponse({
      items: roles,
      total: roles.length,
    });
  } catch (error: any) {
    console.error('获取角色列表失败:', error);
    return serverErrorResponse(event, error.message || '获取角色列表失败');
  }
});
