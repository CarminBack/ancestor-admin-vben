<script setup lang="ts">
import type { RitualOrder, RitualOrderDetail } from '#/api/ancestor';

import { h, onActivated, onMounted, reactive, ref, computed } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  DatePicker,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Upload,
} from 'antdv-next';

import { ancestorApi, RitualStatus } from '#/api/ancestor';
import { uploadRitualVideo } from '#/utils/ritual-video-upload';

import OrderDetailModal from './components/OrderDetailModal.vue';

// 图标组件
const PlayCircleOutlined = () =>
  h('span', { class: 'i-ant-design:play-circle-outlined' });
const ClockCircleOutlined = () =>
  h('span', { class: 'i-ant-design:clock-circle-outlined' });
const DeleteOutlined = () =>
  h('span', { class: 'i-ant-design:delete-outlined' });
const VideoCameraOutlined = () =>
  h('span', { class: 'i-ant-design:video-camera-outlined' });

const loading = ref(false);
const orders = ref<RitualOrder[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const currentOrder = ref<RitualOrderDetail>();
const uploadVisible = ref(false);
const uploadingOrder = ref<RitualOrder>();
const uploadProgress = ref(0);
const uploading = ref(false);
const fileList = ref<any[]>([]);
const videoTimeVisible = ref(false);
const currentVideo = ref<any>(null);
const videoAvailableTime = ref<any>('');
const videoPlayerVisible = ref(false);
const currentVideoUrl = ref<string>('');

const searchForm = reactive({
  orderNo: '',
  orderName: '',
  deceasedName: '',
  status: undefined as string | undefined,
  ritualDate: undefined as string | undefined,
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const columns = [
  { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo', width: 150 },
  { title: '下单人', dataIndex: 'orderName', key: 'orderName', width: 100 },
  { title: '阳上人性别', dataIndex: 'customerGender', key: 'customerGender', width: 100 },
  { title: '阳上人生辰', dataIndex: 'customerBirthDate', key: 'customerBirthDate', width: 130 },
  { title: '阳上人地址', dataIndex: 'customerAddress', key: 'customerAddress', width: 220 },
  { title: '亡故亲人', dataIndex: 'deceasedName', key: 'deceasedName', width: 100 },
  { title: '亡故人性别', dataIndex: 'deceasedGender', key: 'deceasedGender', width: 100 },
  { title: '亡故人生辰', dataIndex: 'deceasedBirthDateTime', key: 'deceasedBirthDateTime', width: 170 },
  { title: '关系', dataIndex: 'relationship', key: 'relationship', width: 100 },
  { title: '墓地', dataIndex: 'cemetery', key: 'cemetery', width: 220 },
  { title: '祭祀套餐', dataIndex: 'packageName', key: 'packageName', width: 120 },
  { title: '祭祀日期', dataIndex: 'ritualDate', key: 'ritualDate', width: 120 },
  { title: '金额', dataIndex: 'amount', key: 'amount', width: 100 },
  { title: '状态', key: 'status', width: 120 },
  { title: '视频', key: 'videoCount', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 260, fixed: 'right' },
];

const visibleColumnKeys = ref<string[]>(JSON.parse(localStorage.getItem('ancestor-ritual-columns') || '[]'));
const columnOptions = columns.filter((column) => !['status', 'action'].includes(column.key)).map((column) => ({ label: column.title, value: column.key }));
const tableColumns = computed(() => {
  if (!visibleColumnKeys.value.length) return columns;
  return columns.filter((column) => visibleColumnKeys.value.includes(column.key) || ['status', 'action'].includes(column.key));
});
const saveVisibleColumns = (keys: string[]) => {
  visibleColumnKeys.value = keys;
  localStorage.setItem('ancestor-ritual-columns', JSON.stringify(keys));
};

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
};

const statusSteps = [
  { status: 'PAID', title: '已支付' },
  { status: 'PREPARING', title: '准备中' },
  { status: 'PACKAGING', title: '封包中' },
  { status: 'BURNING', title: '焚化中' },
  { status: 'PENDING_VIDEO', title: '待上传视频' },
  { status: 'COMPLETED', title: '已完成' },
];

const getStepStatus = (currentStatus: string, stepStatus: string) => {
  const currentIndex = statusSteps.findIndex((s) => s.status === currentStatus);
  const stepIndex = statusSteps.findIndex((s) => s.status === stepStatus);

  if (currentStatus === 'CANCELLED') return 'error';
  if (currentIndex === stepIndex) return 'process';
  if (currentIndex > stepIndex) return 'finish';
  return 'wait';
};

const getCurrentStep = (status: string) => {
  const index = statusSteps.findIndex((s) => s.status === status);
  return index !== -1 ? index : 0;
};

onActivated(() => {
  if (!loading.value) fetchOrders();
});

const fetchOrders = async () => {
  loading.value = true;
  try {
    const res = await ancestorApi.ritualOrders({
      ...searchForm,
      orderView: 'active',
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
    orders.value = res.items;
    total.value = res.total;
    console.log('订单列表已加载，第一个订单状态:', orders.value[0]?.status);
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
  searchForm.orderName = '';
  searchForm.deceasedName = '';
  searchForm.status = undefined;
  searchForm.ritualDate = undefined;
  pagination.current = 1;
  fetchOrders();
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchOrders();
};

const handleViewDetail = async (record: RitualOrder) => {
  try {
    const res = await ancestorApi.getRitualOrder(record.id);
    currentOrder.value = res;
    detailVisible.value = true;
  } catch (error) {
    console.error('获取订单详情失败:', error);
    message.error('获取订单详情失败');
  }
};

const handleUpdateStatus = (orderId: string, newStatus: string) => {
  Modal.confirm({
    title: '确认状态变更',
    content: `确定要将订单状态更新为"${statusTextMap[newStatus]}"吗？`,
    onOk: async () => {
      try {
        await ancestorApi.updateRitualOrder(orderId, {
          status: newStatus as RitualStatus,
        });
        message.success('状态更新成功');
        if (currentOrder.value) {
          const res = await ancestorApi.getRitualOrder(orderId);
          currentOrder.value = res;
        }
        fetchOrders();
      } catch (error) {
        console.error('状态更新失败:', error);
        message.error('状态更新失败');
      }
    },
  });
};

const getNextStatus = (currentStatus: string): null | string => {
  const statusFlow: Record<string, string> = {
    PAID: 'PREPARING',
    PENDING_RITUAL: 'PREPARING',
    PREPARING: 'PACKAGING',
    PACKAGING: 'BURNING',
    BURNING: 'PENDING_VIDEO',
    PENDING_VIDEO: 'COMPLETED',
  };
  return statusFlow[currentStatus] || null;
};

// 获取上传视频按钮文本
const getUploadButtonText = (status: string): string => {
  const textMap: Record<string, string> = {
    PREPARING: '上传准备视频',
    PACKAGING: '上传封包视频',
    BURNING: '上传祭祀视频',
  };
  return textMap[status] || '上传视频';
};

// 判断是否显示上传视频按钮
const shouldShowUploadButton = (status: string): boolean => {
  return [
    'BURNING',
    'PACKAGING',
    'PAID',
    'PENDING_RITUAL',
    'PENDING_VIDEO',
    'PREPARING',
  ].includes(status);
};

// 上传视频
const handleUploadVideo = (record: RitualOrder) => {
  // 根据订单当前状态设置上传阶段
  uploadStage.value = record.status;
  uploadingOrder.value = record;
  uploadVisible.value = true;
  fileList.value = [];
  uploadProgress.value = 0;
};

// 按阶段上传视频（从详情页调用）
const uploadStage = ref<string>('');
const handleUploadVideoByStage = (stage: string) => {
  if (!currentOrder.value) return;

  uploadStage.value = stage;
  uploadingOrder.value = currentOrder.value as any;
  uploadVisible.value = true;
  fileList.value = [];
  uploadProgress.value = 0;
};

// 自定义上传处理
const customRequest = async (options: any) => {
  const { file, onProgress, onSuccess, onError } = options;

  try {
    uploading.value = true;
    console.log('开始上传视频:', file.name, file.size);

    // 使用当前可用的视频接口，保留原上传弹窗及进度条。
    const videoUrl = await uploadRitualVideo(file, (percent) => {
      uploadProgress.value = percent;
      onProgress({ percent });
    });

    // 调用后端 API 保存视频记录，标记视频所属阶段
    const videoData = {
      videoUrl,
      stage: ['PAID', 'PENDING_RITUAL'].includes(
        uploadStage.value || uploadingOrder.value!.status,
      )
        ? 'PREPARING'
        : uploadStage.value || uploadingOrder.value!.status,
    };

    await ancestorApi.addRitualOrderVideo(uploadingOrder.value!.id, videoData);
    console.log('保存视频记录成功:', videoData);

    onSuccess(videoUrl);
    message.success('视频上传成功');
    uploading.value = false;

    // 重置上传列表，允许继续上传
    fileList.value = [];
    uploadProgress.value = 0;
    await fetchOrders();
    if (currentOrder.value?.id === uploadingOrder.value?.id)
      currentOrder.value = await ancestorApi.getRitualOrder(
        uploadingOrder.value!.id,
      );
  } catch (error: any) {
    console.error('视频上传失败:', error);
    console.error('错误详情:', {
      message: error?.message,
      stack: error?.stack,
      response: error?.response,
      data: error?.data,
    });
    onError(error);
    const errorMsg = error?.message || error?.toString() || '视频上传失败';
    message.error(`视频上传失败: ${errorMsg}`);
    uploading.value = false;
  }
};

// 文件选择前的验证
const beforeUpload = (file: File) => {
  const isVideo = file.name.toLowerCase().endsWith('.mp4');
  if (!isVideo) {
    message.error('只能上传视频文件！');
    return false;
  }

  const isLt500M = file.size / 1024 / 1024 <= 100;
  if (!isLt500M) {
    message.error('视频大小不能超过 100MB！');
    return false;
  }

  return true;
};

// 关闭上传弹窗
const handleCloseUpload = () => {
  if (uploading.value) {
    message.warning('视频正在上传中，请稍候...');
    return;
  }
  uploadVisible.value = false;
  fileList.value = [];
  uploadProgress.value = 0;
  uploadStage.value = '';
};

// 按类型过滤视频
const getVideosByType = (type: string) => {
  if (!currentOrder.value?.videos) return [];
  return currentOrder.value.videos.filter((video) => video.stage === type);
};

// 自动更新订单状态
const autoUpdateOrderStatus = async () => {
  if (!uploadingOrder.value || uploading.value) return;
  const id = uploadingOrder.value.id;
  try {
    const detail = await ancestorApi.getRitualOrder(id);
    const stage = ['PAID', 'PENDING_RITUAL'].includes(uploadStage.value)
      ? 'PREPARING'
      : uploadStage.value;
    const next = (
      {
        PREPARING: 'PACKAGING',
        PACKAGING: 'BURNING',
        BURNING: 'COMPLETED',
      } as Record<string, string>
    )[stage];
    if (
      !detail.videos.some((v) => v.stage === stage) &&
      detail.status !== 'PENDING_VIDEO'
    ) {
      message.warning('请先上传当前阶段的视频');
      return;
    }
    const refresh = async () => {
      handleCloseUpload();
      await fetchOrders();
      if (currentOrder.value?.id === id)
        currentOrder.value = await ancestorApi.getRitualOrder(id);
    };
    if (!next) {
      await refresh();
      return;
    }
    Modal.confirm({
      title: next === 'COMPLETED' ? '确认完成祭祀' : '确认进入下一步',
      content: `视频已保存，是否进入下一步：${statusTextMap[next]}？`,
      okText: '确认',
      cancelText: '稍后',
      onOk: async () => {
        try {
          await ancestorApi.confirmRitualVideo(id, stage);
          await refresh();
          message.success('状态更新成功');
        } catch {
          message.error('状态更新失败，请刷新后重试');
        }
      },
      onCancel: refresh,
    });
  } catch {
    message.error('获取订单状态失败');
  }
};

// 确认上传完成
const handleConfirmUpload = async () => {
  await autoUpdateOrderStatus();
};

// 查看视频 - 弹窗播放
const handleViewVideo = async (videoUrl: string) => {
  currentVideoUrl.value = videoUrl;
  videoPlayerVisible.value = true;
};

// 判断视频是否可查看
const isVideoAvailable = (video: any) => {
  if (!video.availableAt) return true;
  return new Date(video.availableAt) <= new Date();
};

// 格式化剩余时间
const formatAvailableTime = (availableAt?: string) => {
  if (!availableAt) return '';
  const now = new Date();
  const target = new Date(availableAt);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return '已可查看';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}天${hours}小时`;
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  return `${minutes}分钟`;
};

// 设置视频可查看时间
const handleSetVideoTime = (video: any) => {
  currentVideo.value = video;
  videoAvailableTime.value = video.availableAt || '';
  videoTimeVisible.value = true;
};

// 保存视频可查看时间
const handleSaveVideoTime = async () => {
  try {
    const selectedTime = videoAvailableTime.value;

    // 留空表示立即开放。
    let formattedTime = '';
    if (selectedTime instanceof Date) {
      const date = videoAvailableTime.value;
      formattedTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    } else if (typeof videoAvailableTime.value === 'string') {
      formattedTime = videoAvailableTime.value;
    } else if (videoAvailableTime.value) {
      // dayjs 对象
      formattedTime = videoAvailableTime.value.format('YYYY-MM-DD HH:mm:ss');
    }

    await ancestorApi.updateVideoAvailableTime(
      currentVideo.value.id,
      formattedTime,
    );

    // 临时更新本地数据
    if (currentOrder.value?.videos) {
      const video = currentOrder.value.videos.find(
        (v) => v.id === currentVideo.value.id,
      );
      if (video) {
        video.availableAt = formattedTime;
      }
    }

    message.success('设置成功');
    videoTimeVisible.value = false;
    currentVideo.value = null;
    videoAvailableTime.value = '';
  } catch (error) {
    console.error('设置失败:', error);
    message.error('设置失败');
  }
};

// 删除视频
const handleDeleteVideo = (video: any) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除该视频吗？删除后无法恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await ancestorApi.deleteVideo(video.id);

        // 临时更新本地数据
        if (currentOrder.value?.videos) {
          const index = currentOrder.value.videos.findIndex(
            (v) => v.id === video.id,
          );
          if (index !== -1) {
            currentOrder.value.videos.splice(index, 1);
            currentOrder.value.videoCount = currentOrder.value.videos.length;
          }
        }

        message.success('删除成功');
        await fetchOrders();
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      }
    },
  });
};

// 取消祭祀
const handleCancelRitual = (record: RitualOrder) => {
  Modal.confirm({
    title: '确认取消祭祀',
    content: `确定要取消订单"${record.orderNo}"的祭祀吗？取消后将从待祭祀列表中移除。`,
    okText: '确认取消',
    okType: 'danger',
    cancelText: '我再想想',
    onOk: async () => {
      try {
        await ancestorApi.updateRitualOrder(record.id, {
          status: RitualStatus.CANCELLED,
        });
        message.success('已取消祭祀');
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

<script lang="ts">
export default { name: 'AncestorRitualOrders' };
</script>

<template>
  <Page title="代祭祀订单">
    <Card :bordered="false">
      <!-- 搜索区域 -->
      <div class="search-form">
        <Space :size="16" wrap>
          <div class="search-item">
            <label>订单编号</label>
            <Input
              v-model:value="searchForm.orderNo"
              placeholder="请输入订单编号"
              style="width: 180px"
              @press-enter="handleSearch"
            />
          </div>
          <div class="search-item">
            <label>下单人</label>
            <Input
              v-model:value="searchForm.orderName"
              placeholder="请输入下单人姓名"
              style="width: 150px"
              @press-enter="handleSearch"
            />
          </div>
          <div class="search-item">
            <label>亡故亲人</label>
            <Input
              v-model:value="searchForm.deceasedName"
              placeholder="请输入亡故亲人姓名"
              style="width: 150px"
              @press-enter="handleSearch"
            />
          </div>
          <div class="search-item">
            <label>订单状态</label>
            <Select
              v-model:value="searchForm.status"
              placeholder="请选择状态"
              style="width: 140px"
              allow-clear
            >
              <Select.Option value="">全部</Select.Option>
              <Select.Option value="PAID">已支付</Select.Option>
              <Select.Option value="PREPARING">准备中</Select.Option>
              <Select.Option value="PACKAGING">封包中</Select.Option>
              <Select.Option value="BURNING">焚化中</Select.Option>
              <Select.Option value="PENDING_VIDEO">待上传视频</Select.Option>
            </Select>
          </div>
          <Button type="primary" @click="handleSearch">搜索</Button>
          <Button @click="handleReset">重置</Button>
        </Space>
      </div>

      <!-- 表格 -->
      <Space class="mb-4">
        <span>列表字段：</span>
        <Select
          mode="multiple"
          :value="visibleColumnKeys"
          :options="columnOptions"
          placeholder="选择显示字段"
          style="min-width: 320px"
          @change="saveVisibleColumns"
        />
      </Space>
      <Table
        :columns="tableColumns"
        :data-source="orders"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }"
        :scroll="{ x: 1400 }"
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
          <template v-if="column.key === 'videoCount'">
            <Tag v-if="record.videoCount > 0" color="green">
{{ record.videoCount }} 个
</Tag>
            <Tag v-else color="default">未上传</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button
                v-if="shouldShowUploadButton(record.status)"
                type="primary"
                size="small"
                @click="handleUploadVideo(record)"
              >
                {{ getUploadButtonText(record.status) }}
              </Button>
              <Button
                type="link"
                size="small"
                @click="handleViewDetail(record)"
              >
                查看详情
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 订单详情弹窗 - 使用共享组件 -->
    <OrderDetailModal
      v-model:visible="detailVisible"
      :order="currentOrder"
      :show-operations="true"
      :show-upload-buttons="
        !!currentOrder && shouldShowUploadButton(currentOrder.status)
      "
      @upload-video="handleUploadVideoByStage"
      @view-video="handleViewVideo"
      @set-video-time="handleSetVideoTime"
      @delete-video="handleDeleteVideo"
      @cancel-ritual="handleCancelRitual"
    />

    <!-- 视频上传弹窗 -->
    <Modal
      v-model:open="uploadVisible"
      :title="
        uploadingOrder ? getUploadButtonText(uploadingOrder.status) : '上传视频'
      "
      :width="600"
      :closable="!uploading"
      :mask-closable="!uploading"
      @cancel="handleCloseUpload"
    >
      <div class="upload-container">
        <Upload
          v-model:file-list="fileList"
          :custom-request="customRequest"
          :before-upload="beforeUpload"
          accept="video/*"
          list-type="picture-card"
          :disabled="uploading"
        >
          <div v-if="!uploading">
            <div style="margin-top: 8px">点击上传视频</div>
          </div>
        </Upload>

        <div v-if="uploading" class="upload-progress">
          <div class="progress-text">上传中... {{ uploadProgress }}%</div>
          <div class="progress-bar">
            <div
              class="progress-bar-inner"
              :style="{ width: `${uploadProgress }%` }"
            ></div>
          </div>
        </div>

        <div class="upload-tips">
          <p>支持的视频格式：MP4</p>
          <p>视频大小不超过 100MB</p>
          <p>可以多次上传视频，上传完成后点击"确认"按钮</p>
        </div>
      </div>

      <template #footer>
        <Space>
          <Button @click="handleCloseUpload" :disabled="uploading">
            取消
          </Button>
          <Button
            type="primary"
            @click="handleConfirmUpload"
            :disabled="uploading"
          >
            确认
          </Button>
        </Space>
      </template>
    </Modal>

    <!-- 设置视频可查看时间弹窗 -->
    <Modal
      v-model:open="videoTimeVisible"
      title="设置视频可查看时间"
      :width="500"
      @ok="handleSaveVideoTime"
    >
      <div class="py-4">
        <div class="mb-4">
          <div class="mb-2 text-gray-600">当前设置的时间:</div>
          <div v-if="currentVideo?.availableAt" class="text-base mb-4">
            <Tag color="blue">{{ currentVideo.availableAt }}</Tag>
          </div>
          <div v-else class="text-gray-400 mb-4">暂未设置（立即可查看）</div>
        </div>
        <div>
          <div class="mb-2 font-medium">新的可查看时间:</div>
          <DatePicker
            v-model:value="videoAvailableTime"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择可查看时间"
            style="width: 100%"
          />
          <div class="mt-2 text-sm text-gray-500">
            <ClockCircleOutlined class="mr-1" />
            用户只有到达设置的时间后才能查看该视频。留空表示立即可查看。
          </div>
        </div>
      </div>
    </Modal>

    <!-- 视频播放弹窗 -->
    <Modal
      v-model:open="videoPlayerVisible"
      title="视频播放"
      :width="900"
      :footer="null"
      :centered="true"
      @cancel="currentVideoUrl = ''"
    >
      <div class="video-player-wrapper">
        <video
          v-if="currentVideoUrl"
          :src="currentVideoUrl"
          controls
          autoplay
          class="video-player"
        >
          您的浏览器不支持视频播放
        </video>
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.search-form {
  margin-bottom: 16px;
}

.search-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-item label {
  font-size: 14px;
  white-space: nowrap;
}

.mt-4 {
  margin-top: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.price {
  font-size: 16px;
  font-weight: 500;
  color: #d97706;
}

.detail-container {
  max-height: 70vh;
  overflow-y: auto;
}

.video-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.empty-video,
.empty-log {
  padding: 40px 0;
  color: #999;
  text-align: center;
}

.text-center {
  text-align: center;
}

.text-gray {
  margin: 4px 0;
  color: #6b7280;
}

.text-sm {
  font-size: 12px;
}

.upload-container {
  padding: 20px 0;
}

.upload-progress {
  margin-top: 20px;
}

.progress-text {
  margin-bottom: 10px;
  font-size: 14px;
  color: #1890ff;
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 20px;
  overflow: hidden;
  background-color: #f0f0f0;
  border-radius: 10px;
}

.progress-bar-inner {
  height: 100%;
  background-color: #1890ff;
  transition: width 0.3s ease;
}

.upload-tips {
  padding: 12px;
  margin-top: 20px;
  font-size: 12px;
  color: #666;
  background-color: #f6f8fa;
  border-radius: 4px;
}

.upload-tips p {
  margin: 4px 0;
}

/* 视频卡片样式 */
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.video-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.video-card:hover {
  box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
  transform: translateY(-2px);
}

.video-thumbnail {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  overflow: hidden;
  cursor: pointer;
  background: #000;
}

.thumbnail-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 30%);
  transition: all 0.3s ease;
}

.video-thumbnail:hover .play-overlay {
  background: rgb(0 0 0 / 50%);
}

.play-icon {
  font-size: 48px;
  color: rgb(255 255 255 / 90%);
  transition: all 0.3s ease;
}

.video-thumbnail:hover .play-icon {
  font-size: 56px;
  color: #fff;
}

.thumbnail-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.video-locked {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  background: rgb(0 0 0 / 75%);
}

.video-locked .anticon {
  font-size: 24px;
}

.video-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}

.video-time {
  display: flex;
  align-items: center;
  min-height: 20px;
  font-size: 12px;
  color: #6b7280;
}

.video-button-row {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.video-button-row .ant-btn {
  display: flex;
  flex: 1;
  gap: 4px;
  align-items: center;
  justify-content: center;
  height: 32px;
  font-size: 12px;
}

.video-button-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px solid #f3f4f6;
}

.video-button-group .ant-btn {
  height: 28px;
  font-size: 12px;
}

.video-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px solid #f3f4f6;
}

.video-actions .ant-btn-link {
  height: auto;
  padding: 4px 8px;
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.empty-icon {
  margin-bottom: 12px;
  font-size: 48px;
  opacity: 0.5;
}

.video-section {
  padding: 16px 0;
}

.video-section:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

.video-player-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 500px;
  overflow: hidden;
  background: #000;
  border-radius: 8px;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
