import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

const mockProducts = [
  {
    id: '1',
    name: '纸钱套装',
    categoryId: '1',
    categoryName: '纸钱',
    cover: 'https://via.placeholder.com/200',
    description: '优质纸钱，足量充沛',
    price: 29,
    originalPrice: 39,
    stock: 500,
    sales: 128,
    status: 1,
    sort: 1,
    createdAt: '2026-09-01 10:00:00',
    updatedAt: '2026-09-10 10:00:00',
  },
  {
    id: '2',
    name: '金元宝',
    categoryId: '2',
    categoryName: '金元宝',
    cover: 'https://via.placeholder.com/200',
    description: '精美金元宝，送财运',
    price: 39,
    originalPrice: 49,
    stock: 300,
    sales: 89,
    status: 1,
    sort: 2,
    createdAt: '2026-09-01 10:00:00',
    updatedAt: '2026-09-10 10:00:00',
  },
  {
    id: '3',
    name: '银元宝',
    categoryId: '3',
    categoryName: '银元宝',
    cover: 'https://via.placeholder.com/200',
    description: '精美银元宝',
    price: 35,
    originalPrice: 45,
    stock: 200,
    sales: 67,
    status: 1,
    sort: 3,
    createdAt: '2026-09-01 10:00:00',
    updatedAt: '2026-09-10 10:00:00',
  },
];

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const query = getQuery(event);
  const { name, categoryId, status, page = 1, pageSize = 10 } = query;

  let filtered = [...mockProducts];

  if (name) {
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes((name as string).toLowerCase()),
    );
  }

  if (categoryId) {
    filtered = filtered.filter((p) => p.categoryId === categoryId);
  }

  if (status !== undefined && status !== '') {
    filtered = filtered.filter((p) => p.status === Number(status));
  }

  const start = (Number(page) - 1) * Number(pageSize);
  const end = start + Number(pageSize);
  const items = filtered.slice(start, end);

  return useResponseSuccess({
    items,
    total: filtered.length,
    page: Number(page),
    pageSize: Number(pageSize),
  });
});
