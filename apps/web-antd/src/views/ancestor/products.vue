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
  Image,
  Modal,
  Form,
  FormItem,
  InputNumber,
  Upload,
  message,
} from 'antdv-next';
import { ancestorApi, type Product, type ProductCategory } from '#/api/ancestor';

const loading = ref(false);
const products = ref<Product[]>([]);
const categories = ref<ProductCategory[]>([]);
const total = ref(0);
const modalVisible = ref(false);
const modalTitle = ref('新增商品');
const formRef = ref();

const searchForm = reactive({
  name: '',
  categoryId: undefined as string | undefined,
  status: undefined as number | undefined,
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const editingProduct = ref<Partial<Product>>({});

const columns = [
  { title: '商品图片', key: 'cover', width: 100 },
  { title: '商品名称', dataIndex: 'name', key: 'name', width: 150 },
  { title: '分类', dataIndex: 'categoryName', key: 'categoryName', width: 120 },
  { title: '价格', dataIndex: 'price', key: 'price', width: 100 },
  { title: '原价', dataIndex: 'originalPrice', key: 'originalPrice', width: 100 },
  { title: '库存', dataIndex: 'stock', key: 'stock', width: 80 },
  { title: '销量', dataIndex: 'sales', key: 'sales', width: 80 },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' },
];

const formRules = {
  name: [{ required: true, message: '请输入商品名称' }],
  categoryId: [{ required: true, message: '请选择商品分类' }],
  price: [{ required: true, message: '请输入销售价格' }],
  stock: [{ required: true, message: '请输入库存' }],
};

const fetchProducts = async () => {
  loading.value = true;
  try {
    const res = await ancestorApi.products({
      ...searchForm,
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
    products.value = res.items;
    total.value = res.total;
  } catch (error) {
    console.error('获取商品列表失败:', error);
    message.error('获取商品列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await ancestorApi.categories();
    categories.value = res.items;
  } catch (error) {
    console.error('获取分类列表失败:', error);
  }
};

const handleSearch = () => {
  pagination.current = 1;
  fetchProducts();
};

const handleReset = () => {
  searchForm.name = '';
  searchForm.categoryId = undefined;
  searchForm.status = undefined;
  pagination.current = 1;
  fetchProducts();
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchProducts();
};

const handleAdd = () => {
  modalTitle.value = '新增商品';
  editingProduct.value = {
    status: 1,
    sort: 1,
    stock: 0,
    sales: 0,
  };
  modalVisible.value = true;
};

const handleEdit = async (record: Product) => {
  modalTitle.value = '编辑商品';
  editingProduct.value = { ...record };
  modalVisible.value = true;
};

const handleDelete = (record: Product) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除商品"${record.name}"吗？`,
    onOk: async () => {
      try {
        await ancestorApi.deleteProduct(record.id);
        message.success('删除成功');
        fetchProducts();
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      }
    },
  });
};

const handleToggleStatus = async (record: Product) => {
  try {
    const newStatus = record.status === 1 ? 0 : 1;
    await ancestorApi.updateProduct(record.id, { status: newStatus });
    message.success(newStatus === 1 ? '上架成功' : '下架成功');
    fetchProducts();
  } catch (error) {
    console.error('操作失败:', error);
    message.error('操作失败');
  }
};

const handleModalOk = async () => {
  try {
    await formRef.value.validate();
    if (editingProduct.value.id) {
      await ancestorApi.updateProduct(editingProduct.value.id, editingProduct.value);
      message.success('更新成功');
    } else {
      await ancestorApi.createProduct(editingProduct.value);
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchProducts();
  } catch (error) {
    console.error('保存失败:', error);
  }
};

const handleModalCancel = () => {
  modalVisible.value = false;
  formRef.value?.resetFields();
};

onMounted(() => {
  fetchCategories();
  fetchProducts();
});
</script>

<template>
  <Page title="商品列表">
    <Card :bordered="false">
      <!-- 搜索区域 -->
      <div class="search-form">
        <Space :size="16" wrap>
          <div class="search-item">
            <label>商品名称</label>
            <Input
              v-model:value="searchForm.name"
              placeholder="请输入商品名称"
              style="width: 200px"
              @press-enter="handleSearch"
            />
          </div>
          <div class="search-item">
            <label>商品分类</label>
            <Select
              v-model:value="searchForm.categoryId"
              placeholder="请选择分类"
              style="width: 150px"
              allow-clear
            >
              <Select.Option value="">全部</Select.Option>
              <Select.Option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </Select.Option>
            </Select>
          </div>
          <div class="search-item">
            <label>商品状态</label>
            <Select
              v-model:value="searchForm.status"
              placeholder="请选择状态"
              style="width: 120px"
              allow-clear
            >
              <Select.Option :value="undefined">全部</Select.Option>
              <Select.Option :value="1">上架</Select.Option>
              <Select.Option :value="0">下架</Select.Option>
            </Select>
          </div>
          <Button type="primary" @click="handleSearch">搜索</Button>
          <Button @click="handleReset">重置</Button>
          <Button type="primary" @click="handleAdd">+ 新增商品</Button>
        </Space>
      </div>

      <!-- 表格 -->
      <Table
        :columns="columns"
        :data-source="products"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: total,
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }"
        :scroll="{ x: 1400 }"
        class="mt-4"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'cover'">
            <Image :src="record.cover || 'https://via.placeholder.com/80'" :width="60" />
          </template>
          <template v-if="column.key === 'price'">
            <span class="price">¥{{ record.price }}</span>
          </template>
          <template v-if="column.key === 'originalPrice'">
            <span v-if="record.originalPrice" class="original-price">¥{{ record.originalPrice }}</span>
            <span v-else>-</span>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '上架' : '下架' }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
              <Button type="link" size="small" @click="handleToggleStatus(record)">
                {{ record.status === 1 ? '下架' : '上架' }}
              </Button>
              <Button type="link" danger size="small" @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 编辑/新增弹窗 -->
    <Modal
      v-model:open="modalVisible"
      :title="modalTitle"
      :width="600"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <Form ref="formRef" :model="editingProduct" :rules="formRules" :label-col="{ span: 6 }">
        <FormItem label="商品名称" name="name">
          <Input v-model:value="editingProduct.name" placeholder="请输入商品名称" />
        </FormItem>
        <FormItem label="商品分类" name="categoryId">
          <Select v-model:value="editingProduct.categoryId" placeholder="请选择分类">
            <Select.Option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </Select.Option>
          </Select>
        </FormItem>
        <FormItem label="商品描述" name="description">
          <Input.TextArea
            v-model:value="editingProduct.description"
            placeholder="请输入商品描述"
            :rows="3"
          />
        </FormItem>
        <FormItem label="销售价格" name="price">
          <InputNumber
            v-model:value="editingProduct.price"
            :min="0"
            :precision="2"
            placeholder="请输入价格"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="原价" name="originalPrice">
          <InputNumber
            v-model:value="editingProduct.originalPrice"
            :min="0"
            :precision="2"
            placeholder="请输入原价"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="库存" name="stock">
          <InputNumber
            v-model:value="editingProduct.stock"
            :min="0"
            placeholder="请输入库存"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="排序" name="sort">
          <InputNumber
            v-model:value="editingProduct.sort"
            :min="0"
            placeholder="数值越小越靠前"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="商品状态" name="status">
          <Select v-model:value="editingProduct.status">
            <Select.Option :value="1">上架</Select.Option>
            <Select.Option :value="0">下架</Select.Option>
          </Select>
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>

<script lang="ts">
import { h } from 'vue';
export default { name: 'AncestorProducts' };
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

.original-price {
  color: #999;
  text-decoration: line-through;
}
</style>
