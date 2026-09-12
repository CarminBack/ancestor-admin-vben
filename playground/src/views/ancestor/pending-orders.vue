<template>
  <div class="p-6">
    <Card>
      <Tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <!-- 商品订单标签页 -->
        <TabPane key="product" tab="商品订单">
          <div class="mb-4 flex gap-4">
            <Input
              v-model:value="productSearch.orderNo"
              placeholder="订单号"
              class="w-48"
              allow-clear
              @pressEnter="loadProductOrders"
            />
            <Input
              v-model:value="productSearch.receiverName"
              placeholder="收货人姓名"
              class="w-48"
              allow-clear
              @pressEnter="loadProductOrders"
            />
            <Input
              v-model:value="productSearch.receiverPhone"
              placeholder="收货人电话"
              class="w-48"
              allow-clear
              @pressEnter="loadProductOrders"
            />
            <Button type="primary" @click="loadProductOrders">
              <SearchOutlined /> 查询
            </Button>
            <Button @click="handleResetProductSearch">重置</Button>
          </div>

          <Table
            :columns="productColumns"
            :data-source="productOrders"
            :loading="productLoading"
            :pagination="productPagination"
            row-key="id"
            @change="handleProductTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'productInfo'">
                <div class="flex items-center gap-3">
                  <img
                    v-if="record.productImage"
                    :src="record.productImage"
                    class="h-12 w-12 rounded object-cover"
                  />
                  <div>
                    <div class="font-medium">{{ record.productName }}</div>
                    <div class="text-sm text-gray-500">数量: {{ record.quantity }}</div>
                  </div>
                </div>
              </template>
              <template v-else-if="column.key === 'amount'">
                <span class="font-semibold text-red-600">¥{{ record.amount }}</span>
              </template>
              <template v-else-if="column.key === 'receiver'">
                <div>
                  <div>{{ record.receiverName }}</div>
                  <div class="text-sm text-gray-500">{{ record.receiverPhone }}</div>
                </div>
              </template>
              <template v-else-if="column.key === 'address'">
                <div class="max-w-xs truncate" :title="record.receiverAddress">
                  {{ record.receiverAddress }}
                </div>
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag color="orange">待付款</Tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <Space>
                  <Button type="primary" size="small" @click="handleConfirmProductPayment(record)">
                    确认付款
                  </Button>
                  <Button danger size="small" @click="handleCancelOrder(record, 'product')">
                    取消订单
                  </Button>
                </Space>
              </template>
            </template>
          </Table>
        </TabPane>

        <!-- 代祭祀订单标签页 -->
        <TabPane key="ritual" tab="代祭祀订单">
          <div class="mb-4 flex gap-4">
            <Input
              v-model:value="ritualSearch.orderNo"
              placeholder="订单号"
              class="w-48"
              allow-clear
              @pressEnter="loadRitualOrders"
            />
            <Input
              v-model:value="ritualSearch.orderName"
              placeholder="下单人姓名"
              class="w-48"
              allow-clear
              @pressEnter="loadRitualOrders"
            />
            <Input
              v-model:value="ritualSearch.deceasedName"
              placeholder="逝者姓名"
              class="w-48"
              allow-clear
              @pressEnter="loadRitualOrders"
            />
            <Button type="primary" @click="loadRitualOrders">
              <SearchOutlined /> 查询
            </Button>
            <Button @click="handleResetRitualSearch">重置</Button>
          </div>

          <Table
            :columns="ritualColumns"
            :data-source="ritualOrders"
            :loading="ritualLoading"
            :pagination="ritualPagination"
            row-key="id"
            @change="handleRitualTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'orderInfo'">
                <div>
                  <div class="font-medium">{{ record.orderName }}</div>
                  <div class="text-sm text-gray-500">逝者: {{ record.deceasedName }}</div>
                </div>
              </template>
              <template v-else-if="column.key === 'package'">
                <div>
                  <div>{{ record.packageName }}</div>
                  <div class="text-sm text-gray-500">祭祀日期: {{ record.ritualDate }}</div>
                </div>
              </template>
              <template v-else-if="column.key === 'amount'">
                <span class="font-semibold text-red-600">¥{{ record.amount }}</span>
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag color="orange">待付款</Tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <Space>
                  <Button type="primary" size="small" @click="handleConfirmRitualPayment(record)">
                    确认付款
                  </Button>
                  <Button danger size="small" @click="handleCancelOrder(record, 'ritual')">
                    取消订单
                  </Button>
                </Space>
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Tabs, TabPane, Table, Button, Input, Space, Tag, Modal, message } from 'ant-design-vue';
import { SearchOutlined } from '@ant-design/icons-vue';
import { ancestorApi, type ProductOrder, type RitualOrder } from '#/api/ancestor';

const activeTab = ref('product');

// 商品订单
const productOrders = ref<ProductOrder[]>([]);
const productLoading = ref(false);
const productSearch = reactive({
  orderNo: '',
  receiverName: '',
  receiverPhone: '',
});
const productPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const productColumns = [
  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
  { title: '商品信息', key: 'productInfo', width: 250 },
  { title: '金额', key: 'amount', width: 120 },
  { title: '收货人', key: 'receiver', width: 150 },
  { title: '收货地址', key: 'address', width: 200 },
  { title: '下单时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' },
];

// 代祭祀订单
const ritualOrders = ref<RitualOrder[]>([]);
const ritualLoading = ref(false);
const ritualSearch = reactive({
  orderNo: '',
  orderName: '',
  deceasedName: '',
});
const ritualPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const ritualColumns = [
  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
  { title: '下单信息', key: 'orderInfo', width: 200 },
  { title: '套餐信息', key: 'package', width: 200 },
  { title: '金额', key: 'amount', width: 120 },
  { title: '下单时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' },
];

// 加载商品订单
const loadProductOrders = async () => {
  productLoading.value = true;
  try {
    const params = {
      page: productPagination.current,
      pageSize: productPagination.pageSize,
      status: 'PENDING_PAYMENT',
      ...productSearch,
    };
    const res = await ancestorApi.productOrders(params);
    productOrders.value = res.items || [];
    productPagination.total = res.total || 0;
  } catch (error) {
    message.error('加载商品订单失败');
  } finally {
    productLoading.value = false;
  }
};

// 加载代祭祀订单
const loadRitualOrders = async () => {
  ritualLoading.value = true;
  try {
    const params = {
      page: ritualPagination.current,
      pageSize: ritualPagination.pageSize,
      status: 'PENDING_PAYMENT',
      ...ritualSearch,
    };
    const res = await ancestorApi.ritualOrders(params);
    ritualOrders.value = res.items || [];
    ritualPagination.total = res.total || 0;
  } catch (error) {
    message.error('加载祭祀订单失败');
  } finally {
    ritualLoading.value = false;
  }
};

// 确认商品订单付款
const handleConfirmProductPayment = (record: ProductOrder) => {
  Modal.confirm({
    title: '确认付款',
    content: `确认订单 ${record.orderNo} 已收到付款？`,
    onOk: async () => {
      try {
        await ancestorApi.confirmProductOrderPayment(record.id);
        message.success('已确认付款');
        loadProductOrders();
      } catch (error) {
        message.error('确认付款失败');
      }
    },
  });
};

// 确认祭祀订单付款
const handleConfirmRitualPayment = (record: RitualOrder) => {
  Modal.confirm({
    title: '确认付款',
    content: `确认订单 ${record.orderNo} 已收到付款？`,
    onOk: async () => {
      try {
        await ancestorApi.confirmRitualOrderPayment(record.id);
        message.success('已确认付款');
        loadRitualOrders();
      } catch (error) {
        message.error('确认付款失败');
      }
    },
  });
};

// 取消订单
const handleCancelOrder = (record: ProductOrder | RitualOrder, type: 'product' | 'ritual') => {
  Modal.confirm({
    title: '取消订单',
    content: `确认取消订单 ${record.orderNo}？`,
    okText: '确认取消',
    okType: 'danger',
    onOk: async () => {
      try {
        if (type === 'product') {
          await ancestorApi.updateProductOrder(record.id, { status: 'CANCELLED' });
          loadProductOrders();
        } else {
          await ancestorApi.updateRitualOrder(record.id, { status: 'CANCELLED' });
          loadRitualOrders();
        }
        message.success('订单已取消');
      } catch (error) {
        message.error('取消订单失败');
      }
    },
  });
};

// 重置搜索
const handleResetProductSearch = () => {
  productSearch.orderNo = '';
  productSearch.receiverName = '';
  productSearch.receiverPhone = '';
  productPagination.current = 1;
  loadProductOrders();
};

const handleResetRitualSearch = () => {
  ritualSearch.orderNo = '';
  ritualSearch.orderName = '';
  ritualSearch.deceasedName = '';
  ritualPagination.current = 1;
  loadRitualOrders();
};

// 表格分页变化
const handleProductTableChange = (pagination: any) => {
  productPagination.current = pagination.current;
  productPagination.pageSize = pagination.pageSize;
  loadProductOrders();
};

const handleRitualTableChange = (pagination: any) => {
  ritualPagination.current = pagination.current;
  ritualPagination.pageSize = pagination.pageSize;
  loadRitualOrders();
};

// 标签页切换
const handleTabChange = (key: string) => {
  if (key === 'product') {
    loadProductOrders();
  } else {
    loadRitualOrders();
  }
};

onMounted(() => {
  loadProductOrders();
});
</script>
