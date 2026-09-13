import prisma from '~/utils/db';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const query = getQuery(event);
  const {
    orderNo,
    receiverName,
    receiverPhone,
    status,
    page = 1,
    pageSize = 10,
  } = query;

  // 构建查询条件
  const where: any = {};

  if (orderNo) {
    where.orderNo = { contains: orderNo as string };
  }

  if (receiverName) {
    where.receiverName = { contains: receiverName as string };
  }

  if (receiverPhone) {
    where.receiverPhone = { contains: receiverPhone as string };
  }

  if (status) {
    where.status = status as string;
  }

  // 查询总数
  const total = await prisma.productOrder.count({ where });

  // 查询数据
  const items = await prisma.productOrder.findMany({
    where,
    skip: (Number(page) - 1) * Number(pageSize),
    take: Number(pageSize),
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: {
          name: true,
          cover: true,
        },
      },
    },
  });

  // 格式化返回数据
  const formattedItems = items.map((item) => ({
    id: item.id,
    orderNo: item.orderNo,
    productId: item.productId,
    productName: item.product.name,
    productImage: item.product.cover || '',
    quantity: item.quantity,
    price: Number(item.price),
    amount: Number(item.amount),
    receiverName: item.receiverName,
    receiverPhone: item.receiverPhone,
    receiverAddress: item.receiverAddress,
    status: item.status,
    paidAt: item.paidAt?.toISOString() || null,
    shippedAt: item.shippedAt?.toISOString() || null,
    completedAt: item.completedAt?.toISOString() || null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return useResponseSuccess({
    items: formattedItems,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  });
});
