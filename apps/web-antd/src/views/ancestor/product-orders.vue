<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Descriptions,
  DescriptionsItem,
  message,
} from 'antdv-next';
import { ancestorApi, type ProductOrder, ProductOrderStatus } from '#/api/ancestor';

const loading = ref(false);
const orders = ref<ProductOrder[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const currentOrder = ref<ProductOrder>();

const searchForm = reactive({
  orderNo: '',
  receiverName: '',
  status: undefined as string | undefined,
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const columns = [
  { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo', width: 150 },
  { title: '商品', dataIndex: 'productName', key: 'productName', width: 150 },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
  { title: '金额', dataIndex: 'amount', key: 'amount', width: 100 },
  { title: '收货人', dataIndex: 'receiverName', key: 'receiverName', width: 100 },
  { title: '联系电话', dataIndex: 'receiverPhone', key: 'receiverPhone', width: 120 },
  { title: '订单状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
];

const statusColorMap: Record<string, string> = {
  PENDING_PAYMENT: 'default',
  PAID: 'blue',
  SHIPPED: 'orange',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

const statusTextMap: Record<string, string> = {
  PENDING_PAYMENT: '待付款',
  PAID: '待发货',
  SHIPPED: '已发货',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

const fetchOrders = async () => {
  loading.value = true;
  try {
    const res = await ancestorApi.productOrders({
      ...searchForm,
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
    orders.value = res.items;
    total.value = res.total;
  } catch (error) {
    console.error('获取订单列表失败:', error);
    message.error('获取订单列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.current = 1;
  fetchOrders();
};

const handleReset = () => {
  searchForm.orderNo = '';
  searchForm.receiverName = '';
  searchForm.status = undefined;
  pagination.current = 1;
  fetchOrders();
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchOrders();
};

const handleViewDetail = async (record: ProductOrder) => {
  try {
    const res = await ancestorApi.getProductOrder(record.id);
    currentOrder.value = res;
    detailVisible.value = true;
  } catch (error) {
    console.error('获取订单详情失败:', error);
    message.error('获取订单详情失败');
  }
};

const handleShip = (record: ProductOrder) => {
  Modal.confirm({
    title: '确认发货',
    content: `确定要发货订单"${record.orderNo}"吗？`,
    onOk: async () => {
      try {
        await ancestorApi.updateProductOrder(record.id, { status: 'SHIPPED' });
        message.success('发货成功');
        fetchOrders();
      } catch (error) {
        console.error('发货失败:', error);
        message.error('发货失败');
      }
    },
  });
};

const handleCancel = (record: ProductOrder) => {
  Modal.confirm({
    title: '确认取消',
    content: `确定要取消订单"${record.orderNo}"吗？`,
    onOk: async () => {
      try {
        await ancestorApi.updateProductOrder(record.id, { status: 'CANCELLED' });
        message.success('取消成功');
        fetchOrders();
      } catch (error) {
        console.error('取消失败:', error);
        message.error('取消失败');
      }
    },
  });
};

onMounted(() => {
  fetchOrders();
});
</script>

<template>
  <Page title="商品订单">
    <Card :bordered="false">
      <!-- 搜索区域 -->
      <div class="search-form">
        <Space :size="16" wrap>
          <div class="search-item">
            <label>订单编号</label>
            <Input
              v-model:value="searchForm.orderNo"
              placeholder="请输入订单编号"
              style="width: 200px"
              @press-enter="handleSearch"
            />
          </div>
          <div class="search-item">
            <label>收货人</label>
            <Input
              v-model:value="searchForm.receiverName"
              placeholder="请输入收货人"
              style="width: 150px"
              @press-enter="handleSearch"
            />
          </div>
          <div class="search-item">
            <label>订单状态</label>
            <Select
              v-model:value="searchForm.status"
              placeholder="请选择状态"
              style="width: 120px"
              allow-clear
            >
              <Select.Option value="">全部</Select.Option>
              <Select.Option value="PENDING_PAYMENT">待付款</Select.Option>
              <Select.Option value="PAID">待发货</Select.Option>
              <Select.Option value="SHIPPED">已发货</Select.Option>
              <Select.Option value="COMPLETED">已完成</Select.Option>
              <Select.Option value="CANCELLED">已取消</Select.Option>
            </Select>
          </div>
          <Button type="primary" @click="handleSearch">搜索</Button>
          <Button @click="handleReset">重置</Button>
        </Space>
      </div>

      <!-- 表格 -->
      <Table
        :columns="columns"
        :data-source="orders"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: total,
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }"
        :scroll="{ x: 1200 }"
        class="mt-4"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'amount'">
            <span class="price">¥{{ record.amount }}</span>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[record.status]">
              {{ statusTextMap[record.status] || record.status }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleViewDetail(record)">
                查看
              </Button>
              <Button
                v-if="record.status === 'PAID'"
                type="link"
                size="small"
                @click="handleShip(record)"
              >
                发货
              </Button>
              <Button
                v-if="record.status === 'PENDING_PAYMENT' || record.status === 'PAID'"
                type="link"
                danger
                size="small"
                @click="handleCancel(record)"
              >
                取消
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 订单详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="订单详情"
      :width="700"
      :footer="null"
    >
      <Descriptions v-if="currentOrder" bordered :column="2">
        <DescriptionsItem label="订单编号" :span="2">{{ currentOrder.orderNo }}</DescriptionsItem>
        <DescriptionsItem label="商品名称" :span="2">{{ currentOrder.productName }}</DescriptionsItem>
        <DescriptionsItem label="数量">{{ currentOrder.quantity }}</DescriptionsItem>
        <DescriptionsItem label="单价">¥{{ currentOrder.price }}</DescriptionsItem>
        <DescriptionsItem label="订单金额" :span="2">
          <span class="price">¥{{ currentOrder.amount }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="收货人">{{ currentOrder.receiverName }}</DescriptionsItem>
        <DescriptionsItem label="联系电话">{{ currentOrder.receiverPhone }}</DescriptionsItem>
        <DescriptionsItem label="收货地址" :span="2">
          {{ currentOrder.receiverAddress }}
        </DescriptionsItem>
        <DescriptionsItem label="订单状态">
          <Tag :color="statusColorMap[currentOrder.status]">
            {{ statusTextMap[currentOrder.status] || currentOrder.status }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentOrder.createdAt }}</DescriptionsItem>
        <DescriptionsItem v-if="currentOrder.paidAt" label="支付时间" :span="2">
          {{ currentOrder.paidAt }}
        </DescriptionsItem>
        <DescriptionsItem v-if="currentOrder.shippedAt" label="发货时间" :span="2">
          {{ currentOrder.shippedAt }}
        </DescriptionsItem>
        <DescriptionsItem v-if="currentOrder.completedAt" label="完成时间" :span="2">
          {{ currentOrder.completedAt }}
        </DescriptionsItem>
      </Descriptions>
    </Modal>
  </Page>
</template>

<script lang="ts">
import { h } from 'vue';
export default { name: 'AncestorProductOrders' };
</script>

<style scoped>
.search-form {
  margin-bottom: 16px;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-item label {
  white-space: nowrap;
  font-size: 14px;
}

.mt-4 {
  margin-top: 16px;
}

.price {
  color: #d97706;
  font-weight: 500;
}
</style>
