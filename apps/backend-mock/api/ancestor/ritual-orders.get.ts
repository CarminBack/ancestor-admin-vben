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
    orderName,
    deceasedName,
    status,
    page = 1,
    pageSize = 10,
  } = query;

  // 构建查询条件
  const where: any = {};

  if (orderNo) {
    where.orderNo = { contains: orderNo as string };
  }

  if (orderName) {
    where.orderName = { contains: orderName as string };
  }

  if (deceasedName) {
    where.deceasedName = { contains: deceasedName as string };
  }

  if (status) {
    where.status = status as string;
  }

  // 查询总数
  const total = await prisma.ritualOrder.count({ where });

  // 查询数据
  const items = await prisma.ritualOrder.findMany({
    where,
    skip: (Number(page) - 1) * Number(pageSize),
    take: Number(pageSize),
    orderBy: { createdAt: 'desc' },
    include: {
      package: {
        select: {
          name: true,
        },
      },
      videos: true,
    },
  });

  // 格式化返回数据
  const formattedItems = items.map((item) => ({
    id: item.id,
    orderNo: item.orderNo,
    orderName: item.orderName,
    deceasedName: item.deceasedName,
    packageId: item.packageId,
    packageName: item.package.name,
    ritualDate: item.ritualDate,
    amount: Number(item.amount),
    status: item.status,
    videoCount: item.videos.length,
    remark: item.remark || '',
    paidAt: item.paidAt?.toISOString() || null,
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
