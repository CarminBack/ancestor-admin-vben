import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

const mockPackages = [
  {
    id: '1',
    name: '诚心祭祀',
    description: '包含纸钱、金元宝、银元宝、香烛等基础祭祀用品',
    cover: 'https://via.placeholder.com/200',
    price: 268,
    sort: 2,
    status: 1,
    createdAt: '2026-08-01 10:00:00',
    updatedAt: '2026-08-01 10:00:00',
  },
  {
    id: '2',
    name: '基础祭祀',
    description: '包含纸钱、香烛等基础祭祀用品',
    cover: 'https://via.placeholder.com/200',
    price: 168,
    sort: 1,
    status: 1,
    createdAt: '2026-08-01 10:00:00',
    updatedAt: '2026-08-01 10:00:00',
  },
  {
    id: '3',
    name: '敬亲祭祀',
    description: '包含纸钱、金元宝、银元宝、香烛、水果等高级祭祀用品',
    cover: 'https://via.placeholder.com/200',
    price: 398,
    sort: 3,
    status: 1,
    createdAt: '2026-08-01 10:00:00',
    updatedAt: '2026-08-01 10:00:00',
  },
];

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  return useResponseSuccess({
    items: mockPackages,
    total: mockPackages.length,
  });
});
