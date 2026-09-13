<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  FormItem,
  Input,
  Select,
  message,
} from 'antdv-next';

interface Admin {
  id: string;
  username: string;
  nickname: string;
  phone: string;
  role: string;
  status: number;
  lastLoginAt?: string;
  createdAt: string;
}

const loading = ref(false);
const admins = ref<Admin[]>([
  {
    id: '1',
    username: 'admin',
    nickname: '超级管理员',
    phone: '13800138000',
    role: '超级管理员',
    status: 1,
    lastLoginAt: '2026-09-11 10:00:00',
    createdAt: '2026-08-01 10:00:00',
  },
  {
    id: '2',
    username: 'ritual_admin',
    nickname: '祭祀管理员',
    phone: '13900139000',
    role: '祭祀管理员',
    status: 1,
    lastLoginAt: '2026-09-11 09:30:00',
    createdAt: '2026-08-05 10:00:00',
  },
]);
const modalVisible = ref(false);
const modalTitle = ref('新增管理员');
const formRef = ref();

const editingAdmin = ref<Partial<Admin>>({});

const columns = [
  { title: '用户名', dataIndex: 'username', key: 'username', width: 150 },
  { title: '昵称', dataIndex: 'nickname', key: 'nickname', width: 150 },
  { title: '手机号', dataIndex: 'phone', key: 'phone', width: 150 },
  { title: '角色', dataIndex: 'role', key: 'role', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '最后登录', dataIndex: 'lastLoginAt', key: 'lastLoginAt', width: 180 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 250, fixed: 'right' },
];

const formRules = {
  username: [{ required: true, message: '请输入用户名' }],
  nickname: [{ required: true, message: '请输入昵称' }],
  phone: [{ required: true, message: '请输入手机号' }],
  role: [{ required: true, message: '请选择角色' }],
};

const handleAdd = () => {
  modalTitle.value = '新增管理员';
  editingAdmin.value = {
    status: 1,
  };
  modalVisible.value = true;
};

const handleEdit = (record: Admin) => {
  modalTitle.value = '编辑管理员';
  editingAdmin.value = { ...record };
  modalVisible.value = true;
};

const handleDelete = (record: Admin) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除管理员"${record.nickname}"吗？`,
    onOk: () => {
      message.success('删除成功');
    },
  });
};

const handleToggleStatus = (record: Admin) => {
  const newStatus = record.status === 1 ? 0 : 1;
  message.success(newStatus === 1 ? '启用成功' : '禁用成功');
};

const handleResetPassword = (record: Admin) => {
  Modal.confirm({
    title: '确认重置密码',
    content: `确定要重置管理员"${record.nickname}"的密码吗？`,
    onOk: () => {
      message.success('密码已重置为默认密码');
    },
  });
};

const handleModalOk = async () => {
  try {
    await formRef.value.validate();
    message.success(editingAdmin.value.id ? '更新成功' : '创建成功');
    modalVisible.value = false;
  } catch (error) {
    console.error('保存失败:', error);
  }
};

const handleModalCancel = () => {
  modalVisible.value = false;
  formRef.value?.resetFields();
};
</script>

<template>
  <Page title="管理员管理">
    <Card :bordered="false">
      <div class="mb-4">
        <Button type="primary" @click="handleAdd">+ 新增管理员</Button>
      </div>

      <Table
        :columns="columns"
        :data-source="admins"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 1300 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '正常' : '禁用' }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
              <Button type="link" size="small" @click="handleToggleStatus(record)">
                {{ record.status === 1 ? '禁用' : '启用' }}
              </Button>
              <Button type="link" size="small" @click="handleResetPassword(record)">
                重置密码
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
      <Form ref="formRef" :model="editingAdmin" :rules="formRules" :label-col="{ span: 6 }">
        <FormItem label="用户名" name="username">
          <Input v-model:value="editingAdmin.username" placeholder="请输入用户名" />
        </FormItem>
        <FormItem label="昵称" name="nickname">
          <Input v-model:value="editingAdmin.nickname" placeholder="请输入昵称" />
        </FormItem>
        <FormItem label="手机号" name="phone">
          <Input v-model:value="editingAdmin.phone" placeholder="请输入手机号" />
        </FormItem>
        <FormItem label="角色" name="role">
          <Select v-model:value="editingAdmin.role" placeholder="请选择角色">
            <Select.Option value="超级管理员">超级管理员</Select.Option>
            <Select.Option value="祭祀管理员">祭祀管理员</Select.Option>
            <Select.Option value="商品管理员">商品管理员</Select.Option>
          </Select>
        </FormItem>
        <FormItem v-if="!editingAdmin.id" label="密码" name="password">
          <Input.Password v-model:value="editingAdmin.password" placeholder="请输入密码" />
        </FormItem>
        <FormItem label="状态" name="status">
          <Select v-model:value="editingAdmin.status">
            <Select.Option :value="1">正常</Select.Option>
            <Select.Option :value="0">禁用</Select.Option>
          </Select>
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>

<script lang="ts">
import { h } from 'vue';
export default { name: 'AncestorAdmins' };
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
