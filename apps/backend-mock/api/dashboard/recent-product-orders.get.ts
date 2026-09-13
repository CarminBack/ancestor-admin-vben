export default defineEventHandler(() => {
  const recentOrders = [
    {
      id: '1',
      orderNo: 'SP202609130001',
      receiverName: '张三',
      receiverPhone: '13800138000',
      products: '天地通用纸钱 x2, 黄金元宝（大）x1',
      amount: 174,
      status: 'PENDING_SHIP',
      createdAt: '2024-09-13 09:00:00',
    },
    {
      id: '2',
      orderNo: 'SP202609130002',
      receiverName: '李四',
      receiverPhone: '13800138001',
      products: '白银元宝（中）x3',
      amount: 120,
      status: 'SHIPPED',
      createdAt: '2024-09-13 08:30:00',
    },
    {
      id: '3',
      orderNo: 'SP202609130003',
      receiverName: '王五',
      receiverPhone: '13800138002',
      products: '祭祀套装（豪华版）x1',
      amount: 298,
      status: 'COMPLETED',
      createdAt: '2024-09-13 07:45:00',
    },
  ];

  return useResponseSuccess(recentOrders);
});
