/**
 * 七牛云上传工具
 */

export interface QiniuConfig {
  uploadToken: string;
  domain: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * 获取七牛云上传凭证
 * 从后端接口获取上传凭证和 CDN 域名
 */
export async function getQiniuToken(): Promise<QiniuConfig> {
  try {
    // 调用后端接口获取上传凭证
    const { requestClient } = await import('#/api/request');
    console.log('开始调用后端接口获取 token...');
    const res = await requestClient.get<QiniuConfig>('/ancestor/qiniu-token');
    console.log('后端接口返回:', res);
    return res;
  } catch (error) {
    console.error('获取七牛云 token 失败:', error);
    throw error;
  }
}

/**
 * 上传文件到七牛云
 * @param file 要上传的文件
 * @param token 上传凭证
 * @param onProgress 进度回调
 * @returns 返回文件的 CDN URL
 */
export async function uploadToQiniu(
  file: File,
  config: QiniuConfig,
  onProgress?: (progress: UploadProgress) => void,
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop();
    const key = `ritual-videos/${timestamp}-${randomStr}.${ext}`;

    try {
      // 动态导入七牛云 SDK
      const qiniu = await import('qiniu-js');

      // 上传配置
      const putExtra = {
        fname: file.name,
        params: {},
        mimeType: file.type || 'video/mp4',
      };

      const uploadConfig = {
        useCdnDomain: true,
        // region: qiniu.region.z2, // 华南-广东
        // 让七牛自动检测区域
      };

      // 开始上传
      const observable = qiniu.upload(
        file,
        key,
        config.uploadToken,
        putExtra,
        uploadConfig,
      );

      // 订阅上传事件
      observable.subscribe({
        next: (result: any) => {
          // 上传进度
          if (onProgress) {
            onProgress({
              loaded: result.total.loaded,
              total: result.total.size,
              percent: Math.round(result.total.percent),
            });
          }
        },
        error: (err: any) => {
          console.error('七牛云上传失败:', err);
          console.error('错误详细信息:', {
            message: err?.message,
            code: err?.code,
            reqId: err?.reqId,
            error: err?.error,
            isRequestError: err?.isRequestError,
            raw: err,
          });
          const errorMsg = err?.message || err?.error || err?.code || '未知错误';
          reject(new Error(`视频上传失败: ${errorMsg}`));
        },
        complete: (res: any) => {
          console.log('七牛云上传完成，响应:', res);
          // 上传完成，返回 CDN URL
          const url = `${config.domain}/${res.key}`;
          console.log('生成的视频 URL:', url);
          resolve(url);
        },
      });
    } catch (error) {
      console.error('七牛云上传错误:', error);
      reject(error);
    }
  });
}
