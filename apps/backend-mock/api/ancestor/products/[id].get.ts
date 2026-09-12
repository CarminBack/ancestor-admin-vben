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
    name: '纸钱套装',
    categoryId: '1',
    categoryName: '纸钱',
    cover: 'https://via.placeholder.com/200',
    images: ['https://via.placeholder.com/400'],
    description: '优质纸钱，足量充沛',
    price: 29,
    originalPrice: 39,
    stock: 500,
    sales: 128,
    status: 1,
    sort: 1,
    createdAt: '2026-09-01 10:00:00',
    updatedAt: '2026-09-10 10:00:00',
  });
});
