/**
 * 七牛云上传 token
 * GET /api/ancestor/qiniu/upload-token
 */
export default eventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const type = query.type as string; // 'image' | 'video'

    // 注意：这是 mock 实现
    // 生产环境需要使用真实的七牛云 SDK 生成 token
    // 需要配置 accessKey、secretKey、bucket 等信息

    // Mock token 和配置
    const mockToken = `mock_qiniu_token_${Date.now()}`;
    const mockDomain = 'https://cdn.example.com'; // 七牛云 CDN 域名

    return successResponse({
      token: mockToken,
      domain: mockDomain,
      region: 'z0', // 华东区域
      // 文件上传后的 key 前缀建议
      keyPrefix: type === 'video' ? 'ritual-videos/' : 'images/',
    });
  } catch (error: any) {
    console.error('获取上传 token 失败:', error);
    return serverErrorResponse(event, error.message || '获取上传 token 失败');
  }
});
