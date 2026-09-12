/**
 * 生成七牛云私有空间下载链接
 */

import crypto from 'crypto';

// 七牛云配置（生产环境应该从环境变量读取）
const QINIU_CONFIG = {
  accessKey: 'PqEsog-2gjyXt2ih6bMuXQnm1UbiUFIt7h5KxFA6',
  secretKey: 'n3ZbxcOIxOTg-naiR7Ci0SDUw6a8bMwkegAf34u-',
  domain: 'http://tl6w4x7eh.hn-bkt.clouddn.com',
};

/**
 * 生成私有空间下载链接
 */
function generateDownloadUrl(key: string, expires: number = 3600) {
  const { accessKey, secretKey, domain } = QINIU_CONFIG;

  // 构建基础 URL
  const baseUrl = `${domain}/${key}`;
  const deadline = Math.floor(Date.now() / 1000) + expires;

  // 待签名字符串
  const signStr = `${baseUrl}?e=${deadline}`;

  // 使用 HMAC-SHA1 签名
  const sign = crypto
    .createHmac('sha1', secretKey)
    .update(signStr)
    .digest('base64url');

  // 生成带签名的下载链接
  const downloadUrl = `${signStr}&token=${accessKey}:${sign}`;

  return downloadUrl;
}

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { url, expires = 3600 } = body;

    if (!url) {
      throw createError({
        statusCode: 400,
        message: '缺少 url 参数',
      });
    }

    // 从 URL 中提取 key
    const urlObj = new URL(url);
    const key = urlObj.pathname.startsWith('/')
      ? urlObj.pathname.substring(1)
      : urlObj.pathname;

    const downloadUrl = generateDownloadUrl(key, expires);

    return {
      code: 0,
      data: {
        downloadUrl,
      },
    };
  } catch (error) {
    console.error('生成下载链接失败:', error);
    throw createError({
      statusCode: 500,
      message: '生成下载链接失败',
    });
  }
});
