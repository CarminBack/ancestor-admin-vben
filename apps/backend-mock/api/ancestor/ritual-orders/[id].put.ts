import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// 导入共享存储
import { orderStore } from './[id].get';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const id = getRouterParam(event, 'id');
  const body = await readBody(event);

  // 保存订单状态到共享存储
  if (!orderStore[id!]) {
    orderStore[id!] = {};
  }
  orderStore[id!] = {
    ...orderStore[id!],
    ...body,
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };

  console.log(`订单 ${id} 状态已更新:`, orderStore[id!]);

  return useResponseSuccess({
    id,
    ...orderStore[id!],
  });
});
