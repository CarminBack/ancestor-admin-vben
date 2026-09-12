import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

const mockCategories = [
  {
    id: '1',
    name: '纸钱',
    image: 'https://via.placeholder.com/100',
    sort: 1,
    status: 1,
    createdAt: '2026-08-01 10:00:00',
  },
  {
    id: '2',
    name: '金元宝',
    image: 'https://via.placeholder.com/100',
    sort: 2,
    status: 1,
    createdAt: '2026-08-01 10:00:00',
  },
  {
    id: '3',
    name: '银元宝',
    image: 'https://via.placeholder.com/100',
    sort: 3,
    status: 1,
    createdAt: '2026-08-01 10:00:00',
  },
  {
    id: '4',
    name: '香烛',
    image: 'https://via.placeholder.com/100',
    sort: 4,
    status: 1,
    createdAt: '2026-08-01 10:00:00',
  },
  {
    id: '5',
    name: '祭祀套装',
    image: 'https://via.placeholder.com/100',
    sort: 5,
    status: 1,
    createdAt: '2026-08-01 10:00:00',
  },
  {
    id: '6',
    name: '其他',
    image: 'https://via.placeholder.com/100',
    sort: 6,
    status: 1,
    createdAt: '2026-08-01 10:00:00',
  },
];

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  return useResponseSuccess({
    items: mockCategories,
    total: mockCategories.length,
  });
});
