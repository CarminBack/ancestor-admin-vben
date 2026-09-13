<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Page } from '@vben/common-ui';
import { Card, Table, Tag, Button, Statistic } from 'antdv-next';
import { ancestorApi, type DashboardOverview, type RitualOrder, type ProductOrder } from '#/api/ancestor';

const loading = ref(false);
const overview = ref<DashboardOverview>();

const ritualColumns = [
  { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo', width: 150 },
  { title: '下单人', dataIndex: 'orderName', key: 'orderName', width: 100 },
  { title: '亡故亲人', dataIndex: 'deceasedName', key: 'deceasedName', width: 100 },
  { title: '祭祀套餐', dataIndex: 'packageName', key: 'packageName', width: 120 },
  { title: '祭祀日期', dataIndex: 'ritualDate', key: 'ritualDate', width: 120 },
  { title: '金额', dataIndex: 'amount', key: 'amount', width: 100 },
  { title: '状态', key: 'status', width: 120 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' },
];

const productColumns = [
  { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo', width: 150 },
  { title: '收货人', dataIndex: 'receiverName', key: 'receiverName', width: 100 },
  { title: '商品', dataIndex: 'productName', key: 'productName', width: 150 },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
  { title: '金额', dataIndex: 'amount', key: 'amount', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' },
];

const statusColorMap: Record<string, string> = {
  PENDING_PAYMENT: 'default',
  PAID: 'blue',
  PENDING_RITUAL: 'cyan',
  PREPARING: 'orange',
  PACKAGING: 'orange',
  BURNING: 'orange',
  PENDING_VIDEO: 'purple',
  COMPLETED: 'green',
  CANCELLED: 'red',
  SHIPPED: 'blue',
};

const statusTextMap: Record<string, string> = {
  PENDING_PAYMENT: '待支付',
  PAID: '已支付',
  PENDING_RITUAL: '待祭祀',
  PREPARING: '准备中',
  PACKAGING: '封包中',
  BURNING: '焚化中',
  PENDING_VIDEO: '待上传视频',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  SHIPPED: '已发货',
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await ancestorApi.dashboard();
    overview.value = res;
  } catch (error) {
    console.error('获取数据失败:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page title="数据概览" :loading="loading">
    <div class="dashboard-container">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <Card :bordered="false">
          <Statistic title="今日代祭订单" :value="overview?.todayRitualOrders || 0" />
        </Card>
        <Card :bordered="false">
          <Statistic title="今日商品订单" :value="overview?.todayProductOrders || 0" />
        </Card>
        <Card :bordered="false">
          <Statistic
            title="今日销售额"
            :value="overview?.todaySalesAmount || 0"
            prefix="¥"
            :precision="2"
          />
        </Card>
        <Card :bordered="false">
          <Statistic
            title="待处理代祭订单"
            :value="overview?.pendingRitualOrders || 0"
            value-style="color: #cf1322"
          />
        </Card>
        <Card :bordered="false">
          <Statistic title="累计代祭订单" :value="overview?.totalRitualOrders || 0" />
        </Card>
        <Card :bordered="false">
          <Statistic title="累计商品订单" :value="overview?.totalProductOrders || 0" />
        </Card>
        <Card :bordered="false">
          <Statistic
            title="累计销售金额"
            :value="overview?.totalSalesAmount || 0"
            prefix="¥"
            :precision="2"
          />
        </Card>
        <Card :bordered="false">
          <Statistic title="已完成祭祀" :value="overview?.completedRituals || 0" />
        </Card>
      </div>

      <!-- 最近代祭祀订单 -->
      <Card title="最近代祭祀订单" :bordered="false" class="mt-4">
        <Table
          :columns="ritualColumns"
          :data-source="overview?.recentRitualOrders || []"
          :pagination="false"
          :scroll="{ x: 1200 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'amount'">
              <span class="font-medium">¥{{ record.amount }}</span>
            </template>
            <template v-if="column.key === 'status'">
              <Tag :color="statusColorMap[record.status]">
                {{ statusTextMap[record.status] || record.status }}
              </Tag>
            </template>
            <template v-if="column.key === 'action'">
              <Button type="link" size="small">查看</Button>
            </template>
          </template>
        </Table>
      </Card>

      <!-- 最近商品订单 -->
      <Card title="最近商品订单" :bordered="false" class="mt-4">
        <Table
          :columns="productColumns"
          :data-source="overview?.recentProductOrders || []"
          :pagination="false"
          :scroll="{ x: 1000 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'amount'">
              <span class="font-medium">¥{{ record.amount }}</span>
            </template>
            <template v-if="column.key === 'status'">
              <Tag :color="statusColorMap[record.status]">
                {{ statusTextMap[record.status] || record.status }}
              </Tag>
            </template>
            <template v-if="column.key === 'action'">
              <Button type="link" size="small">查看</Button>
            </template>
          </template>
        </Table>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.dashboard-container {
  padding: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.mt-4 {
  margin-top: 16px;
}

.font-medium {
  font-weight: 500;
  color: #d97706;
}
</style>
