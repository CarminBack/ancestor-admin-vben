<script setup lang="ts">
import { ref, reactive, onMounted, onActivated } from 'vue';
import { Page } from '@vben/common-ui';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  message,
  Modal,
  DatePicker,
} from 'antdv-next';
import { ancestorApi, type RitualOrder, type RitualOrderDetail } from '#/api/ancestor';
import OrderDetailModal from './components/OrderDetailModal.vue';

const loading = ref(false);
const records = ref<RitualOrder[]>([]);
const total = ref(0);
const videoModalVisible = ref(false);
const currentRecord = ref<RitualOrderDetail>();

// 视频时间设置相关
const videoTimeVisible = ref(false);
const currentVideo = ref<any>(null);
const videoAvailableTime = ref<any>('');

// 视频播放相关
const videoPlayerVisible = ref(false);
const currentVideoUrl = ref<string>('');

const searchForm = reactive({
  orderName: '',
  deceasedName: '',
  ritualDate: undefined as string | undefined,
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const columns = [
  { title: '祭祀编号', dataIndex: 'orderNo', key: 'orderNo', width: 150 },
  { title: '下单人', dataIndex: 'orderName', key: 'orderName', width: 100 },
  { title: '亡故亲人', dataIndex: 'deceasedName', key: 'deceasedName', width: 100 },
  { title: '祭祀日期', dataIndex: 'ritualDate', key: 'ritualDate', width: 120 },
  { title: '祭祀套餐', dataIndex: 'packageName', key: 'packageName', width: 120 },
  { title: '视频数量', key: 'videoCount', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
];

const statusColorMap: Record<string, string> = {
  COMPLETED: 'green',
  CANCELLED: 'red',
  PENDING_VIDEO: 'purple',
};

const statusTextMap: Record<string, string> = {
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  PENDING_VIDEO: '待上传视频',
};

onActivated(() => { if (!loading.value) fetchRecords(); });

const fetchRecords = async () => {
  loading.value = true;
  try {
    const res = await ancestorApi.ritualOrders({
      ...searchForm,
      orderView: 'records', // 已完成和已取消的订单归档
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
    records.value = res.items;
    total.value = res.total;
  } catch (error) {
    console.error('获取祭祀记录失败:', error);
    message.error('获取祭祀记录失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.current = 1;
  fetchRecords();
};

const handleReset = () => {
  searchForm.orderName = '';
  searchForm.deceasedName = '';
  searchForm.ritualDate = undefined;
  pagination.current = 1;
  fetchRecords();
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchRecords();
};

const handleViewVideos = async (record: RitualOrder) => {
  try {
    const res = await ancestorApi.getRitualOrder(record.id);
    currentRecord.value = res;
    videoModalVisible.value = true;
  } catch (error) {
    console.error('获取视频信息失败:', error);
    message.error('获取视频信息失败');
  }
};

// 查看视频
const handleViewVideo = (url: string) => {
  currentVideoUrl.value = url;
  videoPlayerVisible.value = true;
};

// 设置视频查看时间
const handleSetVideoTime = (video: any) => {
  currentVideo.value = video;
  videoAvailableTime.value = video.availableAt || '';
  videoTimeVisible.value = true;
};

// 保存视频可查看时间
const handleSaveVideoTime = async () => {
  try {
    if (!videoAvailableTime.value) {
      message.error('请选择可查看时间');
      return;
    }

    // 格式化时间为 YYYY-MM-DD HH:mm:ss
    let formattedTime = '';
    if (videoAvailableTime.value instanceof Date) {
      const date = videoAvailableTime.value;
      formattedTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    } else if (typeof videoAvailableTime.value === 'string') {
      formattedTime = videoAvailableTime.value;
    } else {
      // dayjs 对象
      formattedTime = videoAvailableTime.value.format('YYYY-MM-DD HH:mm:ss');
    }

    await ancestorApi.updateVideoAvailableTime(currentVideo.value.id, formattedTime);
    if (currentRecord.value?.videos) {
      const video = currentRecord.value.videos.find(v => v.id === currentVideo.value.id);
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
        if (currentRecord.value?.videos) {
          const index = currentRecord.value.videos.findIndex(v => v.id === video.id);
          if (index > -1) {
            currentRecord.value.videos.splice(index, 1);
            currentRecord.value.videoCount = currentRecord.value.videos.length;
          }
        }

        message.success('删除成功');
        await fetchRecords();
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      }
    },
  });
};

onMounted(() => {
  fetchRecords();
});
</script>

<template>
  <Page title="祭祀记录">
    <Card :bordered="false">
      <!-- 搜索区域 -->
      <div class="search-form">
        <Space :size="16" wrap>
          <div class="search-item">
            <label>下单人姓名</label>
            <Input
              v-model:value="searchForm.orderName"
              placeholder="请输入下单人姓名"
              style="width: 180px"
              @press-enter="handleSearch"
            />
          </div>
          <div class="search-item">
            <label>亡故亲人姓名</label>
            <Input
              v-model:value="searchForm.deceasedName"
              placeholder="请输入亡故亲人姓名"
              style="width: 180px"
              @press-enter="handleSearch"
            />
          </div>
          <Button type="primary" @click="handleSearch">搜索</Button>
          <Button @click="handleReset">重置</Button>
        </Space>
      </div>

      <!-- 表格 -->
      <Table
        :columns="columns"
        :data-source="records"
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
          <template v-if="column.key === 'videoCount'">
            <Tag v-if="record.videoCount > 0" color="green">{{ record.videoCount }} 个视频</Tag>
            <Tag v-else color="default">未上传</Tag>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[record.status]">
              {{ statusTextMap[record.status] || '已完成' }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleViewVideos(record)">
                查看视频
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 使用共享的订单详情组件，隐藏订单操作 -->
    <OrderDetailModal
      v-model:visible="videoModalVisible"
      :order="currentRecord"
      :show-operations="false"
      :show-upload-buttons="false"
      @view-video="handleViewVideo"
      @set-video-time="handleSetVideoTime"
      @delete-video="handleDeleteVideo"
    />

    <!-- 设置视频可查看时间弹窗 -->
    <Modal
      v-model:open="videoTimeVisible"
      title="设置视频可查看时间"
      :width="400"
      @ok="handleSaveVideoTime"
    >
      <div class="py-4">
        <label class="block mb-2">选择可查看时间：</label>
        <DatePicker
          v-model:value="videoAvailableTime"
          show-time
          format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择时间"
          style="width: 100%"
        />
      </div>
    </Modal>

    <!-- 视频播放弹窗 -->
    <Modal
      v-model:open="videoPlayerVisible"
      title="视频播放"
      :width="800"
      :footer="null"
      @cancel="currentVideoUrl = ''"
    >
      <div class="video-player-wrapper">
        <video
          v-if="currentVideoUrl"
          :src="currentVideoUrl"
          controls
          class="video-player"
        />
      </div>
    </Modal>
  </Page>
</template>

<script lang="ts">
import { h } from 'vue';
export default { name: 'AncestorRitualRecords' };
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

.mb-4 {
  margin-bottom: 16px;
}

.mb-6 {
  margin-bottom: 24px;
}

.price {
  color: #f5222d;
  font-weight: 600;
  font-size: 16px;
}

.detail-container {
  max-height: 70vh;
  overflow-y: auto;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.video-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: #fff;
}

.video-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.video-thumbnail {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background: #000;
  cursor: pointer;
  overflow: hidden;
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 1;
}

.video-thumbnail:hover .play-overlay {
  background: rgba(0, 0, 0, 0.5);
}

.play-icon {
  font-size: 48px;
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.video-thumbnail:hover .play-icon {
  font-size: 56px;
  color: #fff;
}

.video-locked {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 12px;
  gap: 8px;
  z-index: 2;
}

.video-locked .anticon {
  font-size: 24px;
}

.video-info {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.video-time {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
  min-height: 20px;
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
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.video-section {
  padding: 16px 0;
}

.video-section:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

.empty-log {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
}

.text-gray {
  color: #6b7280;
}

.text-sm {
  font-size: 12px;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.text-base {
  font-size: 14px;
}

.font-semibold {
  font-weight: 600;
}

.text-xs {
  font-size: 12px;
}

.text-green-600 {
  color: #16a34a;
}

.mr-1 {
  margin-right: 4px;
}

.video-player-wrapper {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.py-4 {
  padding-top: 16px;
  padding-bottom: 16px;
}

.block {
  display: block;
}

.mb-2 {
  margin-bottom: 8px;
}
</style>
