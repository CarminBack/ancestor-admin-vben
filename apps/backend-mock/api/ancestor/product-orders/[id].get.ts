import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const id = getRouterParam(event, 'id');

  return useResponseSuccess({
    id,
    orderNo: 'SP202609100001',
    productId: '2',
    productName: '金元宝',
    productImage: 'https://via.placeholder.com/100',
    quantity: 2,
    price: 39,
    amount: 78,
    receiverName: '王五',
    receiverPhone: '13800138000',
    receiverAddress: '北京市朝阳区XXX街道XXX号',
    status: 'SHIPPED',
    paidAt: '2026-09-10 09:35:00',
    shippedAt: '2026-09-10 14:00:00',
    completedAt: null,
    createdAt: '2026-09-10 09:30:00',
    updatedAt: '2026-09-10 14:00:00',
  });
});
