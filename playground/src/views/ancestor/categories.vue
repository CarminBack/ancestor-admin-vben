<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Image,
  Modal,
  Form,
  FormItem,
  Input,
  InputNumber,
  Select,
  message,
} from 'antdv-next';
import { ancestorApi, type ProductCategory } from '#/api/ancestor';

const loading = ref(false);
const categories = ref<ProductCategory[]>([]);
const modalVisible = ref(false);
const modalTitle = ref('新增分类');
const formRef = ref();

const editingCategory = ref<Partial<ProductCategory>>({});

const columns = [
  { title: '分类图片', key: 'image', width: 100 },
  { title: '分类名称', dataIndex: 'name', key: 'name', width: 200 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' },
];

const formRules = {
  name: [{ required: true, message: '请输入分类名称' }],
  sort: [{ required: true, message: '请输入排序' }],
};

const fetchCategories = async () => {
  loading.value = true;
  try {
    const res = await ancestorApi.categories();
    categories.value = res.items;
  } catch (error) {
    console.error('获取分类列表失败:', error);
    message.error('获取分类列表失败');
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  modalTitle.value = '新增分类';
  editingCategory.value = {
    status: 1,
    sort: 1,
  };
  modalVisible.value = true;
};

const handleEdit = (record: ProductCategory) => {
  modalTitle.value = '编辑分类';
  editingCategory.value = { ...record };
  modalVisible.value = true;
};

const handleDelete = (record: ProductCategory) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除分类"${record.name}"吗？`,
    onOk: async () => {
      try {
        await ancestorApi.deleteCategory(record.id);
        message.success('删除成功');
        fetchCategories();
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      }
    },
  });
};

const handleToggleStatus = async (record: ProductCategory) => {
  try {
    const newStatus = record.status === 1 ? 0 : 1;
    await ancestorApi.updateCategory(record.id, { status: newStatus });
    message.success(newStatus === 1 ? '启用成功' : '禁用成功');
    fetchCategories();
  } catch (error) {
    console.error('操作失败:', error);
    message.error('操作失败');
  }
};

const handleModalOk = async () => {
  try {
    await formRef.value.validate();
    if (editingCategory.value.id) {
      await ancestorApi.updateCategory(editingCategory.value.id, editingCategory.value);
      message.success('更新成功');
    } else {
      await ancestorApi.createCategory(editingCategory.value);
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchCategories();
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
});
</script>

<template>
  <Page title="商品分类">
    <Card :bordered="false">
      <div class="mb-4">
        <Button type="primary" @click="handleAdd">+ 新增分类</Button>
      </div>

      <Table
        :columns="columns"
        :data-source="categories"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 800 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'image'">
            <Image :src="record.image || 'https://via.placeholder.com/60'" :width="60" />
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
              <Button type="link" size="small" @click="handleToggleStatus(record)">
                {{ record.status === 1 ? '禁用' : '启用' }}
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
      :width="500"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <Form ref="formRef" :model="editingCategory" :rules="formRules" :label-col="{ span: 6 }">
        <FormItem label="分类名称" name="name">
          <Input v-model:value="editingCategory.name" placeholder="请输入分类名称" />
        </FormItem>
        <FormItem label="排序" name="sort">
          <InputNumber
            v-model:value="editingCategory.sort"
            :min="0"
            placeholder="数值越小越靠前"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="状态" name="status">
          <Select v-model:value="editingCategory.status">
            <Select.Option :value="1">启用</Select.Option>
            <Select.Option :value="0">禁用</Select.Option>
          </Select>
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>

<script lang="ts">
import { h } from 'vue';
export default { name: 'AncestorCategories' };
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
