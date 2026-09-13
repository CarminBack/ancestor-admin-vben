export default defineEventHandler(() => {
  const recentOrders = [
    {
      id: '1',
      orderNo: 'JZ202609130001',
      customerName: '张三',
      deceasedName: '张XX',
      packageName: '诚心祭祀',
      ritualDate: '2026-09-15',
      status: 'PAID',
      createdAt: '2024-09-13 09:30:00',
    },
    {
      id: '2',
      orderNo: 'JZ202609130002',
      customerName: '李四',
      deceasedName: '李XX',
      packageName: '基础祭祀',
      ritualDate: '2026-09-14',
      status: 'PREPARING',
      createdAt: '2024-09-13 10:15:00',
    },
    {
      id: '3',
      orderNo: 'JZ202609130003',
      customerName: '王五',
      deceasedName: '王XX',
      packageName: '敬亲祭祀',
      ritualDate: '2026-09-16',
      status: 'PACKAGING',
      createdAt: '2024-09-13 11:20:00',
    },
  ];

  return useResponseSuccess(recentOrders);
});
