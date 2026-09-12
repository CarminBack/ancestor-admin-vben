import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// 导入共享存储
import { videoStore } from '../[id].get';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const orderId = getRouterParam(event, 'id');
  const body = await readBody(event);

  // 初始化订单的视频数组
  if (!videoStore[orderId!]) {
    videoStore[orderId!] = [];
  }

  // 创建新视频记录
  const newVideo = {
    id: Date.now().toString(),
    videoUrl: body.videoUrl,
    stage: body.stage,
    availableAt: body.availableAt || null,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };

  videoStore[orderId!].push(newVideo);

  console.log(`视频已保存到订单 ${orderId}:`, newVideo);

  return useResponseSuccess(newVideo);
});
