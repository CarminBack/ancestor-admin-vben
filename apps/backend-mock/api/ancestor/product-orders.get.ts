import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

const mockProductOrders = [
  {
    id: '1',
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
  },
  {
    id: '2',
    orderNo: 'SP202609100002',
    productId: '1',
    productName: '纸钱套装',
    productImage: 'https://via.placeholder.com/100',
    quantity: 3,
    price: 29,
    amount: 87,
    receiverName: '赵六',
    receiverPhone: '13900139000',
    receiverAddress: '上海市浦东新区XXX路XXX号',
    status: 'PAID',
    paidAt: '2026-09-10 11:20:00',
    shippedAt: null,
    completedAt: null,
    createdAt: '2026-09-10 11:15:00',
    updatedAt: '2026-09-10 11:20:00',
  },
];

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const query = getQuery(event);
  const { orderNo, receiverName, status, page = 1, pageSize = 10 } = query;

  let filtered = [...mockProductOrders];

  if (orderNo) {
    filtered = filtered.filter((o) =>
      o.orderNo.toLowerCase().includes((orderNo as string).toLowerCase()),
    );
  }

  if (receiverName) {
    filtered = filtered.filter((o) =>
      o.receiverName.toLowerCase().includes((receiverName as string).toLowerCase()),
    );
  }

  if (status) {
    filtered = filtered.filter((o) => o.status === status);
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
