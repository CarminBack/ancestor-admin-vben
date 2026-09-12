/**
 * 七牛云上传凭证生成
 * 注意：这是 Mock 环境，实际生产环境应该在真实后端实现
 */

import qiniu from 'qiniu';

// 七牛云配置（生产环境应该从环境变量读取）
const QINIU_CONFIG = {
  accessKey: 'PqEsog-2gjyXt2ih6bMuXQnm1UbiUFIt7h5KxFA6',
  secretKey: 'n3ZbxcOIxOTg-naiR7Ci0SDUw6a8bMwkegAf34u-',
  bucket: 'zdxdwh',
  // 七牛云 CDN 域名
  domain: 'http://tl6w4x7eh.hn-bkt.clouddn.com',
};

export default eventHandler(() => {
  try {
    const { accessKey, secretKey, bucket, domain } = QINIU_CONFIG;

    // 使用七牛云官方 SDK 生成上传凭证
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const options = {
      scope: bucket,
      expires: 3600, // 1小时有效期
    };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    const uploadToken = putPolicy.uploadToken(mac);

    console.log('生成的上传凭证:', uploadToken);
    console.log('七牛云配置:', {
      accessKey,
      bucket,
      domain,
    });

    return {
      code: 0,
      data: {
        uploadToken: uploadToken,
        domain: domain,
      },
    };
  } catch (error) {
    console.error('生成七牛云上传凭证失败:', error);
    throw createError({
      statusCode: 500,
      message: '生成上传凭证失败',
    });
  }
});
